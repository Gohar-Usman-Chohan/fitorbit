/**
 * ============================================
 * NOTIFICATION CONTROLLER
 * ============================================
 * Handles notifications management
 */

const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { getUnreadCounts } = require('../utils/notificationHelpers');
const { processDueReminders } = require('../services/appointmentReminderScheduler');
const { processDueCompletions } = require('../services/appointmentCompletionScheduler');

const emitUnreadCounts = async (req, userId) => {
  const io = req.app?.locals?.io;
  const activeUsers = req.app?.locals?.activeUsers;
  if (!io || !activeUsers) return;

  const socketId = activeUsers.get(String(userId));
  if (!socketId) return;

  const counts = await getUnreadCounts(userId);
  io.to(socketId).emit('unread_counts_updated', counts);
};

/**
 * Get notifications for user
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0, isRead } = req.query;

    const query = { userId };
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);

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
      message: 'Notifications retrieved',
      data: {
        notifications,
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
 * Get unread notification count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved',
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id || req.params.notificationId;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await emitUnreadCounts(req, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    await emitUnreadCounts(req, userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notificationId = req.params.id || req.params.notificationId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user.id,
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await emitUnreadCounts(req, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 */
const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ userId });

    await emitUnreadCounts(req, userId);

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};
