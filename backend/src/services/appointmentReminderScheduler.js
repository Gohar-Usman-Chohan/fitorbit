/**
 * Sends in-app reminders to trainers/nutritionists 5 minutes before
 * online appointments so they can open chat and share the meeting link.
 */

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createAndPushNotification } = require('../utils/notificationHelpers');
const { buildExpertChatUrl } = require('../utils/chatHelpers');
const { formatDateTime } = require('../utils/dateFormat');

const REMINDER_MINUTES = 5;
/** If the scheduler misses the exact window, still send up to this long after start. */
const REMINDER_GRACE_MINUTES = 15;
const CHECK_INTERVAL_MS = 15 * 1000;

/**
 * Eligible when:
 * - starts within the next REMINDER_MINUTES, OR
 * - already started but still within REMINDER_GRACE_MINUTES (catch-up)
 */
const buildDueReminderQuery = (now = new Date()) => {
  const latestEligible = new Date(now.getTime() + REMINDER_MINUTES * 60 * 1000);
  const earliestEligible = new Date(
    now.getTime() - REMINDER_GRACE_MINUTES * 60 * 1000
  );

  return {
    sessionType: 'online',
    status: APPOINTMENT_STATUS.SCHEDULED,
    reminderSent: false,
    appointmentDate: { $gt: earliestEligible, $lte: latestEligible },
  };
};

const normalizeId = (value) => {
  if (!value) return value;
  if (typeof value === 'object' && value._id) return value._id;
  return value;
};

const sendOnlineSessionReminder = async (app, appointment) => {
  const clientId = normalizeId(appointment.clientId);
  const expertId = normalizeId(appointment.expertId);

  const client = await User.findById(clientId).select('firstName lastName');
  const clientName = client
    ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
    : 'Your client';

  const startsAt = formatDateTime(appointment.appointmentDate);
  const actionUrl = await buildExpertChatUrl({
    expertType: appointment.expertType,
    expertId,
    clientId,
  });

  const conversationIdMatch = actionUrl.match(/conversationId=([^&]+)/);
  const conversationId = conversationIdMatch ? conversationIdMatch[1] : undefined;

  const msUntilStart = appointment.appointmentDate.getTime() - Date.now();
  const started = msUntilStart <= 0;
  const title = started ? 'Online session started' : 'Online session starting soon';
  const message = started
    ? `${clientName}'s video session has started. Open chat to send the meeting link.`
    : `${clientName}'s video session starts at ${startsAt}. Open chat to send the meeting link.`;

  await createAndPushNotification(app, {
    userId: expertId,
    title,
    message,
    type: NOTIFICATION_TYPES.APPOINTMENT,
    relatedEntityId: appointment._id,
    relatedEntityType: 'appointment',
    actionUrl,
    conversationId,
    priority: 'high',
  });

  appointment.reminderSent = true;
  appointment.reminderTime = new Date();
  await appointment.save();
};

const processDueReminders = async (app) => {
  if (mongoose.connection.readyState !== 1) {
    return 0;
  }

  const dueAppointments = await Appointment.find(buildDueReminderQuery()).limit(50);

  for (const appointment of dueAppointments) {
    try {
      await sendOnlineSessionReminder(app, appointment);
      console.log(
        `📅 Online session reminder sent for appointment ${appointment._id} (starts ${appointment.appointmentDate.toISOString()})`
      );
    } catch (error) {
      console.error(
        `Failed to send reminder for appointment ${appointment._id}:`,
        error.message
      );
    }
  }

  return dueAppointments.length;
};

/** Run a reminder check for one appointment right after booking (same-day / soon sessions). */
const checkAppointmentReminder = async (app, appointmentId) => {
  if (!app || mongoose.connection.readyState !== 1) return;

  const due = await Appointment.find({
    ...buildDueReminderQuery(),
    _id: appointmentId,
  }).limit(1);

  if (due.length > 0) {
    await sendOnlineSessionReminder(app, due[0]);
  }
};

const startAppointmentReminderScheduler = (app) => {
  let timer = null;
  let started = false;

  const startPolling = () => {
    if (started) return timer;
    started = true;

    processDueReminders(app).catch((error) => {
      console.error('Appointment reminder check failed:', error.message);
    });

    timer = setInterval(() => {
      processDueReminders(app).catch((error) => {
        console.error('Appointment reminder check failed:', error.message);
      });
    }, CHECK_INTERVAL_MS);

    console.log(
      `⏰ Online appointment reminders enabled (${REMINDER_MINUTES} min before, every ${CHECK_INTERVAL_MS / 1000}s)`
    );

    return timer;
  };

  if (mongoose.connection.readyState === 1) {
    startPolling();
  } else {
    mongoose.connection.once('connected', startPolling);
  }

  return timer;
};

module.exports = {
  REMINDER_MINUTES,
  REMINDER_GRACE_MINUTES,
  CHECK_INTERVAL_MS,
  buildDueReminderQuery,
  startAppointmentReminderScheduler,
  processDueReminders,
  checkAppointmentReminder,
};
