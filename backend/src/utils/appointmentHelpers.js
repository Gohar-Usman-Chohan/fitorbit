const Appointment = require('../models/Appointment');
const TrainerProfile = require('../models/TrainerProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const User = require('../models/User');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createAndPushNotification } = require('./notificationHelpers');

const normalizeId = (value) => {
  if (!value) return value;
  if (typeof value === 'object' && value._id) return value._id;
  return value;
};

const getDurationMinutes = (appointment) => {
  const duration = appointment.duration || 0;
  return appointment.durationUnit === 'hours' ? duration * 60 : duration;
};

const getAppointmentEndTime = (appointment) => {
  const start = new Date(appointment.appointmentDate);
  return new Date(start.getTime() + getDurationMinutes(appointment) * 60 * 1000);
};

const hasSessionEnded = (appointment, now = new Date()) =>
  getAppointmentEndTime(appointment) <= now;

const recalculateExpertRating = async (expertId, expertType) => {
  const ratings = await Appointment.find({
    expertId,
    expertType,
    status: APPOINTMENT_STATUS.COMPLETED,
    rating: { $gte: 1, $lte: 5 },
  }).select('rating clientId clientFeedback updatedAt');

  const totalRatings = ratings.length;
  const averageRating =
    totalRatings > 0
      ? Math.round((ratings.reduce((sum, item) => sum + item.rating, 0) / totalRatings) * 10) /
        10
      : 0;

  const ProfileModel =
    expertType === 'nutritionist' ? NutritionistProfile : TrainerProfile;

  const profile = await ProfileModel.findOne({ userId: expertId });
  if (!profile) return { averageRating, totalRatings };

  profile.averageRating = averageRating;
  profile.totalRatings = totalRatings;

  profile.testimonials = ratings
    .filter((item) => item.clientFeedback)
    .slice(-10)
    .map((item) => ({
      clientId: item.clientId,
      rating: item.rating,
      content: item.clientFeedback,
      date: item.updatedAt || new Date(),
    }));

  await profile.save();
  return { averageRating, totalRatings };
};

const sendClientRatingNotification = async (app, appointment) => {
  if (appointment.ratingReminderSent || appointment.rating) return;

  const clientId = normalizeId(appointment.clientId);
  const expertId = normalizeId(appointment.expertId);
  const expert = await User.findById(expertId).select('firstName lastName');
  const expertName = expert
    ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
    : 'your expert';

  await createAndPushNotification(app, {
    userId: clientId,
    title: 'Rate your session',
    message: `How was your session with ${expertName}? Leave a rating to help others.`,
    type: NOTIFICATION_TYPES.APPOINTMENT,
    relatedEntityId: appointment._id,
    relatedEntityType: 'appointment',
    actionUrl: `/client/appointments?rate=${appointment._id}`,
    priority: 'high',
  });

  appointment.ratingReminderSent = true;
  await appointment.save();
};

const finalizeAppointmentCompletion = async (
  app,
  appointment,
  { autoCompleted = false, expertNotes } = {}
) => {
  if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    if (!appointment.ratingReminderSent && !appointment.rating) {
      await sendClientRatingNotification(app, appointment);
    }
    return appointment;
  }

  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  appointment.completedAt = appointment.completedAt || new Date();
  appointment.autoCompleted = autoCompleted;
  appointment.paymentStatus = 'completed';
  if (expertNotes !== undefined) {
    appointment.expertNotes = expertNotes;
  }
  await appointment.save();

  await sendClientRatingNotification(app, appointment);
  return appointment;
};

const getExpertHourlyRate = async (expertId, expertType) => {
  const ProfileModel = expertType === 'nutritionist' ? NutritionistProfile : TrainerProfile;
  const profile = await ProfileModel.findOne({ userId: expertId }).select('hourlyRate consultationFee');
  return profile?.hourlyRate || profile?.consultationFee || 50;
};

const calculateSessionAmount = async (expertId, expertType, durationMinutes) => {
  const hourlyRate = await getExpertHourlyRate(expertId, expertType);
  return Math.round(hourlyRate * (durationMinutes / 60) * 100) / 100;
};

module.exports = {
  normalizeId,
  getDurationMinutes,
  getAppointmentEndTime,
  hasSessionEnded,
  recalculateExpertRating,
  sendClientRatingNotification,
  finalizeAppointmentCompletion,
  getExpertHourlyRate,
  calculateSessionAmount,
};
