/**
 * ============================================
 * APPOINTMENT CONTROLLER
 * ============================================
 * Handles appointment booking and management
 */

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const emailService = require('../services/emailService');
const { AppError } = require('../middleware/errorHandler');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPES, PAYMENT_STATUS } = require('../config/constants');
const { formatAppointment } = require('../utils/responseFormatters');
const { formatDateTime } = require('../utils/dateFormat');
const { createAndPushNotification } = require('../utils/notificationHelpers');
const { checkAppointmentReminder, processDueReminders } = require('../services/appointmentReminderScheduler');
const { processDueCompletions } = require('../services/appointmentCompletionScheduler');
const {
  recalculateExpertRating,
  finalizeAppointmentCompletion,
} = require('../utils/appointmentHelpers');
const {
  BOOKING_WINDOW_LABEL,
  BLOCKING_STATUSES,
  validateBookingRequest,
  generateAvailableSlots,
} = require('../utils/bookingRules');
const { calculateSessionAmount } = require('../utils/appointmentHelpers');
const { validateAppointmentInput, validateRatingInput } = require('../utils/validators');

const getAppointmentId = (req) => req.params.id || req.params.appointmentId;

const getAppointmentHistory = (req, res, next) => {
  req.query.history = 'true';
  return listAppointments(req, res, next);
};

/**
 * List appointments
 */
