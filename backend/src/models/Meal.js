/**
 * ============================================
 * MEAL MODEL
 * ============================================
 * Library of meals that can be added to diet plans
 */

const mongoose = require('mongoose');
const { MEAL_TYPES } = require('../config/constants');

// TODO: Implement Meal schema with:
// 1. Meal name
// 2. Description
// 3. Meal type (breakfast, lunch, dinner, snack, post-workout)
// 4. Ingredients (array with:
//    - Ingredient name
//    - Quantity
//    - Unit (grams, cups, etc.)
//    - Calories per unit)
// 5. Total calories
// 6. Macros breakdown (protein, carbs, fats)
// 7. Micronutrients (vitamins, minerals)
// 8. Preparation time (minutes)
// 9. Cooking instructions
// 10. Serving size
// 11. Recipe/Instructions (detailed steps)
// 12. Dietary tags (vegetarian, vegan, gluten-free, etc.)
// 13. Allergens (array)
// 14. Season/Availability
// 15. Difficulty level (easy, medium, hard)
// 16. Image URL
// 17. Created by (nutritionist)
// 18. Is custom meal (true/false)

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  mealType: {
    type: String,
    enum: Object.values(MEAL_TYPES),
    required: true
  },
  ingredients: [{
    ingredientName: String,
    quantity: Number,
    unit: String,
    caloriesPerUnit: Number
  }],
  totalCalories: {
    type: Number,
    required: true
  },
  macroBreakdown: {
    protein: {
      type: Number,
      required: true
    },
    carbs: {
      type: Number,
      required: true
    },
    fats: {
      type: Number,
      required: true
    }
  },
  micronutrients: {
    vitamins: [String],
    minerals: [String]
  },
  preparationTime: Number,
  cookingInstructions: [String],
  servingSize: String,
  recipeInstructions: String,
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'soy_free']
  }],
  allergens: [String],
  season: {
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter', 'year_round']
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  imageUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isCustomMeal: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
mealSchema.index({ name: 1 });
mealSchema.index({ mealType: 1 });
mealSchema.index({ dietaryTags: 1 });
mealSchema.index({ totalCalories: 1 });

module.exports = mongoose.model('Meal', mealSchema);
