/**
 * ============================================
 * TRAINER CONTROLLER
 * ============================================
 * Handles trainer-specific operations
 */

const TrainerProfile = require('../models/TrainerProfile');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const WorkoutPlan = require('../models/WorkoutPlan');
const ProgressLog = require('../models/ProgressLog');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');
const { formatDashboardStats, formatAppointment, formatPublicExpertListing } = require('../utils/responseFormatters');
const { extractUserInfo } = require('../utils/helpers');
const { FITNESS_GOALS, WORKOUT_TYPES, WORKOUT_FREQUENCY } = require('../config/constants');
const { notifyClientWorkoutPlan } = require('../utils/planNotificationHelpers');
const { validateWorkoutPlanInput, validateExercises } = require('../utils/validators');
const { getTrainerContactClientIds, getTrainerAssignableClientIds, buildClientListUserQuery, assertAssignableClient } = require('../utils/clientListHelpers');

const normalizeWeeklyFrequency = (frequency) => {
  const value = Number(frequency);
  const { MIN_PER_WEEK, MAX_PER_WEEK } = WORKOUT_FREQUENCY;

  if (!Number.isFinite(value) || value < MIN_PER_WEEK || value > MAX_PER_WEEK) {
    throw new AppError(`Days per week must be between ${MIN_PER_WEEK} and ${MAX_PER_WEEK}`, 400);
  }

  return Math.round(value);
};

const TARGET_GOAL_ALIASES = {
  strength: FITNESS_GOALS.STRENGTH_TRAINING,
  cardio: FITNESS_GOALS.ENDURANCE,
  flexibility: FITNESS_GOALS.FLEXIBILITY,
  mixed: FITNESS_GOALS.GENERAL_FITNESS,
  weight_loss: FITNESS_GOALS.WEIGHT_LOSS,
  muscle_gain: FITNESS_GOALS.MUSCLE_GAIN,
  general_fitness: FITNESS_GOALS.GENERAL_FITNESS,
  strength_training: FITNESS_GOALS.STRENGTH_TRAINING,
};

const normalizeTargetGoals = (goals) => {
  const list = Array.isArray(goals) ? goals : goals ? [goals] : [];
  const normalized = list
    .map((goal) => TARGET_GOAL_ALIASES[String(goal).toLowerCase()] || String(goal).toLowerCase())
    .filter((goal) => Object.values(FITNESS_GOALS).includes(goal));

  return normalized.length > 0 ? normalized : [FITNESS_GOALS.GENERAL_FITNESS];
};

const getTrainerClientIds = async (trainerId, scope = 'contact') => {
  if (scope === 'assignable') {
    return getTrainerAssignableClientIds(trainerId);
  }

  return getTrainerContactClientIds(trainerId);
};

const enrichTrainerClient = async (user, profileDoc, trainerId) => {
  const clientUserId = user._id;
  const activePlan = await WorkoutPlan.findOne({
    clientId: clientUserId,
    trainerId,
    status: 'active'
  }).select('title status workoutType duration difficultyLevel frequency');

  const workoutLogsCount = await ProgressLog.countDocuments({
    clientId: clientUserId,
    logType: 'workout',
    visibleToTrainer: true
  });

  const targetWorkouts =
    activePlan?.frequency && activePlan?.duration
      ? Number(activePlan.frequency) * Number(activePlan.duration)
      : activePlan
        ? 8
        : 0;

  const progress =
    targetWorkouts > 0
      ? Math.min(100, Math.round((workoutLogsCount / targetWorkouts) * 100))
      : null;

  return {
    id: clientUserId.toString(),
    userId: clientUserId,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client',
    email: user.email,
    joinedAt: user.createdAt || profileDoc?.createdAt,
    accountStatus: user.accountStatus || 'active',
    isEmailVerified: user.isEmailVerified ?? false,
    assignedTrainerId: profileDoc?.assignedTrainerId || null,
    activePlan,
    workoutLogsCount,
    progress,
    status: activePlan ? 'active' : profileDoc?.assignedTrainerId ? 'pending' : 'pending',
    planTitle: activePlan?.title || 'Not assigned'
  };
};

/**
 * Get all trainers (public endpoint)
 */
