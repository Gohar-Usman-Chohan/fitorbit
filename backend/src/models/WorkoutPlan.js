/**
 * ============================================
 * WORKOUT PLAN MODEL
 * ============================================
 * Represents customized workout plans created by trainers
 */

const mongoose = require('mongoose');
const { WORKOUT_TYPES, FITNESS_GOALS, EXPERIENCE_LEVELS } = require('../config/constants');

// TODO: Implement WorkoutPlan schema with:
// 1. Reference to Trainer (creator)
// 2. Reference to Client (assigned to)
// 3. Plan name/title
// 4. Plan description
// 5. Workout type (strength, cardio, flexibility, mixed)
// 6. Duration (weeks)
// 7. Difficulty level (beginner, intermediate, advanced)
// 8. Target goals (weight loss, muscle gain, etc.)
// 9. Frequency (days per week)
// 10. Exercises array (with:
//     - Exercise name
//     - Description
//     - Sets and reps
//     - Duration/Weight
//     - Rest period
//     - Video URL (optional)
//     - Instructions)
// 11. Warm-up routine
// 12. Cool-down routine
// 13. Equipment needed
// 14. Status (active, completed, archived)
// 15. Start date and end date
// 16. Modifications/Notes for client
// 17. Last updated by trainer
// 18. Notes from trainer

const workoutPlanSchema = new mongoose.Schema({
  trainerId: {
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
  workoutType: {
    type: String,
    enum: Object.values(WORKOUT_TYPES),
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
  difficultyLevel: {
    type: String,
    enum: Object.values(EXPERIENCE_LEVELS),
    required: true
  },
  targetGoals: [{
    type: String,
    enum: Object.values(FITNESS_GOALS)
  }],
  frequency: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  frequencyUnit: {
    type: String,
    enum: ['per_week', 'per_month'],
    default: 'per_week'
  },
  exercises: [{
    exerciseName: String,
    description: String,
    sets: Number,
    reps: Number,
    weight: String,
    duration: String,
    restPeriod: String,
    videoUrl: String,
    instructions: [String]
  }],
  warmupRoutine: String,
  cooldownRoutine: String,
  equipmentNeeded: [String],
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
  modifications: String,
  trainerNotes: String,
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
workoutPlanSchema.index({ trainerId: 1 });
workoutPlanSchema.index({ clientId: 1 });
workoutPlanSchema.index({ status: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
