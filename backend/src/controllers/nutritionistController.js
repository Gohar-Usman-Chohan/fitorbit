/**
 * ============================================
 * NUTRITIONIST CONTROLLER
 * ============================================
 * Handles nutritionist-specific operations
 */

const NutritionistProfile = require('../models/NutritionistProfile');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const DietPlan = require('../models/DietPlan');
const ProgressLog = require('../models/ProgressLog');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');
const { formatDashboardStats, formatAppointment, formatPublicExpertListing } = require('../utils/responseFormatters');
const { extractUserInfo } = require('../utils/helpers');
const { DIET_TYPES, MEAL_TYPES } = require('../config/constants');
const { notifyClientDietPlan } = require('../utils/planNotificationHelpers');
const { validateDietPlanInput, validateMeals } = require('../utils/validators');
const { getNutritionistContactClientIds, getNutritionistAssignableClientIds, buildClientListUserQuery, assertAssignableClient } = require('../utils/clientListHelpers');

const normalizeMeals = (meals) => {
  if (!Array.isArray(meals)) return [];

  return meals
    .filter((meal) => meal?.mealName?.trim())
    .map((meal) => ({
      mealName: meal.mealName.trim(),
      mealType: Object.values(MEAL_TYPES).includes(meal.mealType)
        ? meal.mealType
        : MEAL_TYPES.BREAKFAST,
      calories: meal.calories != null && meal.calories !== '' ? Number(meal.calories) : undefined,
      portions: meal.portions?.trim() || undefined,
    }));
};

const getNutritionistClientIds = async (nutritionistId, scope = 'contact') => {
  if (scope === 'assignable') {
    return getNutritionistAssignableClientIds(nutritionistId);
  }

  return getNutritionistContactClientIds(nutritionistId);
};

const enrichNutritionistClient = async (user, profileDoc, nutritionistId) => {
  const clientUserId = user._id;
  const activePlan = await DietPlan.findOne({
    clientId: clientUserId,
    nutritionistId,
    status: 'active'
  }).select('title status dietType duration calorieTarget mealsPerDay');

  const nutritionLogsCount = await ProgressLog.countDocuments({
    clientId: clientUserId,
    logType: 'nutrition',
    visibleToNutritionist: true
  });

  const targetLogs = activePlan?.mealsPerDay && activePlan?.duration
    ? Number(activePlan.mealsPerDay) * Number(activePlan.duration) * 7
    : activePlan
      ? 28
      : 0;

  const compliance =
    targetLogs > 0
      ? Math.min(100, Math.round((nutritionLogsCount / targetLogs) * 100))
      : null;

  return {
    id: clientUserId.toString(),
    userId: clientUserId,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client',
    email: user.email,
    joinedAt: user.createdAt || profileDoc?.createdAt,
    accountStatus: user.accountStatus || 'active',
    isEmailVerified: user.isEmailVerified ?? false,
    assignedNutritionistId: profileDoc?.assignedNutritionistId || null,
    activePlan,
    nutritionLogsCount,
    compliance,
    status: activePlan ? 'active' : profileDoc?.assignedNutritionistId ? 'pending' : 'pending',
    planTitle: activePlan?.title || 'Not assigned'
  };
};

const getOrCreateNutritionistProfileDoc = async (nutritionistId, user) => {
  let profile = await NutritionistProfile.findOne({ userId: nutritionistId });
  if (!profile) {
    profile = await NutritionistProfile.create({
      userId: nutritionistId,
      bio: user?.bio || `${user?.firstName || 'Nutritionist'} ${user?.lastName || ''}`.trim(),
      yearsOfExperience: 0,
      consultationFee: 0
    });
  }
  return profile;
};

/**
 * Get all nutritionists (public endpoint)
 */
