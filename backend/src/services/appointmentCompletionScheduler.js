/**
 * Auto-completes scheduled appointments after session end time and
 * prompts clients to leave a rating.
 */

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const { APPOINTMENT_STATUS } = require('../config/constants');
const {
  hasSessionEnded,
  finalizeAppointmentCompletion,
} = require('../utils/appointmentHelpers');

const CHECK_INTERVAL_MS = 30 * 1000;
const COMPLETION_GRACE_HOURS = 48;

const processDueCompletions = async (app) => {
  if (mongoose.connection.readyState !== 1) return 0;

  const now = new Date();
  const oldestEligibleStart = new Date(
    now.getTime() - COMPLETION_GRACE_HOURS * 60 * 60 * 1000
  );

  const candidates = await Appointment.find({
    status: APPOINTMENT_STATUS.SCHEDULED,
    appointmentDate: { $lte: now, $gte: oldestEligibleStart },
  }).limit(100);

  let completedCount = 0;

  for (const appointment of candidates) {
    if (!hasSessionEnded(appointment, now)) continue;

    try {
      await finalizeAppointmentCompletion(app, appointment, { autoCompleted: true });
      completedCount += 1;
      console.log(
        `✅ Appointment ${appointment._id} auto-completed (session ended ${appointment.appointmentDate.toISOString()})`
      );
    } catch (error) {
      console.error(
        `Failed to auto-complete appointment ${appointment._id}:`,
        error.message
      );
    }
  }

  return completedCount;
};

const startAppointmentCompletionScheduler = (app) => {
  let timer = null;
  let started = false;

  const startPolling = () => {
    if (started) return timer;
    started = true;

    processDueCompletions(app).catch((error) => {
      console.error('Appointment completion check failed:', error.message);
    });

    timer = setInterval(() => {
      processDueCompletions(app).catch((error) => {
        console.error('Appointment completion check failed:', error.message);
      });
    }, CHECK_INTERVAL_MS);

    console.log(
      `✅ Appointment auto-completion enabled (after session end, every ${CHECK_INTERVAL_MS / 1000}s)`
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
  CHECK_INTERVAL_MS,
  startAppointmentCompletionScheduler,
  processDueCompletions,
};
