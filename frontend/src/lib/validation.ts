import { FITNESS_GOAL_OPTIONS, WORKOUT_FREQUENCY } from '@/config/constants';

/** Shared field limits — keep in sync with backend/src/utils/validators.js */
export const LIMITS = {
  TITLE_MIN: 2,
  TITLE_MAX: 120,
  DESCRIPTION_MAX: 2000,
  PLAN_DURATION_MIN: 1,
  PLAN_DURATION_MAX: 52,
  CALORIE_TARGET_MIN: 800,
  CALORIE_TARGET_MAX: 10000,
  MEALS_PER_DAY_MIN: 1,
  MEALS_PER_DAY_MAX: 10,
  MACRO_SUM_TARGET: 100,
  MACRO_SUM_TOLERANCE: 2,
  EXERCISE_NAME_MIN: 2,
  EXERCISE_NAME_MAX: 100,
  EXERCISE_SETS_MIN: 1,
  EXERCISE_SETS_MAX: 50,
  EXERCISE_REPS_MIN: 1,
  EXERCISE_REPS_MAX: 100,
  MEAL_NAME_MIN: 2,
  MEAL_NAME_MAX: 100,
  MEAL_CALORIES_MAX: 5000,
  WEIGHT_MIN: 20,
  WEIGHT_MAX: 300,
  BODY_FAT_MIN: 0,
  BODY_FAT_MAX: 100,
  LOG_CALORIES_MAX: 5000,
  MACRO_GRAMS_MAX: 500,
  WORKOUT_DURATION_MIN: 1,
  WORKOUT_DURATION_MAX: 480,
  WEIGHT_LIFTED_MAX: 500,
  NOTES_MAX: 1000,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  NAME_MIN: 2,
  NAME_MAX: 80,
  TOPIC_MAX: 200,
  LOCATION_MIN: 3,
  LOCATION_MAX: 200,
  FEEDBACK_MAX: 1000,
  BIO_MAX: 2000,
  YEARS_EXPERIENCE_MAX: 70,
  HOURLY_RATE_MAX: 10000,
  AGE_MIN: 13,
  AGE_MAX: 120,
  HEIGHT_MIN: 100,
  HEIGHT_MAX: 250,
  TIMELINE_OPTIONS: [1, 3, 6, 12],
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(value: unknown): number | null {
  const parsed = parseOptionalNumber(value);
  return parsed;
}

function validateTextLength(
  value: unknown,
  label: string,
  min: number,
  max: number,
  required = true
): string | null {
  const text = trim(value);
  if (!text) {
    return required ? `${label} is required` : null;
  }
  if (text.length < min) {
    return `${label} must be at least ${min} characters`;
  }
  if (text.length > max) {
    return `${label} must be at most ${max} characters`;
  }
  return null;
}

function validateOptionalNumberRange(
  value: unknown,
  label: string,
  min: number,
  max: number
): string | null {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) return null;
  if (parsed < min || parsed > max) {
    return `${label} must be between ${min} and ${max}`;
  }
  return null;
}

