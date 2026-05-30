/**
 * Shared input validators — keep limits in sync with frontend/src/lib/validation.ts
 */
const { AppError } = require('../middleware/errorHandler');
const {
  WORKOUT_FREQUENCY,
  WORKOUT_TYPES,
  DIET_TYPES,
  MEAL_TYPES,
  FITNESS_GOALS,
} = require('../config/constants');

const LIMITS = {
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
  TOPIC_MAX: 200,
  LOCATION_MIN: 3,
  LOCATION_MAX: 200,
  FEEDBACK_MAX: 1000,
  BIO_MAX: 2000,
  YEARS_EXPERIENCE_MAX: 70,
  HOURLY_RATE_MAX: 10000,
  AGE_MIN: 13,
  AGE_MAX: 120,
  TIMELINE_OPTIONS: [1, 3, 6, 12],
};

const FITNESS_GOAL_VALUES = Object.values(FITNESS_GOALS);

const trim = (value) => (typeof value === 'string' ? value.trim() : '');

const assertStartDateNotPast = (value) => {
  const dateStr = trim(value);
  if (!dateStr) {
    throw new AppError('Start date is required', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${dateStr}T12:00:00`);
  start.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new AppError('Start date cannot be in the past', 400);
  }
};

const parseOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const assertText = (value, label, min, max, required = true) => {
  const text = trim(value);
  if (!text) {
    if (required) throw new AppError(`${label} is required`, 400);
    return '';
  }
  if (text.length < min) {
    throw new AppError(`${label} must be at least ${min} characters`, 400);
  }
  if (text.length > max) {
    throw new AppError(`${label} must be at most ${max} characters`, 400);
  }
  return text;
};

const assertOptionalNumber = (value, label, min, max) => {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) return null;
  if (parsed < min || parsed > max) {
    throw new AppError(`${label} must be between ${min} and ${max}`, 400);
  }
  return parsed;
};

const assertRequiredNumber = (value, label, min, max) => {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) {
    throw new AppError(`${label} is required`, 400);
  }
  if (parsed < min || parsed > max) {
    throw new AppError(`${label} must be between ${min} and ${max}`, 400);
  }
  return parsed;
};

const validateExercises = (exercises) => {
  if (!Array.isArray(exercises)) {
    throw new AppError('Add at least one exercise with a name', 400);
  }

  const valid = exercises.filter((exercise) => trim(exercise?.exerciseName));
  if (valid.length === 0) {
    throw new AppError('Add at least one exercise with a name', 400);
  }

  valid.forEach((exercise) => {
    assertText(
      exercise.exerciseName,
      'Exercise name',
      LIMITS.EXERCISE_NAME_MIN,
      LIMITS.EXERCISE_NAME_MAX
    );
    assertOptionalNumber(exercise.sets, 'Sets', LIMITS.EXERCISE_SETS_MIN, LIMITS.EXERCISE_SETS_MAX);
    assertOptionalNumber(exercise.reps, 'Reps', LIMITS.EXERCISE_REPS_MIN, LIMITS.EXERCISE_REPS_MAX);
  });

  return valid;
};

const validateWorkoutPlanInput = (body) => {
  if (!trim(body.clientId)) {
    throw new AppError('Please select a client', 400);
  }

  assertText(body.title, 'Plan title', LIMITS.TITLE_MIN, LIMITS.TITLE_MAX);
  assertText(body.description, 'Description', 0, LIMITS.DESCRIPTION_MAX, false);
  assertRequiredNumber(
    body.duration,
    'Duration (weeks)',
    LIMITS.PLAN_DURATION_MIN,
    LIMITS.PLAN_DURATION_MAX
  );

  const frequency = Number(body.frequency);
  if (
    !Number.isFinite(frequency) ||
    frequency < WORKOUT_FREQUENCY.MIN_PER_WEEK ||
    frequency > WORKOUT_FREQUENCY.MAX_PER_WEEK
  ) {
    throw new AppError(
      `Days per week must be between ${WORKOUT_FREQUENCY.MIN_PER_WEEK} and ${WORKOUT_FREQUENCY.MAX_PER_WEEK}`,
      400
    );
  }

  assertStartDateNotPast(body.startDate);

  if (!Object.values(WORKOUT_TYPES).includes(body.workoutType)) {
    throw new AppError('Invalid workout type', 400);
  }

  validateExercises(body.exercises || []);
};

const validateMeals = (meals) => {
  if (!Array.isArray(meals)) {
    throw new AppError('Add at least one meal with a name', 400);
  }

  const valid = meals.filter((meal) => trim(meal?.mealName));
  if (valid.length === 0) {
    throw new AppError('Add at least one meal with a name', 400);
  }

  valid.forEach((meal) => {
    assertText(meal.mealName, 'Meal name', LIMITS.MEAL_NAME_MIN, LIMITS.MEAL_NAME_MAX);
    assertOptionalNumber(meal.calories, 'Meal calories', 0, LIMITS.MEAL_CALORIES_MAX);
  });

  return valid;
};

const validateDietPlanInput = (body) => {
  if (!trim(body.clientId)) {
    throw new AppError('Please select a client', 400);
  }

  assertText(body.title, 'Plan title', LIMITS.TITLE_MIN, LIMITS.TITLE_MAX);
  assertText(body.description, 'Description', 0, LIMITS.DESCRIPTION_MAX, false);
  assertRequiredNumber(
    body.duration,
    'Duration (weeks)',
    LIMITS.PLAN_DURATION_MIN,
    LIMITS.PLAN_DURATION_MAX
  );
  assertRequiredNumber(
    body.calorieTarget,
    'Daily calorie target',
    LIMITS.CALORIE_TARGET_MIN,
    LIMITS.CALORIE_TARGET_MAX
  );
  assertRequiredNumber(
    body.mealsPerDay,
    'Meals per day',
    LIMITS.MEALS_PER_DAY_MIN,
    LIMITS.MEALS_PER_DAY_MAX
  );

  const macros = body.macronutrients || {};
  const protein = assertRequiredNumber(macros.protein ?? body.protein, 'Protein percentage', 0, 100);
  const carbs = assertRequiredNumber(macros.carbs ?? body.carbs, 'Carbs percentage', 0, 100);
  const fats = assertRequiredNumber(macros.fats ?? body.fats, 'Fats percentage', 0, 100);
  const macroSum = protein + carbs + fats;

  if (Math.abs(macroSum - LIMITS.MACRO_SUM_TARGET) > LIMITS.MACRO_SUM_TOLERANCE) {
    throw new AppError(`Macro percentages must add up to 100% (currently ${macroSum}%)`, 400);
  }

  assertStartDateNotPast(body.startDate);

  if (!Object.values(DIET_TYPES).includes(body.dietType)) {
    throw new AppError('Invalid diet type', 400);
  }

  validateMeals(body.meals || []);
};

const validateProgressLogInput = (payload) => {
  if (!payload?.logType) {
    throw new AppError('Log type is required', 400);
  }

  if (payload.logType === 'workout' && payload.workoutLog) {
    const { workoutLog } = payload;
    const exercises = workoutLog.exercisesCompleted || [];

    if (exercises.length === 0) {
      throw new AppError('Exercise name is required', 400);
    }

    exercises.forEach((exercise) => {
      assertText(
        exercise.exerciseName,
        'Exercise name',
        LIMITS.EXERCISE_NAME_MIN,
        LIMITS.EXERCISE_NAME_MAX
      );
      assertOptionalNumber(exercise.actualSets, 'Sets', LIMITS.EXERCISE_SETS_MIN, LIMITS.EXERCISE_SETS_MAX);
      assertOptionalNumber(exercise.actualReps, 'Reps', LIMITS.EXERCISE_REPS_MIN, LIMITS.EXERCISE_REPS_MAX);
      assertOptionalNumber(exercise.weightUsed, 'Weight', 0, LIMITS.WEIGHT_LIFTED_MAX);
    });

    assertOptionalNumber(
      workoutLog.durationMinutes,
      'Duration',
      LIMITS.WORKOUT_DURATION_MIN,
      LIMITS.WORKOUT_DURATION_MAX
    );
    assertText(workoutLog.notes, 'Notes', 0, LIMITS.NOTES_MAX, false);
  }

  if (payload.logType === 'nutrition' && payload.nutritionLog) {
    const { nutritionLog } = payload;
    const meals = nutritionLog.mealsConsumed || [];

    if (meals.length === 0 || !trim(meals[0])) {
      throw new AppError('Meal description is required', 400);
    }

    assertText(meals[0], 'Meal description', 2, 500);
    assertOptionalNumber(nutritionLog.totalCalories, 'Calories', 0, LIMITS.LOG_CALORIES_MAX);

    const macros = nutritionLog.macros || {};
    assertOptionalNumber(macros.protein, 'Protein', 0, LIMITS.MACRO_GRAMS_MAX);
    assertOptionalNumber(macros.carbs, 'Carbs', 0, LIMITS.MACRO_GRAMS_MAX);
    assertOptionalNumber(macros.fats, 'Fats', 0, LIMITS.MACRO_GRAMS_MAX);
    assertText(nutritionLog.deviationsFromPlan, 'Notes', 0, LIMITS.NOTES_MAX, false);
  }

  if (payload.logType === 'measurement' && payload.measurementLog) {
    const { measurementLog } = payload;
    assertRequiredNumber(measurementLog.weight, 'Weight', LIMITS.WEIGHT_MIN, LIMITS.WEIGHT_MAX);
    assertOptionalNumber(
      measurementLog.bodyFatPercentage,
      'Body fat percentage',
      LIMITS.BODY_FAT_MIN,
      LIMITS.BODY_FAT_MAX
    );
  }
};

const validateFitnessGoalInput = (body) => {
  const goals = Array.isArray(body.goals)
    ? body.goals
    : body.goal
      ? [body.goal]
      : [];

  if (goals.length === 0) {
    throw new AppError('Please select at least one fitness goal', 400);
  }

  goals.forEach((goal) => {
    if (!FITNESS_GOAL_VALUES.includes(goal)) {
      throw new AppError('Invalid fitness goal selected', 400);
    }
  });

  assertRequiredNumber(body.currentWeight, 'Current weight', LIMITS.WEIGHT_MIN, LIMITS.WEIGHT_MAX);
  assertRequiredNumber(body.targetWeight, 'Target weight', LIMITS.WEIGHT_MIN, LIMITS.WEIGHT_MAX);

  const timeline = assertRequiredNumber(body.timeline, 'Timeline', 1, 12);
  if (!LIMITS.TIMELINE_OPTIONS.includes(timeline)) {
    throw new AppError('Please select a valid timeline', 400);
  }
};

const validateAppointmentInput = (body) => {
  assertText(body.topic, 'Topic', 0, LIMITS.TOPIC_MAX, false);
  assertText(body.clientNotes, 'Notes', 0, LIMITS.NOTES_MAX, false);

  if (body.sessionType === 'in_person') {
    assertText(body.location, 'Location', LIMITS.LOCATION_MIN, LIMITS.LOCATION_MAX);
  }
};

const validateRatingInput = (body) => {
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const feedback = body.feedback || body.clientFeedback;
  assertText(feedback, 'Feedback', 0, LIMITS.FEEDBACK_MAX, false);
};

module.exports = {
  LIMITS,
  validateExercises,
  validateMeals,
  validateWorkoutPlanInput,
  validateDietPlanInput,
  validateProgressLogInput,
  validateFitnessGoalInput,
  validateAppointmentInput,
  validateRatingInput,
};
