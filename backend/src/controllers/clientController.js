/**
 * ============================================
 * CLIENT CONTROLLER
 * ============================================
 * Handles client-specific operations
 */

const ClientProfile = require('../models/ClientProfile');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');
const ProgressLog = require('../models/ProgressLog');
const Appointment = require('../models/Appointment');
const TrainerProfile = require('../models/TrainerProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const { AppError } = require('../middleware/errorHandler');
const { extractUserInfo } = require('../utils/helpers');
const { FITNESS_GOALS } = require('../config/constants');
const { normalizeAndValidateProgressLogPayload } = require('../utils/progressLogHelpers');
const { validateFitnessGoalInput } = require('../utils/validators');
const { formatExpert, formatDashboardStats } = require('../utils/responseFormatters');

const GOAL_ALIASES = {
  'weight loss': FITNESS_GOALS.WEIGHT_LOSS,
  weight_loss: FITNESS_GOALS.WEIGHT_LOSS,
  'muscle gain': FITNESS_GOALS.MUSCLE_GAIN,
  muscle_gain: FITNESS_GOALS.MUSCLE_GAIN,
  'general fitness': FITNESS_GOALS.GENERAL_FITNESS,
  general_fitness: FITNESS_GOALS.GENERAL_FITNESS,
  endurance: FITNESS_GOALS.ENDURANCE,
  flexibility: FITNESS_GOALS.FLEXIBILITY,
  'strength training': FITNESS_GOALS.STRENGTH_TRAINING,
  strength_training: FITNESS_GOALS.STRENGTH_TRAINING,
  rehabilitation: FITNESS_GOALS.REHABILITATION
};

const normalizeGoal = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const alias = GOAL_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  if (Object.values(FITNESS_GOALS).includes(trimmed)) return trimmed;
  return null;
};

const normalizeGoals = (body) => {
  const rawGoals = [];

  if (Array.isArray(body.goals)) {
    rawGoals.push(...body.goals);
  } else if (body.goals) {
    rawGoals.push(body.goals);
  }

  if (body.goal) {
    rawGoals.push(body.goal);
  }

  return [...new Set(rawGoals.map(normalizeGoal).filter(Boolean))];
};

const formatGoalLabel = (goal) =>
  goal.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Ensure a client profile exists (handles users registered before profile auto-creation)
 */
const getOrCreateClientProfile = async (clientId) => {
  let profile = await ClientProfile.findOne({ userId: clientId });
  if (!profile) {
    profile = await ClientProfile.create({ userId: clientId });
  }
  return profile;
};

/**
 * Get client dashboard with summary data
 */
