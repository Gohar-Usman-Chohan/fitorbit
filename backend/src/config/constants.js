/**
 * ============================================
 * APPLICATION CONSTANTS
 * ============================================
 * Global constants used across the application
 */

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  TRAINER: 'trainer',
  NUTRITIONIST: 'nutritionist'
};

// Account Status
const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_APPROVAL: 'pending_approval',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

// Fitness Goals
const FITNESS_GOALS = {
  WEIGHT_LOSS: 'weight_loss',
  MUSCLE_GAIN: 'muscle_gain',
  ENDURANCE: 'endurance',
  FLEXIBILITY: 'flexibility',
  GENERAL_FITNESS: 'general_fitness',
  STRENGTH_TRAINING: 'strength_training',
  REHABILITATION: 'rehabilitation'
};

// Experience Levels
const EXPERIENCE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional'
};

// Appointment Status
const APPOINTMENT_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  AWAITING_PAYMENT: 'awaiting_payment',
  REJECTED: 'rejected',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Workout Types
const WORKOUT_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  SPORT_SPECIFIC: 'sport_specific',
  MIXED: 'mixed'
};

// Diet Plan Types
const DIET_TYPES = {
  WEIGHT_LOSS: 'weight_loss',
  MUSCLE_GAIN: 'muscle_gain',
  MAINTENANCE: 'maintenance',
  THERAPEUTIC: 'therapeutic',
  SPORTS_NUTRITION: 'sports_nutrition'
};

// Meal Types
const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
  POST_WORKOUT: 'post_workout'
};

// Message Status
const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
};

// Notification Types
const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  APPOINTMENT: 'appointment',
  PROGRESS_UPDATE: 'progress_update',
  PLAN_ASSIGNED: 'plan_assigned',
  ACHIEVEMENT: 'achievement',
  SYSTEM_ALERT: 'system_alert'
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error'
};

// Success Messages
const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PLAN_CREATED: 'Plan created successfully',
  APPOINTMENT_BOOKED: 'Appointment booked successfully'
};

// Workout plan frequency (days per week)
const WORKOUT_FREQUENCY = {
  MIN_PER_WEEK: 1,
  MAX_PER_WEEK: 7
};

module.exports = {
  USER_ROLES,
  ACCOUNT_STATUS,
  FITNESS_GOALS,
  EXPERIENCE_LEVELS,
  APPOINTMENT_STATUS,
  PAYMENT_STATUS,
  WORKOUT_TYPES,
  DIET_TYPES,
  MEAL_TYPES,
  MESSAGE_STATUS,
  NOTIFICATION_TYPES,
  WORKOUT_FREQUENCY,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
