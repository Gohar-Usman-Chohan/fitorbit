export const FITNESS_GOALS = {
  WEIGHT_LOSS: 'weight_loss',
  MUSCLE_GAIN: 'muscle_gain',
  GENERAL_FITNESS: 'general_fitness',
  ENDURANCE: 'endurance',
  FLEXIBILITY: 'flexibility',
  STRENGTH_TRAINING: 'strength_training',
} as const;

export const FITNESS_GOAL_OPTIONS = [
  { value: FITNESS_GOALS.WEIGHT_LOSS, label: 'Weight Loss' },
  { value: FITNESS_GOALS.MUSCLE_GAIN, label: 'Muscle Gain' },
  { value: FITNESS_GOALS.GENERAL_FITNESS, label: 'General Fitness' },
  { value: FITNESS_GOALS.ENDURANCE, label: 'Endurance' },
  { value: FITNESS_GOALS.FLEXIBILITY, label: 'Flexibility' },
  { value: FITNESS_GOALS.STRENGTH_TRAINING, label: 'Strength Training' },
] as const;

export function formatFitnessGoalLabel(goal?: string) {
  if (!goal) return 'Fitness Goal';
  const match = FITNESS_GOAL_OPTIONS.find((option) => option.value === goal);
  if (match) return match.label;
  return goal.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export const EXPERIENCE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

export const WORKOUT_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  MIXED: 'mixed',
};

export const WORKOUT_FREQUENCY = {
  MIN_PER_WEEK: 1,
  MAX_PER_WEEK: 7,
} as const;

export function validateWeeklyFrequency(value: string | number): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < WORKOUT_FREQUENCY.MIN_PER_WEEK || parsed > WORKOUT_FREQUENCY.MAX_PER_WEEK) {
    return null;
  }
  return Math.round(parsed);
}

export const DIET_TYPES = {
  WEIGHT_LOSS: 'weight_loss',
  MUSCLE_GAIN: 'muscle_gain',
  MAINTENANCE: 'maintenance',
  THERAPEUTIC: 'therapeutic',
  SPORTS_NUTRITION: 'sports_nutrition',
};

export const DIET_TYPE_OPTIONS = [
  { value: DIET_TYPES.WEIGHT_LOSS, label: 'Weight Loss' },
  { value: DIET_TYPES.MUSCLE_GAIN, label: 'Muscle Gain' },
  { value: DIET_TYPES.MAINTENANCE, label: 'Maintenance' },
  { value: DIET_TYPES.THERAPEUTIC, label: 'Therapeutic' },
  { value: DIET_TYPES.SPORTS_NUTRITION, label: 'Sports Nutrition' },
];

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
  POST_WORKOUT: 'post_workout',
} as const;

export const MEAL_TYPE_OPTIONS = [
  { value: MEAL_TYPES.BREAKFAST, label: 'Breakfast' },
  { value: MEAL_TYPES.LUNCH, label: 'Lunch' },
  { value: MEAL_TYPES.DINNER, label: 'Dinner' },
  { value: MEAL_TYPES.SNACK, label: 'Snack' },
  { value: MEAL_TYPES.POST_WORKOUT, label: 'Post Workout' },
] as const;

export const APPOINTMENT_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  AWAITING_PAYMENT: 'awaiting_payment',
  REJECTED: 'rejected',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
};

export const BOOKING_WINDOW_LABEL = 'Monday – Friday, 9:00 AM – 5:00 PM';

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const SESSION_TYPES = {
  ONLINE: 'online',
  IN_PERSON: 'in_person',
};

export const PROGRESS_LOG_TYPES = {
  WORKOUT: 'workout',
  NUTRITION: 'nutrition',
  MEASUREMENT: 'measurement',
  MILESTONE: 'milestone',
};
