/**
 * ============================================
 * CLIENT PROFILE MODEL
 * ============================================
 * Extended profile information for client users
 * Contains fitness goals, measurements, health data
 */

const mongoose = require('mongoose');
const { FITNESS_GOALS, EXPERIENCE_LEVELS } = require('../config/constants');

const clientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fitnessGoals: [{
    type: String,
    enum: Object.values(FITNESS_GOALS),
    default: [FITNESS_GOALS.GENERAL_FITNESS]
  }],
  currentWeight: {
    type: Number, // in kg
    required: true,
    default: 70
  },
  currentHeight: {
    type: Number, // in cm
    required: true,
    default: 170
  },
  targetWeight: {
    type: Number // in kg
  },
  timeline: {
    type: Number // in months
  },
  age: {
    type: Number,
    required: true,
    default: 25
  },
  bodyMeasurements: {
    chest: Number, // in inches/cm
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  experienceLevel: {
    type: String,
    enum: Object.values(EXPERIENCE_LEVELS),
    default: EXPERIENCE_LEVELS.BEGINNER
  },
  healthConditions: [String],
  allergies: [String],
  equipmentAvailable: [String],
  schedulePreferences: {
    preferredDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    preferredTimeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'morning'
    }
  },
  budgetPreference: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  medicalHistoryNotes: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  assignedTrainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedNutritionistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isProgressTrackingEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for query performance
clientProfileSchema.index({ userId: 1 });
clientProfileSchema.index({ assignedTrainerId: 1 });
clientProfileSchema.index({ assignedNutritionistId: 1 });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