function validateRequiredNumberRange(
  value: unknown,
  label: string,
  min: number,
  max: number
): string | null {
  const parsed = parseRequiredNumber(value);
  if (parsed === null) {
    return `${label} is required`;
  }
  if (parsed < min || parsed > max) {
    return `${label} must be between ${min} and ${max}`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const text = trim(email);
  if (!text) return 'Email is required';
  if (!EMAIL_REGEX.test(text)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < LIMITS.PASSWORD_MIN) {
    return `Password must be at least ${LIMITS.PASSWORD_MIN} characters`;
  }
  if (password.length > LIMITS.PASSWORD_MAX) {
    return `Password must be at most ${LIMITS.PASSWORD_MAX} characters`;
  }
  return null;
}

export function validateRegistration(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  const nameError = validateTextLength(data.name, 'Name', LIMITS.NAME_MIN, LIMITS.NAME_MAX);
  if (nameError) return nameError;

  const emailError = validateEmail(data.email);
  if (emailError) return emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) return passwordError;

  if (data.password !== data.confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}

export function validateLogin(data: { email: string; password: string }): string | null {
  const emailError = validateEmail(data.email);
  if (emailError) return emailError;
  if (!data.password) return 'Password is required';
  return null;
}

export type ExerciseInput = {
  exerciseName: string;
  sets?: number | string;
  reps?: number | string;
};

export function validateExercises(exercises: ExerciseInput[]): string | null {
  const valid = exercises.filter((exercise) => trim(exercise.exerciseName));
  if (valid.length === 0) {
    return 'Add at least one exercise with a name';
  }

  for (const exercise of valid) {
    const nameError = validateTextLength(
      exercise.exerciseName,
      'Exercise name',
      LIMITS.EXERCISE_NAME_MIN,
      LIMITS.EXERCISE_NAME_MAX
    );
    if (nameError) return nameError;

    const setsError = validateOptionalNumberRange(
      exercise.sets,
      'Sets',
      LIMITS.EXERCISE_SETS_MIN,
      LIMITS.EXERCISE_SETS_MAX
    );
    if (setsError) return setsError;

    const repsError = validateOptionalNumberRange(
      exercise.reps,
      'Reps',
      LIMITS.EXERCISE_REPS_MIN,
      LIMITS.EXERCISE_REPS_MAX
    );
    if (repsError) return repsError;
  }

  return null;
}

export function validateWorkoutPlanCreate(data: {
  clientId: string;
  title: string;
  description?: string;
  duration: string | number;
  frequency: string | number;
  startDate: string;
  exercises: ExerciseInput[];
}): string | null {
  if (!trim(data.clientId)) return 'Please select a client';

  const titleError = validateTextLength(
    data.title,
    'Plan title',
    LIMITS.TITLE_MIN,
    LIMITS.TITLE_MAX
  );
  if (titleError) return titleError;

  const descError = validateTextLength(
    data.description,
    'Description',
    0,
    LIMITS.DESCRIPTION_MAX,
    false
  );
  if (descError) return descError;

  const durationError = validateRequiredNumberRange(
    data.duration,
    'Duration (weeks)',
    LIMITS.PLAN_DURATION_MIN,
    LIMITS.PLAN_DURATION_MAX
  );
  if (durationError) return durationError;

  const frequency = Number(data.frequency);
  if (
    !Number.isFinite(frequency) ||
    frequency < WORKOUT_FREQUENCY.MIN_PER_WEEK ||
    frequency > WORKOUT_FREQUENCY.MAX_PER_WEEK
  ) {
    return `Days per week must be between ${WORKOUT_FREQUENCY.MIN_PER_WEEK} and ${WORKOUT_FREQUENCY.MAX_PER_WEEK}`;
  }

  if (!trim(data.startDate)) return 'Start date is required';

  return validateExercises(data.exercises);
}

export type MealInput = {
  mealName: string;
  calories?: number | string | '';
};

export function validateMeals(meals: MealInput[]): string | null {
  const valid = meals.filter((meal) => trim(meal.mealName));
  if (valid.length === 0) {
    return 'Add at least one meal with a name';
  }

  for (const meal of valid) {
    const nameError = validateTextLength(
      meal.mealName,
      'Meal name',
      LIMITS.MEAL_NAME_MIN,
      LIMITS.MEAL_NAME_MAX
    );
    if (nameError) return nameError;

    const caloriesError = validateOptionalNumberRange(
      meal.calories,
      'Meal calories',
      0,
      LIMITS.MEAL_CALORIES_MAX
    );
    if (caloriesError) return caloriesError;
  }

  return null;
}

export function validateDietPlanCreate(data: {
  clientId: string;
  title: string;
  description?: string;
  duration: string | number;
  calorieTarget: string | number;
  mealsPerDay: string | number;
  protein: string | number;
  carbs: string | number;
  fats: string | number;
  startDate: string;
  meals: MealInput[];
}): string | null {
  if (!trim(data.clientId)) return 'Please select a client';

  const titleError = validateTextLength(
    data.title,
    'Plan title',
    LIMITS.TITLE_MIN,
    LIMITS.TITLE_MAX
  );
  if (titleError) return titleError;

  const descError = validateTextLength(
    data.description,
    'Description',
    0,
    LIMITS.DESCRIPTION_MAX,
    false
  );
  if (descError) return descError;

  const durationError = validateRequiredNumberRange(
    data.duration,
    'Duration (weeks)',
    LIMITS.PLAN_DURATION_MIN,
    LIMITS.PLAN_DURATION_MAX
  );
  if (durationError) return durationError;

  const calorieError = validateRequiredNumberRange(
    data.calorieTarget,
    'Daily calorie target',
    LIMITS.CALORIE_TARGET_MIN,
    LIMITS.CALORIE_TARGET_MAX
  );
  if (calorieError) return calorieError;

  const mealsPerDayError = validateRequiredNumberRange(
    data.mealsPerDay,
    'Meals per day',
    LIMITS.MEALS_PER_DAY_MIN,
    LIMITS.MEALS_PER_DAY_MAX
  );
  if (mealsPerDayError) return mealsPerDayError;

  const protein = parseRequiredNumber(data.protein);
  const carbs = parseRequiredNumber(data.carbs);
  const fats = parseRequiredNumber(data.fats);

  if (protein === null || carbs === null || fats === null) {
    return 'Macro percentages (protein, carbs, fats) are required';
  }

  for (const [label, value] of [
    ['Protein', protein],
    ['Carbs', carbs],
    ['Fats', fats],
  ] as const) {
    if (value < 0 || value > 100) {
      return `${label} percentage must be between 0 and 100`;
    }
  }

  const macroSum = protein + carbs + fats;
  if (Math.abs(macroSum - LIMITS.MACRO_SUM_TARGET) > LIMITS.MACRO_SUM_TOLERANCE) {
    return `Macro percentages must add up to 100% (currently ${macroSum}%)`;
  }

  if (!trim(data.startDate)) return 'Start date is required';

  return validateMeals(data.meals);
}

export function validateWorkoutLog(data: {
  exerciseName: string;
  sets?: string;
  reps?: string;
  weight?: string;
  duration?: string;
  notes?: string;
}): string | null {
  const nameError = validateTextLength(
    data.exerciseName,
    'Exercise name',
    LIMITS.EXERCISE_NAME_MIN,
    LIMITS.EXERCISE_NAME_MAX
  );
  if (nameError) return nameError;

  const setsError = validateOptionalNumberRange(
    data.sets,
    'Sets',
    LIMITS.EXERCISE_SETS_MIN,
    LIMITS.EXERCISE_SETS_MAX
  );
  if (setsError) return setsError;

  const repsError = validateOptionalNumberRange(
    data.reps,
    'Reps',
    LIMITS.EXERCISE_REPS_MIN,
    LIMITS.EXERCISE_REPS_MAX
  );
  if (repsError) return repsError;

  const weightError = validateOptionalNumberRange(
    data.weight,
    'Weight',
    0,
    LIMITS.WEIGHT_LIFTED_MAX
  );
  if (weightError) return weightError;

  const durationError = validateOptionalNumberRange(
    data.duration,
    'Duration',
    LIMITS.WORKOUT_DURATION_MIN,
    LIMITS.WORKOUT_DURATION_MAX
  );
  if (durationError) return durationError;

  return validateTextLength(data.notes, 'Notes', 0, LIMITS.NOTES_MAX, false);
}

export function validateNutritionLog(data: {
  mealDescription: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fats?: string;
  notes?: string;
}): string | null {
  const descError = validateTextLength(
    data.mealDescription,
    'Meal description',
    2,
    500
  );
  if (descError) return descError;

  const caloriesError = validateOptionalNumberRange(
    data.calories,
    'Calories',
    0,
    LIMITS.LOG_CALORIES_MAX
  );
  if (caloriesError) return caloriesError;

  for (const [label, value] of [
    ['Protein', data.protein],
    ['Carbs', data.carbs],
    ['Fats', data.fats],
  ] as const) {
    const macroError = validateOptionalNumberRange(
      value,
      label,
      0,
      LIMITS.MACRO_GRAMS_MAX
    );
    if (macroError) return macroError;
  }

  const notesError = validateTextLength(data.notes, 'Notes', 0, LIMITS.NOTES_MAX, false);
  if (notesError) return notesError;

  return null;
}

export function validateMeasurementLog(data: {
  weight: string;
  bodyFatPercentage?: string;
  notes?: string;
}): string | null {
  const weightError = validateRequiredNumberRange(
    data.weight,
    'Weight',
    LIMITS.WEIGHT_MIN,
    LIMITS.WEIGHT_MAX
  );
  if (weightError) return weightError;

  const bodyFatError = validateOptionalNumberRange(
    data.bodyFatPercentage,
    'Body fat percentage',
    LIMITS.BODY_FAT_MIN,
    LIMITS.BODY_FAT_MAX
  );
  if (bodyFatError) return bodyFatError;

  return validateTextLength(data.notes, 'Notes', 0, LIMITS.NOTES_MAX, false);
}

export function validateFitnessGoal(data: {
  goals: string[];
  currentWeight: string;
  targetWeight: string;
  timeline: string;
}): string | null {
  if (!data.goals.length) {
    return 'Please select at least one fitness goal';
  }

  const allowedGoals = FITNESS_GOAL_OPTIONS.map((option) => option.value);
  for (const goal of data.goals) {
    if (!allowedGoals.includes(goal as (typeof allowedGoals)[number])) {
      return 'Invalid fitness goal selected';
    }
  }

  const currentWeightError = validateRequiredNumberRange(
    data.currentWeight,
    'Current weight',
    LIMITS.WEIGHT_MIN,
    LIMITS.WEIGHT_MAX
  );
  if (currentWeightError) return currentWeightError;

  const targetWeightError = validateRequiredNumberRange(
    data.targetWeight,
    'Target weight',
    LIMITS.WEIGHT_MIN,
    LIMITS.WEIGHT_MAX
  );
  if (targetWeightError) return targetWeightError;

  if (!data.timeline) {
    return 'Please select a timeline';
  }

  const timeline = Number(data.timeline);
  if (!(LIMITS.TIMELINE_OPTIONS as readonly number[]).includes(timeline)) {
    return 'Please select a valid timeline';
  }

  return null;
}

export function validateAppointmentBooking(data: {
  appointmentDate: string;
  appointmentTime: string;
  sessionType: 'online' | 'in_person';
  location?: string;
  topic?: string;
  clientNotes?: string;
}): string | null {
  if (!trim(data.appointmentDate) || !trim(data.appointmentTime)) {
    return 'Please select date and time';
  }

  if (data.sessionType === 'in_person') {
    const locationError = validateTextLength(
      data.location,
      'Location',
      LIMITS.LOCATION_MIN,
      LIMITS.LOCATION_MAX
    );
    if (locationError) return locationError;
  }

  const topicError = validateTextLength(data.topic, 'Topic', 0, LIMITS.TOPIC_MAX, false);
  if (topicError) return topicError;

  const notesError = validateTextLength(
    data.clientNotes,
    'Notes',
    0,
    LIMITS.NOTES_MAX,
    false
  );
  if (notesError) return notesError;

  return null;
}

export function validateRating(rating: number, feedback?: string): string | null {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return 'Please select a rating between 1 and 5 stars';
  }

  return validateTextLength(feedback, 'Feedback', 0, LIMITS.FEEDBACK_MAX, false);
}

