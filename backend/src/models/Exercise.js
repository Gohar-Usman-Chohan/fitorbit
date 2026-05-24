/**
 * ============================================
 * EXERCISE MODEL
 * ============================================
 * Library of exercises that can be added to workout plans
 */

const mongoose = require('mongoose');
const { EXPERIENCE_LEVELS, WORKOUT_TYPES } = require('../config/constants');

// TODO: Implement Exercise schema with:
// 1. Exercise name
// 2. Description
// 3. Target muscles (array)
// 4. Equipment required
// 5. Difficulty level (beginner, intermediate, advanced)
// 6. Instructions (step by step)
// 7. Video URL
// 8. Image URL
// 9. Common variations
// 10. Common mistakes to avoid
// 11. Safety tips
// 12. Workout type category
// 13. Duration (typical)
// 14. Created by (trainer/admin)
// 15. Is custom exercise (true/false)

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  targetMuscles: [String],
  equipmentRequired: [String],
  difficultyLevel: {
    type: String,
    enum: Object.values(EXPERIENCE_LEVELS),
    default: EXPERIENCE_LEVELS.BEGINNER
  },
  instructions: [String],
  videoUrl: String,
  imageUrl: String,
  variations: [String],
  commonMistakes: [String],
  safetyTips: [String],
  workoutType: {
    type: String,
    enum: Object.values(WORKOUT_TYPES)
  },
  typicalDuration: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isCustomExercise: {
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
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ targetMuscles: 1 });
exerciseSchema.index({ difficultyLevel: 1 });
exerciseSchema.index({ workoutType: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