const listAppointments = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, status, userId, history } = req.query;

    const query = {};
    if (status) query.status = status;

    const scopedUserId = userId || (req.user.role !== 'admin' ? req.user.id : undefined);
    const filters = [];

    if (scopedUserId) {
      filters.push({ $or: [{ clientId: scopedUserId }, { expertId: scopedUserId }] });
    }

    if (history === 'true') {
      filters.push({
        $or: [
          { appointmentDate: { $lt: new Date() } },
          { status: { $in: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED] } }
        ]
      });
    }

    if (filters.length === 1) {
      Object.assign(query, filters[0]);
    } else if (filters.length > 1) {
      query.$and = filters;
    }

    const appointments = await Appointment.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('expertId', 'firstName lastName email')
      .sort({ appointmentDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Appointment.countDocuments(query);

    setImmediate(() => {
      processDueReminders(req.app).catch((err) => {
        console.error('Appointment reminder sweep failed:', err.message);
      });
      processDueCompletions(req.app).catch((err) => {
        console.error('Appointment completion sweep failed:', err.message);
      });
    });

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved',
      data: {
        appointments: appointments.map(formatAppointment),
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create appointment
 */
const createAppointment = async (req, res, next) => {
  try {
    const clientId = req.body.clientId || req.user.id;
    const { expertId, expertType, appointmentDate, duration, durationUnit, sessionType, location, topic, clientNotes } = req.body;

    if (!clientId || !expertId || !appointmentDate || !duration) {
      throw new AppError('Missing required fields', 400);
    }

    validateAppointmentInput(req.body);

    // Check if expert exists
    const expert = await User.findById(expertId);
    if (!expert) {
      throw new AppError('Expert not found', 404);
    }

    const parsedDate = new Date(appointmentDate);
    const durationMinutes = durationUnit === 'hours' ? duration * 60 : duration;

    const existingAppointments = await Appointment.find({
      expertId,
      status: { $in: BLOCKING_STATUSES },
    });

    const validation = validateBookingRequest(parsedDate, durationMinutes, existingAppointments);
    if (!validation.valid) {
      throw new AppError(validation.reason, 400);
    }

    const paymentAmount = await calculateSessionAmount(expertId, expertType, durationMinutes);

    const appointment = new Appointment({
      clientId,
      expertId,
      expertType,
      appointmentDate: parsedDate,
      duration,
      durationUnit: durationUnit || 'minutes',
      sessionType,
      location,
      topic,
      clientNotes,
      status: APPOINTMENT_STATUS.PENDING_APPROVAL,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentAmount,
    });

    await appointment.save();

    let clientProfile = await ClientProfile.findOne({ userId: clientId });
    if (!clientProfile) {
      clientProfile = await ClientProfile.create({ userId: clientId });
    }

    const resolvedExpertType = expertType || expert.role;
    if (resolvedExpertType === 'trainer' && !clientProfile.assignedTrainerId) {
      clientProfile.assignedTrainerId = expertId;
      await clientProfile.save();
    }
    if (resolvedExpertType === 'nutritionist' && !clientProfile.assignedNutritionistId) {
      clientProfile.assignedNutritionistId = expertId;
      await clientProfile.save();
    }

    // Send email notification (non-blocking)
    try {
      const client = await User.findById(clientId);
      if (client) {
        await emailService.sendAppointmentConfirmation(client.email, appointment);
      }
    } catch (emailError) {
      console.error('Appointment confirmation email failed:', emailError.message);
    }

    const client = await User.findById(clientId).select('firstName lastName role');
    const clientName = client
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : 'A client';
    const expertName = `${expert.firstName || ''} ${expert.lastName || ''}`.trim() || 'Expert';
    const appointmentDateLabel = formatDateTime(appointmentDate);

    const schedulePath =
      expert.role === 'nutritionist' ? '/nutritionist/schedule' : '/trainer/schedule';

    await createAndPushNotification(req, {
      userId: expertId,
      title: 'Booking approval needed',
      message: `${clientName} requested a session on ${appointmentDateLabel}. Review and approve.`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: schedulePath,
    });

    await createAndPushNotification(req, {
      userId: clientId,
      title: 'Booking request sent',
      message: `Your request with ${expertName} on ${appointmentDateLabel} is pending approval.`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: '/client/appointments',
    });

    setImmediate(() => {
      checkAppointmentReminder(req.app, appointment._id).catch((err) => {
        console.error('Post-booking reminder check failed:', err.message);
      });
    });

    res.status(201).json({
      success: true,
      message: 'Booking request submitted. You will be notified when the expert approves.',
      data: { appointment: formatAppointment(appointment) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment details
 */
const getAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);

    const appointment = await Appointment.findById(appointmentId)
      .populate('clientId', 'firstName lastName email')
      .populate('expertId', 'firstName lastName email');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment retrieved',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment
 */
const updateAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);

    const appointment = await Appointment.findByIdAndUpdate(appointmentId, req.body, { new: true, runValidators: true })
      .populate('clientId', 'firstName lastName email')
      .populate('expertId', 'firstName lastName email');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const { cancellationReason, reason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: APPOINTMENT_STATUS.CANCELLED, cancellationReason: cancellationReason || reason },
      { new: true }
    );

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule appointment
 */
const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const { newDate } = req.body;

    if (!newDate) {
      throw new AppError('New date is required', 400);
    }

    // Create new appointment with rescheduled info
    const originalAppointment = await Appointment.findById(appointmentId);
    if (!originalAppointment) {
      throw new AppError('Appointment not found', 404);
    }

    const newAppointment = new Appointment({
      ...originalAppointment.toObject(),
      _id: undefined,
      appointmentDate: new Date(newDate),
      status: APPOINTMENT_STATUS.SCHEDULED,
      rescheduledFrom: appointmentId
    });

    await newAppointment.save();

    // Update original appointment
    originalAppointment.status = APPOINTMENT_STATUS.RESCHEDULED;
    await originalAppointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: { appointment: newAppointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete appointment (expert manual)
 */
const completeAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const { expertNotes, notes } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (String(appointment.expertId) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new AppError('Only the assigned expert can complete this appointment', 403);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError('Cancelled appointments cannot be completed', 400);
    }

    if (appointment.status === APPOINTMENT_STATUS.NO_SHOW) {
      throw new AppError('No-show appointments cannot be completed', 400);
    }

    await finalizeAppointmentCompletion(req.app, appointment, {
      autoCompleted: false,
      expertNotes: expertNotes || notes,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark appointment as no-show (expert manual)
 */
const markNoShow = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (String(appointment.expertId) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new AppError('Only the assigned expert can mark no-show', 403);
    }

    if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) {
      throw new AppError('Only scheduled appointments can be marked as no-show', 400);
    }

    appointment.status = APPOINTMENT_STATUS.NO_SHOW;
    appointment.expertNotes = reason || appointment.expertNotes;
    appointment.paymentStatus = 'completed';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment marked as no-show',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Client rates a completed appointment
 */
const rateAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const { rating, feedback, clientFeedback } = req.body;

    validateRatingInput(req.body);

    const parsedRating = Number(rating);

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (String(appointment.clientId) !== String(req.user.id)) {
      throw new AppError('Only the client can rate this appointment', 403);
    }

    if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
      throw new AppError('You can only rate completed sessions', 400);
    }

    if (appointment.rating) {
      throw new AppError('You have already rated this session', 400);
    }

    appointment.rating = parsedRating;
    appointment.clientFeedback = clientFeedback || feedback || appointment.clientFeedback;
    await appointment.save();

    const { averageRating, totalRatings } = await recalculateExpertRating(
      appointment.expertId,
      appointment.expertType
    );

    const expert = await User.findById(appointment.expertId).select('firstName lastName role');
    const clientName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'A client';

    await createAndPushNotification(req, {
      userId: appointment.expertId,
      title: 'New client rating',
      message: `${clientName} rated your session ${parsedRating}/5`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: expert?.role === 'nutritionist' ? '/nutritionist/schedule' : '/trainer/schedule',
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback',
      data: {
        appointment: formatAppointment(appointment),
        expertAverageRating: averageRating,
        expertTotalRatings: totalRatings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Expert approves a pending booking request
 */
const approveAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) throw new AppError('Appointment not found', 404);
    if (String(appointment.expertId) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new AppError('Only the assigned expert can approve this request', 403);
    }
    if (appointment.status !== APPOINTMENT_STATUS.PENDING_APPROVAL) {
      throw new AppError('Only pending requests can be approved', 400);
    }

    const durationMinutes =
      appointment.durationUnit === 'hours'
        ? appointment.duration * 60
        : appointment.duration;

    const conflicts = await Appointment.find({
      expertId: appointment.expertId,
      _id: { $ne: appointment._id },
      status: { $in: BLOCKING_STATUSES },
    });

    const validation = validateBookingRequest(
      appointment.appointmentDate,
      durationMinutes,
      conflicts
    );
    if (!validation.valid) {
      throw new AppError(validation.reason, 409);
    }

    appointment.status = APPOINTMENT_STATUS.AWAITING_PAYMENT;
    await appointment.save();

    const client = await User.findById(appointment.clientId).select('firstName lastName');
    const expert = await User.findById(appointment.expertId).select('firstName lastName role');
    const clientName = client
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : 'Client';
    const expertName = expert
      ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
      : 'Expert';
    const when = formatDateTime(appointment.appointmentDate);

    await createAndPushNotification(req, {
      userId: appointment.clientId,
      title: 'Booking approved — payment required',
      message: `${expertName} approved your session on ${when}. Complete payment to confirm.`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: `/client/appointments?pay=${appointment._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Booking approved. Client has been asked to pay.',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Expert rejects a pending booking request
 */
const rejectAppointment = async (req, res, next) => {
  try {
    const appointmentId = getAppointmentId(req);
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new AppError('Appointment not found', 404);
    if (String(appointment.expertId) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new AppError('Only the assigned expert can reject this request', 403);
    }
    if (appointment.status !== APPOINTMENT_STATUS.PENDING_APPROVAL) {
      throw new AppError('Only pending requests can be rejected', 400);
    }

    appointment.status = APPOINTMENT_STATUS.REJECTED;
    appointment.rejectionReason = reason || 'Rejected by expert';
    await appointment.save();

    const expert = await User.findById(appointment.expertId).select('firstName lastName');
    const expertName = expert
      ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
      : 'Expert';

    await createAndPushNotification(req, {
      userId: appointment.clientId,
      title: 'Booking request declined',
      message: `${expertName} declined your session request.${reason ? ` Reason: ${reason}` : ''}`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: '/client/appointments',
    });

    res.status(200).json({
      success: true,
      message: 'Booking request rejected',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability slots (Mon–Fri 9 AM – 5 PM, conflict-aware)
 */
const getAvailability = async (req, res, next) => {
  try {
    const expertId = req.params.expertId || req.query.expertId;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const duration = parseInt(req.query.duration || '60', 10);

    if (!expertId) {
      throw new AppError('Expert ID is required', 400);
    }

    const existingAppointments = await Appointment.find({
      expertId,
      status: { $in: BLOCKING_STATUSES },
      appointmentDate: {
        $gte: new Date(`${date}T00:00:00`),
        $lt: new Date(new Date(`${date}T00:00:00`).getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const slots = generateAvailableSlots(date, duration, existingAppointments);

    res.status(200).json({
      success: true,
      message: 'Availability slots retrieved',
      data: {
        slots,
        bookingWindow: BOOKING_WINDOW_LABEL,
        workDays: 'Monday – Friday',
        hours: '9:00 AM – 5:00 PM',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAppointments,
  getAppointmentHistory,
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  markNoShow,
  rateAppointment,
  getAvailability
};
