/**
 * ============================================
 * PROGRESS CONTROLLER
 * ============================================
 * Handles progress tracking and reporting
 */

const ProgressLog = require('../models/ProgressLog');
const ClientProfile = require('../models/ClientProfile');
const { AppError } = require('../middleware/errorHandler');
const { normalizeAndValidateProgressLogPayload } = require('../utils/progressLogHelpers');

/**
 * Get progress logs
 */
const getProgress = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { limit = 20, skip = 0, logType, startDate, endDate } = req.query;

    const query = { clientId };
    if (logType) query.logType = logType;
    if (startDate || endDate) {
      query.logDate = {};
      if (startDate) query.logDate.$gte = new Date(startDate);
      if (endDate) query.logDate.$lte = new Date(endDate);
    }

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
 * Create progress log
 */
const createProgress = async (req, res, next) => {
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
      message: 'Progress log created successfully',
      data: { progressLog }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get progress by ID
 */
const getProgressById = async (req, res, next) => {
  try {
    const progressId = req.params.id || req.params.progressId;

    const progress = await ProgressLog.findById(progressId);

    if (!progress) {
      throw new AppError('Progress log not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Progress retrieved',
      data: { progress }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update progress log
 */
const updateProgress = async (req, res, next) => {
  try {
    const progressId = req.params.id || req.params.progressId;

    const progress = await ProgressLog.findByIdAndUpdate(progressId, req.body, { new: true, runValidators: true });

    if (!progress) {
      throw new AppError('Progress log not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { progress }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete progress log
 */
const deleteProgress = async (req, res, next) => {
  try {
    const progressId = req.params.id || req.params.progressId;

    await ProgressLog.findByIdAndDelete(progressId);

    res.status(200).json({
      success: true,
      message: 'Progress log deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get progress statistics
 */
const getProgressStats = async (req, res, next) => {
  try {
    const clientId = req.params.id || req.params.clientId || req.user.id;
    const { startDate, endDate } = req.query;

    const query = { clientId };
    if (startDate || endDate) {
      query.logDate = {};
      if (startDate) query.logDate.$gte = new Date(startDate);
      if (endDate) query.logDate.$lte = new Date(endDate);
    }

    // Get various statistics
    const workoutCount = await ProgressLog.countDocuments({ ...query, logType: 'workout' });
    const nutritionCount = await ProgressLog.countDocuments({ ...query, logType: 'nutrition' });
    const measurementCount = await ProgressLog.countDocuments({ ...query, logType: 'measurement' });
    const milestoneCount = await ProgressLog.countDocuments({ ...query, logType: 'milestone' });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyWorkoutCount = await ProgressLog.countDocuments({
      clientId,
      logType: 'workout',
      logDate: { $gte: startOfMonth },
    });

    const measurements = await ProgressLog.find({ ...query, logType: 'measurement' })
      .sort({ logDate: -1 })
      .limit(1);
    const latestMeasurement = measurements[0]?.measurementLog || null;

    let currentWeight = latestMeasurement?.weight ?? null;
    if (currentWeight == null) {
      const profile = await ClientProfile.findOne({ userId: clientId }).select('currentWeight');
      currentWeight = profile?.currentWeight ?? null;
    }

    const nutritionLogs = await ProgressLog.find({ clientId, logType: 'nutrition' }).select(
      'nutritionLog.totalCalories'
    );
    const calorieValues = nutritionLogs
      .map((log) => log.nutritionLog?.totalCalories)
      .filter((value) => value != null && !Number.isNaN(Number(value)));
    const averageCalories =
      calorieValues.length > 0
        ? calorieValues.reduce((sum, value) => sum + Number(value), 0) / calorieValues.length
        : 0;

    res.status(200).json({
      success: true,
      message: 'Progress statistics retrieved',
      data: {
        stats: {
          workoutCount,
          monthlyWorkoutCount,
          totalWorkouts: workoutCount,
          nutritionCount,
          measurementCount,
          milestoneCount,
          latestMeasurement,
          currentWeight,
          averageCalories,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProgress,
  createProgress,
  getProgressById,
  updateProgress,
  deleteProgress,
  getProgressStats
};
