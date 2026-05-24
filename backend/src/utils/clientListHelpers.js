const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');
const { ACCOUNT_STATUS, USER_ROLES } = require('../config/constants');

const mergeUniqueIds = (groups) =>
  [
    ...new Set(
      groups
        .flat()
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

const getActiveClientIds = async () => {
  const clients = await User.find({
    role: USER_ROLES.CLIENT,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    isEmailVerified: true,
  }).select('_id');

  return clients.map((client) => String(client._id));
};

const getTrainerContactClientIds = async (trainerId) => {
  const [assignedProfiles, workoutClientIds, appointmentClientIds] = await Promise.all([
    ClientProfile.find({ assignedTrainerId: trainerId }).select('userId'),
    WorkoutPlan.distinct('clientId', { trainerId }),
    Appointment.distinct('clientId', { expertId: trainerId }),
  ]);

  return mergeUniqueIds([
    assignedProfiles.map((profile) => profile.userId),
    workoutClientIds,
    appointmentClientIds,
  ]);
};

const getNutritionistContactClientIds = async (nutritionistId) => {
  const [assignedProfiles, dietClientIds, appointmentClientIds] = await Promise.all([
    ClientProfile.find({ assignedNutritionistId: nutritionistId }).select('userId'),
    DietPlan.distinct('clientId', { nutritionistId }),
    Appointment.distinct('clientId', { expertId: nutritionistId }),
  ]);

  return mergeUniqueIds([
    assignedProfiles.map((profile) => profile.userId),
    dietClientIds,
    appointmentClientIds,
  ]);
};

const getTrainerAssignableClientIds = async (trainerId) => {
  const [contactIds, activeIds] = await Promise.all([
    getTrainerContactClientIds(trainerId),
    getActiveClientIds(),
  ]);

  return mergeUniqueIds([contactIds, activeIds]);
};

const getNutritionistAssignableClientIds = async (nutritionistId) => {
  const [contactIds, activeIds] = await Promise.all([
    getNutritionistContactClientIds(nutritionistId),
    getActiveClientIds(),
  ]);

  return mergeUniqueIds([contactIds, activeIds]);
};

const buildClientListUserQuery = (paginatedIds, scope) => {
  const query = {
    _id: { $in: paginatedIds },
    role: USER_ROLES.CLIENT,
  };

  if (scope === 'assignable') {
    query.accountStatus = ACCOUNT_STATUS.ACTIVE;
    query.isEmailVerified = true;
    return query;
  }

  query.accountStatus = {
    $nin: [ACCOUNT_STATUS.DELETED, ACCOUNT_STATUS.SUSPENDED],
  };

  return query;
};

const assertAssignableClient = async (clientId) => {
  const client = await User.findById(clientId).select(
    'role accountStatus isEmailVerified firstName lastName'
  );

  if (!client || client.role !== USER_ROLES.CLIENT) {
    throw new AppError('Please select a valid client', 400);
  }

  if (!client.isEmailVerified) {
    throw new AppError('This client has not verified their email yet', 400);
  }

  if (client.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Plans can only be assigned to active client accounts', 400);
  }

  return client;
};

module.exports = {
  getActiveClientIds,
  getTrainerContactClientIds,
  getNutritionistContactClientIds,
  getTrainerAssignableClientIds,
  getNutritionistAssignableClientIds,
  buildClientListUserQuery,
  assertAssignableClient,
};
