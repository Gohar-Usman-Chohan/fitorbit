const User = require('../models/User');
const { createAndPushNotification } = require('./notificationHelpers');
const { NOTIFICATION_TYPES } = require('../config/constants');

const getExpertDisplayName = async (expertId) => {
  if (!expertId) return 'Your expert';
  const user = await User.findById(expertId).select('firstName lastName');
  if (!user) return 'Your expert';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Your expert';
};

const notifyClientWorkoutPlan = async (
  req,
  { clientId, expertId, plan, isUpdate = false, contentUpdated = false }
) => {
  if (!clientId || !plan) return;

  const expertName = await getExpertDisplayName(expertId);
  const exerciseCount = Array.isArray(plan.exercises) ? plan.exercises.length : 0;
  const planTitle = plan.title || 'Workout plan';

  let title;
  let message;

  if (isUpdate && contentUpdated) {
    title = 'Workout exercises updated';
    message =
      exerciseCount > 0
        ? `${expertName} updated "${planTitle}" with ${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}.`
        : `${expertName} updated your workout plan "${planTitle}".`;
  } else if (isUpdate) {
    title = 'Workout plan updated';
    message = `${expertName} updated your workout plan "${planTitle}".`;
  } else {
    title = 'New workout plan assigned';
    message =
      exerciseCount > 0
        ? `${expertName} assigned you "${planTitle}" with ${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}.`
        : `${expertName} assigned you a new workout plan "${planTitle}".`;
  }

  await createAndPushNotification(req, {
    userId: clientId,
    title,
    message,
    type: NOTIFICATION_TYPES.PLAN_ASSIGNED,
    relatedEntityId: plan._id,
    relatedEntityType: 'plan',
    actionUrl: '/client/workouts',
    priority: 'medium',
  });
};

const notifyClientDietPlan = async (
  req,
  { clientId, expertId, plan, isUpdate = false, contentUpdated = false }
) => {
  if (!clientId || !plan) return;

  const expertName = await getExpertDisplayName(expertId);
  const mealCount = Array.isArray(plan.meals) ? plan.meals.length : 0;
  const planTitle = plan.title || 'Diet plan';

  let title;
  let message;

  if (isUpdate && contentUpdated) {
    title = 'Diet meals updated';
    message =
      mealCount > 0
        ? `${expertName} updated "${planTitle}" with ${mealCount} meal${mealCount === 1 ? '' : 's'}.`
        : `${expertName} updated your diet plan "${planTitle}".`;
  } else if (isUpdate) {
    title = 'Diet plan updated';
    message = `${expertName} updated your diet plan "${planTitle}".`;
  } else {
    title = 'New diet plan assigned';
    message =
      mealCount > 0
        ? `${expertName} assigned you "${planTitle}" with ${mealCount} meal${mealCount === 1 ? '' : 's'}.`
        : `${expertName} assigned you a new diet plan "${planTitle}".`;
  }

  await createAndPushNotification(req, {
    userId: clientId,
    title,
    message,
    type: NOTIFICATION_TYPES.PLAN_ASSIGNED,
    relatedEntityId: plan._id,
    relatedEntityType: 'plan',
    actionUrl: '/client/nutrition',
    priority: 'medium',
  });
};

module.exports = {
  notifyClientWorkoutPlan,
  notifyClientDietPlan,
};