export function validateProfileUpdate(data: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  yearsOfExperience?: string | number;
  hourlyRate?: string | number;
  consultationFee?: string | number;
  age?: string | number;
  phone?: string;
}): string | null {
  if (data.firstName !== undefined) {
    const firstNameError = validateTextLength(
      data.firstName,
      'First name',
      LIMITS.NAME_MIN,
      LIMITS.NAME_MAX
    );
    if (firstNameError) return firstNameError;
  }

  if (data.lastName !== undefined) {
    const lastNameError = validateTextLength(
      data.lastName,
      'Last name',
      LIMITS.NAME_MIN,
      LIMITS.NAME_MAX
    );
    if (lastNameError) return lastNameError;
  }

  const bioError = validateTextLength(data.bio, 'Bio', 0, LIMITS.BIO_MAX, false);
  if (bioError) return bioError;

  const yearsError = validateOptionalNumberRange(
    data.yearsOfExperience,
    'Years of experience',
    0,
    LIMITS.YEARS_EXPERIENCE_MAX
  );
  if (yearsError) return yearsError;

  const hourlyError = validateOptionalNumberRange(
    data.hourlyRate,
    'Hourly rate',
    0,
    LIMITS.HOURLY_RATE_MAX
  );
  if (hourlyError) return hourlyError;

  const feeError = validateOptionalNumberRange(
    data.consultationFee,
    'Consultation fee',
    0,
    LIMITS.HOURLY_RATE_MAX
  );
  if (feeError) return feeError;

  const ageError = validateOptionalNumberRange(
    data.age,
    'Age',
    LIMITS.AGE_MIN,
    LIMITS.AGE_MAX
  );
  if (ageError) return ageError;

  return null;
}
