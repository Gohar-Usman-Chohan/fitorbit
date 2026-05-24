/**
 * ============================================
 * DIET CONTROLLER
 * ============================================
 * Handles diet and meal management
 */

const Meal = require('../models/Meal');
const DietPlan = require('../models/DietPlan');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all meals/diet options
 */
const getDiets = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, dietaryTags, difficultyLevel } = req.query;

    const query = { isActive: true };
    if (dietaryTags) query.dietaryTags = { $in: Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags] };
    if (difficultyLevel) query.difficultyLevel = difficultyLevel;

    const meals = await Meal.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Meal.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Meals retrieved',
      data: {
        meals,
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
 * Get meal/diet by ID
 */
const getDietById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meal = await Meal.findById(id);

    if (!meal) {
      throw new AppError('Meal not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Meal retrieved',
      data: { meal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get meals by category/type
 */
const getDietsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const meals = await Meal.find({ mealType: category, isActive: true })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Meal.countDocuments({ mealType: category, isActive: true });

    res.status(200).json({
      success: true,
      message: 'Meals by category retrieved',
      data: {
        meals,
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
 * Search meals
 */
const searchDiets = async (req, res, next) => {
  try {
    const { query: searchQuery, q, tags, dietaryTags, limit = 20, skip = 0 } = req.query;
    const queryText = searchQuery || q;
    const tagFilter = dietaryTags || tags;

    const filters = [{ isActive: true }];

    if (queryText) {
      filters.push({
        $or: [
          { name: { $regex: queryText, $options: 'i' } },
          { description: { $regex: queryText, $options: 'i' } }
        ]
      });
    }

    if (tagFilter) {
      const tagList = Array.isArray(tagFilter)
        ? tagFilter
        : String(tagFilter).split(',').map((tag) => tag.trim()).filter(Boolean);
      if (tagList.length > 0) {
        filters.push({ dietaryTags: { $in: tagList } });
      }
    }

    const mongoQuery = filters.length > 1 ? { $and: filters } : filters[0];

    const meals = await Meal.find(mongoQuery)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Meal.countDocuments(mongoQuery);

    res.status(200).json({
      success: true,
      message: 'Meals searched',
      data: {
        meals,
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
 * Create new meal/diet
 */
const createDiet = async (req, res, next) => {
  try {
    const { name, description, mealType, ingredients, totalCalories, macroBreakdown } = req.body;

    if (!name || !description || !mealType || !totalCalories) {
      throw new AppError('Missing required fields', 400);
    }

    const meal = new Meal({
      name,
      description,
      mealType,
      ingredients,
      totalCalories,
      macroBreakdown,
      createdBy: req.user.id,
      isCustomMeal: req.user.role !== 'admin'
    });

    await meal.save();

    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: { meal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update meal/diet
 */
const updateDiet = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meal = await Meal.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!meal) {
      throw new AppError('Meal not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Meal updated successfully',
      data: { meal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete meal/diet
 */
const deleteDiet = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meal = await Meal.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!meal) {
      throw new AppError('Meal not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiets,
  getDietById,
  getDietsByCategory,
  searchDiets,
  createDiet,
  updateDiet,
  deleteDiet
};
