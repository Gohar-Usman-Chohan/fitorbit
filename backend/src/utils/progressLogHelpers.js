/**
 * Normalize progress log payloads from frontend forms into schema shape.
 */
const { validateProgressLogInput } = require('./validators');

const normalizeProgressLogPayload = (body = {}) => {
  const logType = body.logType || body.type;

  if (!logType) {
    return null;
  }

  const payload = {
    logType,
    logDate: body.logDate ? new Date(body.logDate) : new Date(),
    visibleToTrainer: body.visibleToTrainer ?? true,
    visibleToNutritionist: body.visibleToNutritionist ?? true,
    mood: body.mood,
    energyLevel: body.energyLevel
  };

  if (body.workoutLog) {
    payload.workoutLog = body.workoutLog;
  } else if (logType === 'workout') {
    const exercises = [];

    if (Array.isArray(body.exercises)) {
      exercises.push(...body.exercises);
    } else if (body.exerciseName) {
      exercises.push({
        exerciseName: body.exerciseName,
        actualSets: body.sets !== undefined && body.sets !== '' ? Number(body.sets) : undefined,
        actualReps: body.reps !== undefined && body.reps !== '' ? Number(body.reps) : undefined,
        weightUsed: body.weight !== undefined && body.weight !== '' ? Number(body.weight) : undefined
      });
    }

    payload.workoutLog = {
      durationMinutes:
        body.duration !== undefined && body.duration !== ''
          ? Number(body.duration)
          : body.durationMinutes,
      notes: body.notes,
      intensityLevel: body.intensityLevel ? Number(body.intensityLevel) : undefined,
      caloriesBurned: body.caloriesBurned ? Number(body.caloriesBurned) : undefined,
      exercisesCompleted: exercises
    };
  }

  if (body.nutritionLog) {
    payload.nutritionLog = body.nutritionLog;
  } else if (logType === 'nutrition') {
    payload.nutritionLog = {
      mealType: body.mealType,
      mealsConsumed: body.mealsConsumed || (body.mealDescription ? [body.mealDescription] : []),
      totalCalories:
        body.calories !== undefined && body.calories !== ''
          ? Number(body.calories)
          : body.totalCalories,
      macros: {
        protein:
          body.protein !== undefined && body.protein !== ''
            ? Number(body.protein)
            : body.macros?.protein,
        carbs:
          body.carbs !== undefined && body.carbs !== ''
            ? Number(body.carbs)
            : body.macros?.carbs,
        fats:
          body.fats !== undefined && body.fats !== ''
            ? Number(body.fats)
            : body.macros?.fats
      },
      waterIntake: body.waterIntake ? Number(body.waterIntake) : undefined,
      deviationsFromPlan: body.notes || body.deviationsFromPlan
    };
  }

  if (body.measurementLog) {
    payload.measurementLog = body.measurementLog;
  } else if (logType === 'measurement') {
    payload.measurementLog = {
      weight: body.weight !== undefined && body.weight !== '' ? Number(body.weight) : undefined,
      measurements: body.measurements,
      bodyFatPercentage: body.bodyFatPercentage ? Number(body.bodyFatPercentage) : undefined,
      muscleMass: body.muscleMass ? Number(body.muscleMass) : undefined
    };
  }

  if (body.milestoneLog) {
    payload.milestoneLog = body.milestoneLog;
  }

  return payload;
};

const normalizeAndValidateProgressLogPayload = (body = {}) => {
  const payload = normalizeProgressLogPayload(body);
  if (!payload) {
    return null;
  }
  validateProgressLogInput(payload);
  return payload;
};

module.exports = {
  normalizeProgressLogPayload,
  normalizeAndValidateProgressLogPayload,
};
