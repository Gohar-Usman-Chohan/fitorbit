/**
 * ============================================
 * APPOINTMENT ROUTES
 * ============================================
 * Routes for appointment management
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(verifyToken);

router.get('/history', asyncHandler(appointmentController.getAppointmentHistory));
router.get('/expert/:expertId/availability', asyncHandler(appointmentController.getAvailability));
router.get('/available-slots/:expertId', asyncHandler(appointmentController.getAvailability));
router.get('/', asyncHandler(appointmentController.listAppointments));
router.post('/', asyncHandler(appointmentController.createAppointment));
router.get('/:id', asyncHandler(appointmentController.getAppointment));
router.put('/:id', asyncHandler(appointmentController.updateAppointment));
router.delete('/:id', asyncHandler(appointmentController.cancelAppointment));
router.post('/:id/cancel', asyncHandler(appointmentController.cancelAppointment));
router.post('/:id/reschedule', asyncHandler(appointmentController.rescheduleAppointment));
router.post('/:id/approve', asyncHandler(appointmentController.approveAppointment));
router.post('/:id/reject', asyncHandler(appointmentController.rejectAppointment));
router.post('/:id/complete', asyncHandler(appointmentController.completeAppointment));
router.post('/:id/no-show', asyncHandler(appointmentController.markNoShow));
router.post('/:id/rate', asyncHandler(appointmentController.rateAppointment));

module.exports = router;
