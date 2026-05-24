/**
 * ============================================
 * DIET PLAN MODEL
 * ============================================
 * Represents customized diet/nutrition plans created by nutritionists
 */

const mongoose = require('mongoose');
const { DIET_TYPES, MEAL_TYPES } = require('../config/constants');

// TODO: Implement DietPlan schema with:
// 1. Reference to Nutritionist (creator)
// 2. Reference to Client (assigned to)
// 3. Plan name/title
// 4. Plan description
// 5. Diet type (weight loss, muscle gain, maintenance, therapeutic, etc.)
// 6. Duration (weeks)
// 7. Calorie target (daily)
// 8. Macronutrient ratios (protein %, carbs %, fats %)
// 9. Meals per day
// 10. Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
// 11. Allergies to avoid (array)
// 12. Daily meal plan (array with meals for each day):
//     - Meal type (breakfast, lunch, etc.)
//     - Food items
//     - Portions
//     - Calories
//     - Macros
//     - Instructions
// 13. Shopping list (ingredients to buy)
// 14. Meal prep instructions
// 15. Hydration guidelines
// 16. Supplementation recommendations
// 17. Cheat meal guidelines
// 18. Status (active, completed, archived)
// 19. Start date and end date
// 20. Notes from nutritionist
// 21. Last modified date

const dietPlanSchema = new mongoose.Schema({
  nutritionistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  dietType: {
    type: String,
    enum: Object.values(DIET_TYPES),
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  durationUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    default: 'weeks'
  },
  calorieTarget: {
    type: Number,
    required: true
  },
  macronutrients: {
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
  mealsPerDay: {
    type: Number,
    default: 3
  },
  meals: [{
    mealName: String,
    mealType: {
      type: String,
      enum: Object.values(MEAL_TYPES),
      default: MEAL_TYPES.BREAKFAST
    },
    calories: Number,
    portions: String,
  }],
  dietaryRestrictions: [String],
  allergies: [String],
  dailyMealPlan: [{
    day: Number,
    meals: [{
      mealType: {
        type: String,
        enum: Object.values(MEAL_TYPES)
      },
      mealId: mongoose.Schema.Types.ObjectId,
      foodItems: [String],
      portions: String,
      calories: Number,
      macros: {
        protein: Number,
        carbs: Number,
        fats: Number
      },
      instructions: String
    }]
  }],
  shoppingList: [{
    ingredient: String,
    quantity: String,
    unit: String,
    category: String
  }],
  mealPrepInstructions: String,
  hydrationGuidelines: String,
  supplementation: [{
    supplement: String,
    dosage: String,
    timing: String,
    reason: String
  }],
  cheatMealGuidelines: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'paused'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  nutritionistNotes: String,
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
dietPlanSchema.index({ nutritionistId: 1 });
dietPlanSchema.index({ clientId: 1 });
dietPlanSchema.index({ status: 1 });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
