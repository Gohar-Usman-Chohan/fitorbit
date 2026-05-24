/**
 * ============================================
 * NOTIFICATION ROUTES
 * ============================================
 * Routes for notification management
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(verifyToken);

router.get('/', asyncHandler(notificationController.getNotifications));
router.get('/unread', asyncHandler(notificationController.getUnreadCount));
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));

// Static paths must come before /:id routes
router.put('/read-all', asyncHandler(notificationController.markAllAsRead));
router.post('/mark-all-read', asyncHandler(notificationController.markAllAsRead));
router.delete('/delete-all', asyncHandler(notificationController.deleteAllNotifications));
router.delete('/', asyncHandler(notificationController.deleteAllNotifications));

router.put('/:id/read', asyncHandler(notificationController.markAsRead));
router.delete('/:id', asyncHandler(notificationController.deleteNotification));

module.exports = router;