const getDashboard = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const profile = await getOrCreateClientProfile(clientId);
    const activeWorkout = await WorkoutPlan.findOne({ clientId, status: 'active' });
    const activeDiet = await DietPlan.findOne({ clientId, status: 'active' });
    const upcomingAppointments = await Appointment.find({
      clientId,
      appointmentDate: { $gte: new Date() },
      status: 'scheduled'
    }).limit(5);
    const progressLogs = await ProgressLog.find({ clientId }).sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      message: 'Client dashboard retrieved',
      data: {
        profile,
        activeWorkout,
        activeDiet,
        upcomingAppointments,
        recentProgress: progressLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client's fitness goals
 */
const getGoals = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const profile = await getOrCreateClientProfile(clientId);

    res.status(200).json({
      success: true,
      message: 'Goals retrieved',
      data: {
        goals: profile.fitnessGoals.map((goal, index) => ({
          id: String(index),
          goal,
          label: formatGoalLabel(goal),
          goals: [goal],
          currentWeight: profile.currentWeight,
          targetWeight: profile.targetWeight,
          timeline: profile.timeline,
          startingWeight: profile.currentWeight
        })),
        targetWeight: profile.targetWeight,
        currentWeight: profile.currentWeight
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client's assigned plans (workout and diet)
 */
const getPlans = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const workoutPlans = await WorkoutPlan.find({ clientId }).populate('trainerId', 'firstName lastName');
    const dietPlans = await DietPlan.find({ clientId }).populate('nutritionistId', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Plans retrieved',
      data: {
        workoutPlans,
        dietPlans
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create fitness goal
 */
const createGoal = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    validateFitnessGoalInput(req.body);

    const { targetWeight, currentWeight, currentHeight, age, timeline } = req.body;
    const goals = normalizeGoals(req.body);

    if (goals.length === 0) {
      throw new AppError('Goal is required', 400);
    }

    const profile = await getOrCreateClientProfile(clientId);

    if (currentWeight !== undefined && currentWeight !== '') {
      profile.currentWeight = Number(currentWeight);
    }
    if (currentHeight !== undefined && currentHeight !== '') {
      profile.currentHeight = Number(currentHeight);
    }
    if (age !== undefined && age !== '') {
      profile.age = Number(age);
    }
    if (targetWeight !== undefined && targetWeight !== '') {
      profile.targetWeight = Number(targetWeight);
    }
    if (timeline !== undefined && timeline !== '') {
      profile.timeline = Number(timeline);
    }

    goals.forEach((goal) => {
      if (!profile.fitnessGoals.includes(goal)) {
        profile.fitnessGoals.push(goal);
      }
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update fitness goal
 */
const updateGoal = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { goalId: bodyGoalId, ...updates } = req.body;
    const goalId = req.params.goalId || bodyGoalId;

    const profile = await getOrCreateClientProfile(clientId);

    if (updates.targetWeight) profile.targetWeight = updates.targetWeight;
    if (updates.fitnessLevel) profile.fitnessLevel = updates.fitnessLevel;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete fitness goal
 */
const deleteGoal = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { goalId } = req.params;
    const { goal } = req.body;

    const profile = await getOrCreateClientProfile(clientId);

    const index = parseInt(goalId, 10);
    if (!Number.isNaN(index) && profile.fitnessGoals[index]) {
      profile.fitnessGoals.splice(index, 1);
    } else if (goal) {
      profile.fitnessGoals = profile.fitnessGoals.filter((g) => g !== goal);
    } else {
      profile.fitnessGoals = profile.fitnessGoals.filter((g) => g !== goalId);
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get progress logs
 */
const getProgress = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { limit = 20, skip = 0, logType } = req.query;

    const query = { clientId };
    if (logType) query.logType = logType;

    const progress = await ProgressLog.find(query)
      .sort({ logDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ProgressLog.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Progress logs retrieved',
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

/**
 * Add progress log
 */
const addProgress = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const normalized = normalizeAndValidateProgressLogPayload(req.body);

    if (!normalized) {
      throw new AppError('Log type is required', 400);
    }

    const progressLog = new ProgressLog({
      clientId,
      ...normalized
    });

    await progressLog.save();

    res.status(201).json({
      success: true,
      message: 'Progress log added successfully',
      data: { progressLog }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assigned experts (trainers and nutritionists)
 */
const getAssignedExperts = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const profile = await getOrCreateClientProfile(clientId);
    await profile.populate([
      { path: 'assignedTrainerId', select: 'firstName lastName email' },
      { path: 'assignedNutritionistId', select: 'firstName lastName email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Assigned experts retrieved',
      data: {
        trainer: profile.assignedTrainerId,
        nutritionist: profile.assignedNutritionistId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get plan details
 */
const getPlanDetails = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { planType } = req.query; // 'workout' or 'diet'

    if (planType === 'workout') {
      const plan = await WorkoutPlan.findById(planId).populate('trainerId', 'firstName lastName');

      if (!plan) {
        throw new AppError('Workout plan not found', 404);
      }

      return res.status(200).json({
        success: true,
        message: 'Workout plan details retrieved',
        data: { plan }
      });
    } else if (planType === 'diet') {
      const plan = await DietPlan.findById(planId).populate('nutritionistId', 'firstName lastName');

      if (!plan) {
        throw new AppError('Diet plan not found', 404);
      }

      return res.status(200).json({
        success: true,
        message: 'Diet plan details retrieved',
        data: { plan }
      });
    } else {
      throw new AppError('Invalid plan type', 400);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get available trainers for booking
 */
const getAvailableTrainers = async (req, res, next) => {
  try {
    const trainers = await User.find({ role: 'trainer', accountStatus: 'active' })
      .select('firstName lastName email profilePicture')
      .limit(50);

    const profiles = await TrainerProfile.find({
      userId: { $in: trainers.map((t) => t._id) }
    });

    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId.toString(), p]));

    const data = trainers.map((trainer) =>
      formatExpert(
        { ...trainer.toObject(), profile: profileMap[trainer._id.toString()] || null },
        'trainer',
        profileMap[trainer._id.toString()]
      )
    );

    res.status(200).json({
      success: true,
      message: 'Available trainers retrieved',
      data: { trainers: data }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available nutritionists for booking
 */
const getAvailableNutritionists = async (req, res, next) => {
  try {
    const nutritionists = await User.find({ role: 'nutritionist', accountStatus: 'active' })
      .select('firstName lastName email profilePicture')
      .limit(50);

    const profiles = await NutritionistProfile.find({
      userId: { $in: nutritionists.map((n) => n._id) }
    });

    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId.toString(), p]));

    const data = nutritionists.map((nutritionist) =>
      formatExpert(
        { ...nutritionist.toObject(), profile: profileMap[nutritionist._id.toString()] || null },
        'nutritionist',
        profileMap[nutritionist._id.toString()]
      )
    );

    res.status(200).json({
      success: true,
      message: 'Available nutritionists retrieved',
      data: { nutritionists: data }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign trainer to client
 */
const assignTrainer = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { trainerId } = req.params;

    const trainer = await User.findOne({ _id: trainerId, role: 'trainer', accountStatus: 'active' });
    if (!trainer) {
      throw new AppError('Trainer not found', 404);
    }

    let profile = await getOrCreateClientProfile(clientId);

    profile.assignedTrainerId = trainerId;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Trainer assigned successfully',
      data: { profile, trainer }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign nutritionist to client
 */
const assignNutritionist = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { nutritionistId } = req.params;

    const nutritionist = await User.findOne({
      _id: nutritionistId,
      role: 'nutritionist',
      accountStatus: 'active'
    });
    if (!nutritionist) {
      throw new AppError('Nutritionist not found', 404);
    }

    let profile = await getOrCreateClientProfile(clientId);

    profile.assignedNutritionistId = nutritionistId;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Nutritionist assigned successfully',
      data: { profile, nutritionist }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expert details
 */
const getExpertDetails = async (req, res, next) => {
  try {
    const { expertId } = req.params;

    const expert = await User.findById(expertId).select('-password -passwordResetToken -passwordResetExpire');

    if (!expert) {
      throw new AppError('Expert not found', 404);
    }

    let expertProfile;
    if (expert.role === 'trainer') {
      expertProfile = await TrainerProfile.findOne({ userId: expertId });
    } else if (expert.role === 'nutritionist') {
      expertProfile = await NutritionistProfile.findOne({ userId: expertId });
    }

    res.status(200).json({
      success: true,
      message: 'Expert details retrieved',
      data: {
        user: extractUserInfo(expert),
        profile: expertProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getGoals,
  getPlans,
  createGoal,
  updateGoal,
  deleteGoal,
  getProgress,
  addProgress,
  getAssignedExperts,
  getPlanDetails,
  getExpertDetails,
  getAvailableTrainers,
  getAvailableNutritionists,
  assignTrainer,
  assignNutritionist
};
