/**
 * ============================================
 * PROGRESS LOG MODEL
 * ============================================
 * Records client's progress in workouts, nutrition, measurements
 */

const mongoose = require('mongoose');

// TODO: Implement ProgressLog schema with:
// 1. Reference to Client
// 2. Log type (workout, nutrition, measurement, milestone)
// 3. Date of log
// 4. For workout logs:
//    - Workout plan reference
//    - Duration (minutes)
//    - Exercises completed (with actual vs planned)
//    - Intensity level (1-10)
//    - Notes/feelings
//    - Calories burned (if tracked)
// 5. For nutrition logs:
//    - Meals consumed (array)
//    - Total calories
//    - Macro breakdown (actual)
//    - Water intake
//    - Deviations from plan
// 6. For measurement logs:
//    - Weight
//    - Body measurements (chest, waist, hips, etc.)
//    - Body fat percentage
//    - Muscle mass
// 7. For milestone logs:
//    - Milestone name/description
//    - Achievements
//    - Photos before/after
// 8. Visible to trainer/nutritionist (boolean)
// 9. Trainer/Nutritionist notes/feedback
// 10. Overall mood/energy level

const progressLogSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logType: {
    type: String,
    enum: ['workout', 'nutrition', 'measurement', 'milestone'],
    required: true
  },
  logDate: {
    type: Date,
    default: Date.now
  },
  workoutLog: {
    workoutPlanId: mongoose.Schema.Types.ObjectId,
    durationMinutes: Number,
    exercisesCompleted: [{
      exerciseName: String,
      plannedSets: Number,
      actualSets: Number,
      plannedReps: Number,
      actualReps: Number,
      weightUsed: Number
    }],
    intensityLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    notes: String,
    caloriesBurned: Number
  },
  nutritionLog: {
    mealType: String,
    mealsConsumed: [String],
    totalCalories: Number,
    macros: {
      protein: Number,
      carbs: Number,
      fats: Number
    },
    waterIntake: Number,
    deviationsFromPlan: String
  },
  measurementLog: {
    weight: Number,
    measurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      biceps: Number,
      thighs: Number
    },
    bodyFatPercentage: Number,
    muscleMass: Number
  },
  milestoneLog: {
    milestoneName: String,
    description: String,
    achievement: String,
    beforeImage: String,
    afterImage: String
  },
  visibleToTrainer: {
    type: Boolean,
    default: true
  },
  visibleToNutritionist: {
    type: Boolean,
    default: true
  },
  trainerFeedback: String,
  nutritionistFeedback: String,
  mood: {
    type: String,
    enum: ['very_bad', 'bad', 'neutral', 'good', 'very_good']
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10
  }
}, {
  timestamps: true
});

// Indexes
progressLogSchema.index({ clientId: 1 });
progressLogSchema.index({ logDate: -1 });
progressLogSchema.index({ logType: 1 });

module.exports = mongoose.model('ProgressLog', progressLogSchema);
