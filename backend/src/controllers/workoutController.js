/**
 * ============================================
 * WORKOUT CONTROLLER
 * ============================================
 * Handles general workout management and exercise library
 */

const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all workouts/exercises
 */
const getWorkouts = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, difficulty, workoutType, q, query: searchQuery } = req.query;
    const search = q || searchQuery;

    const query = { isActive: true };
    if (difficulty) query.difficultyLevel = difficulty;
    if (workoutType) query.workoutType = workoutType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const exercises = await Exercise.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Exercise.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Exercises retrieved',
      data: {
        exercises,
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
 * Get workout/exercise by ID
 */
const getWorkoutById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findById(id);

    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Exercise retrieved',
      data: { exercise }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get workouts by category/workout type
 */
const getWorkoutsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const exercises = await Exercise.find({ workoutType: category, isActive: true })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Exercise.countDocuments({ workoutType: category, isActive: true });

    res.status(200).json({
      success: true,
      message: 'Exercises by category retrieved',
      data: {
        exercises,
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
 * Get workouts by difficulty level
 */
const getWorkoutsByDifficulty = async (req, res, next) => {
  try {
    const { difficulty } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const exercises = await Exercise.find({ difficultyLevel: difficulty, isActive: true })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Exercise.countDocuments({ difficultyLevel: difficulty, isActive: true });

    res.status(200).json({
      success: true,
      message: 'Exercises by difficulty retrieved',
      data: {
        exercises,
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
 * Create new exercise/workout
 */
const createWorkout = async (req, res, next) => {
  try {
    const { name, description, targetMuscles, equipmentRequired, difficultyLevel, instructions, videoUrl } = req.body;

    if (!name || !description) {
      throw new AppError('Exercise name and description are required', 400);
    }

    const exercise = new Exercise({
      name,
      description,
      targetMuscles,
      equipmentRequired,
      difficultyLevel,
      instructions,
      videoUrl,
      createdBy: req.user.id,
      isCustomExercise: req.user.role !== 'admin'
    });

    await exercise.save();

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: { exercise }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workout/exercise
 */
const updateWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: { exercise }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete workout/exercise
 */
const deleteWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkouts,
  getWorkoutById,
  getWorkoutsByCategory,
  getWorkoutsByDifficulty,
  createWorkout,
  updateWorkout,
  deleteWorkout
};