const getAllTrainers = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const trainers = await User.find({ role: 'trainer', accountStatus: 'active' })
      .select('firstName lastName email bio profilePicture createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments({ role: 'trainer', accountStatus: 'active' });

    // Get trainer profiles with specializations and ratings
    const trainersWithProfiles = await Promise.all(
      trainers.map(async (trainer) => {
        const profile = await TrainerProfile.findOne({ userId: trainer._id });
        return formatPublicExpertListing(trainer, 'trainer', profile);
      })
    );

    res.status(200).json({
      success: true,
      message: 'Trainers retrieved',
      data: {
        trainers: trainersWithProfiles,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer dashboard with summary data
 */
const getDashboard = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    
    const profile = await TrainerProfile.findOne({ userId: trainerId });
    const clientIds = await getTrainerContactClientIds(trainerId);
    const totalClients = clientIds.length;
    const activeWorkouts = await WorkoutPlan.countDocuments({ trainerId, status: 'active' });
    const upcomingAppointments = await Appointment.find({
      expertId: trainerId,
      appointmentDate: { $gte: new Date() },
      status: 'scheduled'
    }).limit(5);

    res.status(200).json({
      success: true,
      message: 'Trainer dashboard retrieved',
      data: formatDashboardStats(
        {
          profile,
          totalClients,
          activeWorkouts,
          upcomingAppointments
        },
        'trainer'
      )
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer's clients
 */
const getClients = async (req, res, next) => {
  try {
    const trainerId = req.user._id || req.user.id;
    const { limit = 50, skip = 0, scope = 'contact' } = req.query;
    const listScope = scope === 'assignable' ? 'assignable' : 'contact';

    const clientIds = await getTrainerClientIds(trainerId, listScope);
    const total = clientIds.length;
    const paginatedIds = clientIds.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    if (paginatedIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Clients retrieved',
        data: {
          clients: [],
          total: 0,
          limit: parseInt(limit),
          skip: parseInt(skip)
        }
      });
    }

    const users = await User.find(buildClientListUserQuery(paginatedIds, listScope)).select(
      'firstName lastName email profilePicture createdAt accountStatus isEmailVerified'
    );

    const profiles = await ClientProfile.find({ userId: { $in: paginatedIds } });
    const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    const clientsWithPlans = await Promise.all(
      users.map((user) => enrichTrainerClient(user, profileByUserId.get(String(user._id)), trainerId))
    );

    // Preserve contact order; append any matched users missing from paginated order
    const clientsById = new Map(clientsWithPlans.map((client) => [client.id, client]));
    const orderedClients = paginatedIds
      .map((id) => clientsById.get(String(id)))
      .filter(Boolean);

    orderedClients.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      message: 'Clients retrieved',
      data: {
        clients: orderedClients,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific client's details
 */
const getClientDetails = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const clientProfile = await ClientProfile.findOne({ userId: clientId })
      .populate('userId', 'firstName lastName email phone profilePicture');

    if (!clientProfile) {
      throw new AppError('Client profile not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Client details retrieved',
      data: { clientProfile }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer's workouts
 */
const getWorkouts = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { limit = 20, skip = 0, status } = req.query;

    const query = { trainerId };
    if (status) query.status = status;

    const workouts = await WorkoutPlan.find(query)
      .populate('clientId', 'firstName lastName')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await WorkoutPlan.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Workouts retrieved',
      data: {
        workouts,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create workout plan for client
 */
const createWorkout = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { clientId, title, description, workoutType, duration, difficultyLevel, targetGoals, frequency, exercises, startDate } = req.body;

    validateWorkoutPlanInput(req.body);
    await assertAssignableClient(clientId);

    const workout = new WorkoutPlan({
      trainerId,
      clientId,
      title,
      description,
      workoutType,
      duration: Number(duration),
      difficultyLevel: difficultyLevel || 'beginner',
      targetGoals: normalizeTargetGoals(targetGoals),
      frequency: normalizeWeeklyFrequency(frequency),
      exercises: Array.isArray(exercises)
        ? exercises
            .filter((exercise) => exercise?.exerciseName?.trim())
            .map((exercise) => ({
              exerciseName: exercise.exerciseName.trim(),
              description: exercise.description,
              sets: Number(exercise.sets) || 3,
              reps: Number(exercise.reps) || 10,
              weight: exercise.weight,
              duration: exercise.duration,
              restPeriod: exercise.restPeriod,
            }))
        : [],
      startDate,
      status: 'active'
    });

    await workout.save();

    const clientProfile = await ClientProfile.findOne({ userId: clientId });
    if (clientProfile && !clientProfile.assignedTrainerId) {
      clientProfile.assignedTrainerId = trainerId;
      await clientProfile.save();
    }

    await notifyClientWorkoutPlan(req, {
      clientId,
      expertId: trainerId,
      plan: workout,
      isUpdate: false,
    });

    res.status(201).json({
      success: true,
      message: 'Workout plan created successfully',
      data: { workout }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workout plan
 */
const updateWorkout = async (req, res, next) => {
  try {
    const { workoutId } = req.params;
    const trainerId = req.user.id;

    const workout = await WorkoutPlan.findOne({ _id: workoutId, trainerId });

    if (!workout) {
      throw new AppError('Workout plan not found or unauthorized', 404);
    }

    const {
      title,
      description,
      workoutType,
      duration,
      difficultyLevel,
      targetGoals,
      frequency,
      exercises,
      startDate,
      status,
      trainerNotes,
    } = req.body;

    if (title !== undefined) workout.title = title;
    if (description !== undefined) workout.description = description;
    if (workoutType !== undefined) workout.workoutType = workoutType;
    if (duration !== undefined) workout.duration = Number(duration);
    if (difficultyLevel !== undefined) workout.difficultyLevel = difficultyLevel;
    if (targetGoals !== undefined) workout.targetGoals = normalizeTargetGoals(targetGoals);
    if (frequency !== undefined) workout.frequency = normalizeWeeklyFrequency(frequency);
    if (startDate !== undefined) workout.startDate = startDate;
    if (status !== undefined) workout.status = status;
    if (trainerNotes !== undefined) workout.trainerNotes = trainerNotes;

    if (Array.isArray(exercises)) {
      validateExercises(exercises);
      workout.exercises = exercises
        .filter((exercise) => exercise?.exerciseName?.trim())
        .map((exercise) => ({
          exerciseName: exercise.exerciseName.trim(),
          description: exercise.description,
          sets: Number(exercise.sets) || 3,
          reps: Number(exercise.reps) || 10,
          weight: exercise.weight,
          duration: exercise.duration,
          restPeriod: exercise.restPeriod,
        }));
    }

    workout.lastUpdatedBy = trainerId;
    await workout.save();

    if (Array.isArray(exercises)) {
      await notifyClientWorkoutPlan(req, {
        clientId: workout.clientId,
        expertId: trainerId,
        plan: workout,
        isUpdate: true,
        contentUpdated: true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workout plan updated successfully',
      data: { workout },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete workout plan
 */
const deleteWorkout = async (req, res, next) => {
  try {
    const { workoutId } = req.params;
    const trainerId = req.user.id;

    await WorkoutPlan.findOneAndDelete({ _id: workoutId, trainerId });

    res.status(200).json({
      success: true,
      message: 'Workout plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get workout details
 */
const getWorkoutDetails = async (req, res, next) => {
  try {
    const { workoutId } = req.params;

    const workout = await WorkoutPlan.findById(workoutId).populate('clientId', 'firstName lastName');

    if (!workout) {
      throw new AppError('Workout plan not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Workout details retrieved',
      data: { workout }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer's schedule
 */
const getSchedule = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { expertId: trainerId };
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      message: 'Schedule retrieved',
      data: { appointments: appointments.map(formatAppointment) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability slots
 */
const getAvailability = async (req, res, next) => {
  try {
    const trainerId = req.user.id;

    const profile = await TrainerProfile.findOne({ userId: trainerId });

    if (!profile) {
      throw new AppError('Trainer profile not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Availability retrieved',
      data: { availability: profile.availability }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update availability
 */
const updateAvailability = async (req, res, next) => {
  try {
    const trainerId = req.user.id;
    const { availability } = req.body;

    const profile = await TrainerProfile.findOneAndUpdate(
      { userId: trainerId },
      { availability },
      { new: true }
    );

    if (!profile) {
      throw new AppError('Trainer profile not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: profile.availability }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client's progress
 */
const getClientProgress = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const progress = await ProgressLog.find({ clientId, visibleToTrainer: true })
      .sort({ logDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ProgressLog.countDocuments({ clientId, visibleToTrainer: true });

    res.status(200).json({
      success: true,
      message: 'Client progress retrieved',
      data: {
        progress,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTrainers,
  getDashboard,
  getClients,
  getClientDetails,
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutDetails,
  getSchedule,
  getAvailability,
  updateAvailability,
  getClientProgress
};
