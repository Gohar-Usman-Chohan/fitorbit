/**
 * Dummy Stripe-style payment flow for appointment bookings.
 */

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { APPOINTMENT_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createAndPushNotification } = require('../utils/notificationHelpers');
const { formatAppointment } = require('../utils/responseFormatters');
const { validateBookingRequest, BLOCKING_STATUSES } = require('../utils/bookingRules');
const { getDurationMinutes, calculateSessionAmount } = require('../utils/appointmentHelpers');
const { formatDateTime } = require('../utils/dateFormat');

const createCheckoutSession = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) throw new AppError('Appointment ID is required', 400);

    const appointment = await Appointment.findById(appointmentId)
      .populate('expertId', 'firstName lastName role');

    if (!appointment) throw new AppError('Appointment not found', 404);
    if (String(appointment.clientId) !== String(req.user.id)) {
      throw new AppError('Only the client can pay for this appointment', 403);
    }
    if (appointment.status !== APPOINTMENT_STATUS.AWAITING_PAYMENT) {
      throw new AppError('This appointment is not awaiting payment', 400);
    }

    const amount = appointment.paymentAmount || await calculateSessionAmount(
      appointment.expertId._id || appointment.expertId,
      appointment.expertType,
      getDurationMinutes(appointment)
    );

    if (!appointment.paymentAmount) {
      appointment.paymentAmount = amount;
    }

    const sessionId = `dummy_stripe_${appointment._id}_${Date.now()}`;
    appointment.stripeSessionId = sessionId;
    await appointment.save();

    const expert = appointment.expertId;
    const expertName = expert
      ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
      : 'Expert';

    res.status(200).json({
      success: true,
      message: 'Checkout session created',
      data: {
        sessionId,
        amount,
        currency: 'usd',
        provider: 'stripe',
        description: `FitOrbit session with ${expertName}`,
        checkoutUrl: `/client/appointments?pay=${appointment._id}`,
        appointment: formatAppointment(appointment),
      },
    });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { appointmentId, sessionId } = req.body;
    if (!appointmentId) throw new AppError('Appointment ID is required', 400);

    const appointment = await Appointment.findById(appointmentId)
      .populate('expertId', 'firstName lastName role')
      .populate('clientId', 'firstName lastName');

    if (!appointment) throw new AppError('Appointment not found', 404);
    if (String(appointment.clientId._id || appointment.clientId) !== String(req.user.id)) {
      throw new AppError('Only the client can confirm payment', 403);
    }
    if (appointment.status !== APPOINTMENT_STATUS.AWAITING_PAYMENT) {
      throw new AppError('This appointment is not awaiting payment', 400);
    }

    if (sessionId && appointment.stripeSessionId && sessionId !== appointment.stripeSessionId) {
      throw new AppError('Invalid payment session', 400);
    }

    const conflicts = await Appointment.find({
      expertId: appointment.expertId,
      _id: { $ne: appointment._id },
      status: { $in: BLOCKING_STATUSES.filter((s) => s !== APPOINTMENT_STATUS.AWAITING_PAYMENT) },
    });

    const validation = validateBookingRequest(
      appointment.appointmentDate,
      getDurationMinutes(appointment),
      conflicts
    );
    if (!validation.valid) {
      appointment.status = APPOINTMENT_STATUS.CANCELLED;
      appointment.cancellationReason = validation.reason;
      appointment.paymentStatus = PAYMENT_STATUS.FAILED;
      await appointment.save();
      throw new AppError(validation.reason, 409);
    }

    appointment.status = APPOINTMENT_STATUS.SCHEDULED;
    appointment.paymentStatus = PAYMENT_STATUS.COMPLETED;
    await appointment.save();

    const client = appointment.clientId;
    const expert = appointment.expertId;
    const clientName = client
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : 'Client';
    const expertName = expert
      ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
      : 'Expert';
    const when = formatDateTime(appointment.appointmentDate);

    await createAndPushNotification(req, {
      userId: appointment.expertId._id || appointment.expertId,
      title: 'Appointment confirmed',
      message: `${clientName} paid and confirmed the session on ${when}`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: expert?.role === 'nutritionist' ? '/nutritionist/schedule' : '/trainer/schedule',
    });

    await createAndPushNotification(req, {
      userId: appointment.clientId._id || appointment.clientId,
      title: 'Payment successful',
      message: `Your session with ${expertName} on ${when} is confirmed.`,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      relatedEntityId: appointment._id,
      relatedEntityType: 'appointment',
      actionUrl: '/client/appointments',
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed. Appointment is scheduled.',
      data: { appointment: formatAppointment(appointment) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
  confirmPayment,
};
