/**
 * Fixed expert availability and booking conflict rules.
 * Experts are available Monday–Friday, 9:00 AM – 5:00 PM.
 */

const { APPOINTMENT_STATUS } = require('../config/constants');
const { getDurationMinutes, getAppointmentEndTime } = require('./appointmentHelpers');

const BOOKING_WINDOW = {
  START_HOUR: 9,
  END_HOUR: 17,
  SLOT_INTERVAL_MINUTES: 30,
  /** Monday = 1 … Friday = 5 */
  WORK_DAYS: [1, 2, 3, 4, 5],
};

const BLOCKING_STATUSES = [
  APPOINTMENT_STATUS.PENDING_APPROVAL,
  APPOINTMENT_STATUS.AWAITING_PAYMENT,
  APPOINTMENT_STATUS.SCHEDULED,
];

const BOOKING_WINDOW_LABEL = 'Monday – Friday, 9:00 AM – 5:00 PM';

const isWorkday = (date) => BOOKING_WINDOW.WORK_DAYS.includes(date.getDay());

const buildLocalDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const intervalsOverlap = (startA, endA, startB, endB) =>
  startA < endB && startB < endA;

const getSlotEndTime = (start, durationMinutes) =>
  new Date(start.getTime() + durationMinutes * 60 * 1000);

const isWithinBookingWindow = (start, durationMinutes) => {
  if (!isWorkday(start)) {
    return { valid: false, reason: 'Bookings are only available Monday to Friday.' };
  }

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const windowStart = BOOKING_WINDOW.START_HOUR * 60;
  const windowEnd = BOOKING_WINDOW.END_HOUR * 60;
  const end = getSlotEndTime(start, durationMinutes);
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  if (startMinutes < windowStart) {
    return { valid: false, reason: 'Sessions cannot start before 9:00 AM.' };
  }

  if (endMinutes > windowEnd || end.getDate() !== start.getDate()) {
    return { valid: false, reason: 'Sessions must finish by 5:00 PM.' };
  }

  if (start <= new Date()) {
    return { valid: false, reason: 'Please choose a future date and time.' };
  }

  return { valid: true };
};

const appointmentBlocksSlot = (existing, slotStart, slotEnd) => {
  if (!BLOCKING_STATUSES.includes(existing.status)) return false;
  const aptStart = new Date(existing.appointmentDate);
  const aptEnd = getAppointmentEndTime(existing);
  return intervalsOverlap(slotStart, slotEnd, aptStart, aptEnd);
};

const hasSchedulingConflict = (existingAppointments, slotStart, durationMinutes) => {
  const slotEnd = getSlotEndTime(slotStart, durationMinutes);
  return existingAppointments.some((apt) =>
    appointmentBlocksSlot(apt, slotStart, slotEnd)
  );
};

const generateAvailableSlots = (dateStr, durationMinutes, existingAppointments = []) => {
  const day = new Date(`${dateStr}T12:00:00`);
  if (!isWorkday(day)) return [];

  const slots = [];
  const interval = BOOKING_WINDOW.SLOT_INTERVAL_MINUTES;

  for (
    let minutes = BOOKING_WINDOW.START_HOUR * 60;
    minutes < BOOKING_WINDOW.END_HOUR * 60;
    minutes += interval
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const slotStart = buildLocalDateTime(
      dateStr,
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    );
    const slotEnd = getSlotEndTime(slotStart, durationMinutes);

    const windowCheck = isWithinBookingWindow(slotStart, durationMinutes);
    if (!windowCheck.valid) continue;

    const conflict = hasSchedulingConflict(existingAppointments, slotStart, durationMinutes);

    slots.push({
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      datetime: slotStart.toISOString(),
      available: !conflict,
    });
  }

  return slots;
};

const validateBookingRequest = (appointmentDate, durationMinutes, existingAppointments) => {
  const start = new Date(appointmentDate);
  const windowCheck = isWithinBookingWindow(start, durationMinutes);
  if (!windowCheck.valid) {
    return windowCheck;
  }

  if (hasSchedulingConflict(existingAppointments, start, durationMinutes)) {
    return {
      valid: false,
      reason: 'This time slot is no longer available. Please choose another slot.',
    };
  }

  return { valid: true };
};

const parseAppointmentDateTime = (appointmentDate, appointmentTime) => {
  if (
    appointmentTime &&
    typeof appointmentDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)
  ) {
    return buildLocalDateTime(appointmentDate, appointmentTime);
  }

  return new Date(appointmentDate);
};

module.exports = {
  BOOKING_WINDOW,
  BOOKING_WINDOW_LABEL,
  BLOCKING_STATUSES,
  buildLocalDateTime,
  parseAppointmentDateTime,
  generateAvailableSlots,
  validateBookingRequest,
  hasSchedulingConflict,
  isWithinBookingWindow,
  isWorkday,
};