const getAllNutritionists = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const nutritionists = await User.find({ role: 'nutritionist', accountStatus: 'active' })
      .select('firstName lastName email bio profilePicture createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments({ role: 'nutritionist', accountStatus: 'active' });

    // Get nutritionist profiles with specializations and ratings
    const nutritionistsWithProfiles = await Promise.all(
      nutritionists.map(async (nutritionist) => {
        const profile = await NutritionistProfile.findOne({ userId: nutritionist._id });
        return formatPublicExpertListing(nutritionist, 'nutritionist', profile);
      })
    );

    res.status(200).json({
      success: true,
      message: 'Nutritionists retrieved',
      data: {
        nutritionists: nutritionistsWithProfiles,
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
 * Get nutritionist dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    
    const profile = await NutritionistProfile.findOne({ userId: nutritionistId });
    const clientIds = await getNutritionistContactClientIds(nutritionistId);
    const totalClients = clientIds.length;
    const activeDiets = await DietPlan.countDocuments({ nutritionistId, status: 'active' });
    const upcomingAppointments = await Appointment.find({
      expertId: nutritionistId,
      appointmentDate: { $gte: new Date() },
      status: 'scheduled'
    }).limit(5);

    res.status(200).json({
      success: true,
      message: 'Nutritionist dashboard retrieved',
      data: formatDashboardStats(
        {
          profile,
          totalClients,
          activeDiets,
          upcomingAppointments
        },
        'nutritionist'
      )
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nutritionist's clients
 */
const getClients = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    const { limit = 50, skip = 0, scope = 'contact' } = req.query;
    const listScope = scope === 'assignable' ? 'assignable' : 'contact';

    const clientIds = await getNutritionistClientIds(nutritionistId, listScope);
    const total = clientIds.length;
    const paginatedIds = clientIds.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    if (paginatedIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Clients retrieved',
        data: { clients: [], total: 0, limit: parseInt(limit), skip: parseInt(skip) }
      });
    }

    const users = await User.find(buildClientListUserQuery(paginatedIds, listScope)).select(
      'firstName lastName email profilePicture createdAt accountStatus isEmailVerified'
    );

    const profiles = await ClientProfile.find({ userId: { $in: paginatedIds } });
    const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    const clientsWithPlans = await Promise.all(
      users.map((user) =>
        enrichNutritionistClient(user, profileByUserId.get(String(user._id)), nutritionistId)
      )
    );

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
 * Get nutritionist's meal plans
 */
const getMealPlans = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    const { limit = 20, skip = 0, status } = req.query;

    const query = { nutritionistId };
    if (status) query.status = status;

    const plans = await DietPlan.find(query)
      .populate('clientId', 'firstName lastName')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await DietPlan.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Meal plans retrieved',
      data: {
        plans,
        workouts: plans,
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
 * Create meal plan for client
 */
const createMealPlan = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    const { clientId, title, description, dietType, duration, calorieTarget, macronutrients, mealsPerDay, startDate, meals } = req.body;

    validateDietPlanInput(req.body);
    await assertAssignableClient(clientId);

    const plan = new DietPlan({
      nutritionistId,
      clientId,
      title,
      description,
      dietType,
      duration: Number(duration),
      calorieTarget: Number(calorieTarget) || 2000,
      macronutrients: macronutrients || { protein: 30, carbs: 40, fats: 30 },
      mealsPerDay: Number(mealsPerDay) || 3,
      meals: normalizeMeals(meals),
      startDate,
      status: 'active'
    });

    await plan.save();

    const clientProfile = await ClientProfile.findOne({ userId: clientId });
    if (clientProfile && !clientProfile.assignedNutritionistId) {
      clientProfile.assignedNutritionistId = nutritionistId;
      await clientProfile.save();
    }

    await notifyClientDietPlan(req, {
      clientId,
      expertId: nutritionistId,
      plan,
      isUpdate: false,
    });

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update meal plan
 */
const updateMealPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const nutritionistId = req.user._id || req.user.id;

    const plan = await DietPlan.findOne({ _id: planId, nutritionistId });

    if (!plan) {
      throw new AppError('Meal plan not found or unauthorized', 404);
    }

    const {
      title,
      description,
      dietType,
      duration,
      calorieTarget,
      macronutrients,
      mealsPerDay,
      startDate,
      status,
      nutritionistNotes,
      meals,
    } = req.body;

    if (title !== undefined) plan.title = title;
    if (description !== undefined) plan.description = description;
    if (dietType !== undefined) plan.dietType = dietType;
    if (duration !== undefined) plan.duration = Number(duration);
    if (calorieTarget !== undefined) plan.calorieTarget = Number(calorieTarget);
    if (macronutrients !== undefined) plan.macronutrients = macronutrients;
    if (mealsPerDay !== undefined) plan.mealsPerDay = Number(mealsPerDay);
    if (startDate !== undefined) plan.startDate = startDate;
    if (status !== undefined) plan.status = status;
    if (nutritionistNotes !== undefined) plan.nutritionistNotes = nutritionistNotes;

    if (Array.isArray(meals)) {
      validateMeals(meals);
      plan.meals = normalizeMeals(meals);
    }

    plan.lastModifiedBy = nutritionistId;
    await plan.save();

    if (Array.isArray(meals)) {
      await notifyClientDietPlan(req, {
        clientId: plan.clientId,
        expertId: nutritionistId,
        plan,
        isUpdate: true,
        contentUpdated: true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal plan updated successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete meal plan
 */
const deleteMealPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const nutritionistId = req.user._id || req.user.id;

    await DietPlan.findOneAndDelete({ _id: planId, nutritionistId });

    res.status(200).json({
      success: true,
      message: 'Meal plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client assessments/nutrition logs
 */
const getAssessments = async (req, res, next) => {
  try {
    const clientId = req.params.clientId || req.query.clientId;
    const { limit = 20, skip = 0 } = req.query;

    const query = { logType: 'nutrition', visibleToNutritionist: true };
    if (clientId) query.clientId = clientId;

    const assessments = await ProgressLog.find(query)
      .sort({ logDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ProgressLog.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Assessments retrieved',
      data: {
        assessments,
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
 * Update assessment/provide feedback
 */
const updateAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { nutritionistFeedback } = req.body;

    const assessment = await ProgressLog.findByIdAndUpdate(
      assessmentId,
      { nutritionistFeedback },
      { new: true }
    );

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: { assessment }
    });
  } catch (error) {
    next(error);
  }
};

const provideClientFeedback = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { feedback, nutritionistFeedback } = req.body;

    const assessment = await ProgressLog.findOneAndUpdate(
      { clientId, logType: 'nutrition', visibleToNutritionist: true },
      { nutritionistFeedback: nutritionistFeedback || feedback },
      { new: true, sort: { logDate: -1 } }
    );

    if (!assessment) {
      throw new AppError('No nutrition assessment found for this client', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { assessment }
    });
  } catch (error) {
    next(error);
  }
};

const getSchedule = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    const { startDate, endDate } = req.query;

    const query = { expertId: nutritionistId };
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

const getAvailability = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    const user = await User.findById(nutritionistId);
    const profile = await getOrCreateNutritionistProfileDoc(nutritionistId, user);

    res.status(200).json({
      success: true,
      message: 'Availability retrieved',
      data: { availability: profile.availability || [] }
    });
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const nutritionistId = req.user._id || req.user.id;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      throw new AppError('Availability must be an array', 400);
    }

    const user = await User.findById(nutritionistId);
    const profile = await getOrCreateNutritionistProfileDoc(nutritionistId, user);
    profile.availability = availability;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: profile.availability }
    });
  } catch (error) {
    next(error);
  }
};

const getClientProgress = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const progress = await ProgressLog.find({
      clientId,
      visibleToNutritionist: true
    })
      .sort({ logDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ProgressLog.countDocuments({
      clientId,
      visibleToNutritionist: true
    });

    res.status(200).json({
      success: true,
      message: 'Client progress retrieved',
      data: {
        progress,
        assessments: progress.filter((log) => log.logType === 'nutrition'),
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
  getAllNutritionists,
  getDashboard,
  getClients,
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getAssessments,
  updateAssessment,
  provideClientFeedback,
  getSchedule,
  getAvailability,
  updateAvailability,
  getClientProgress
};
