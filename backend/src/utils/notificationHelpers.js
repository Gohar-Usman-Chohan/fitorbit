const User = require('../models/User');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { MESSAGE_STATUS, NOTIFICATION_TYPES } = require('../config/constants');

const CHAT_URL_BY_ROLE = {
  client: '/client/chat',
  trainer: '/trainer/chat',
  nutritionist: '/nutritionist/chat',
  admin: '/admin/approvals',
};

const getChatUrlForRole = (role) => CHAT_URL_BY_ROLE[role] || '/client/chat';

const getUnreadCounts = async (userId) => {
  const [chatUnread, notificationUnread] = await Promise.all([
    Chat.countDocuments({
      receiverId: userId,
      status: { $ne: MESSAGE_STATUS.READ },
    }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { chatUnread, notificationUnread };
};

const resolveApp = (reqOrApp) => {
  if (reqOrApp?.app?.locals) return reqOrApp.app;
  if (reqOrApp?.locals) return reqOrApp;
  return null;
};

const pushInAppNotification = async (reqOrApp, userId, notification) => {
  const app = resolveApp(reqOrApp);
  const io = app?.locals?.io;
  const activeUsers = app?.locals?.activeUsers;
  if (!io) return;

  const counts = await getUnreadCounts(userId);
  const payload = {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    actionUrl: notification.actionUrl,
    conversationId: notification.conversationId,
    createdAt: notification.createdAt,
  };

  const socketId = activeUsers?.get(String(userId));
  if (socketId) {
    io.to(socketId).emit('notification', payload);
    io.to(socketId).emit('unread_counts_updated', counts);
  }
};

const createAndPushNotification = async (reqOrApp, {
  userId,
  title,
  message,
  type = NOTIFICATION_TYPES.SYSTEM_ALERT,
  relatedEntityId,
  relatedEntityType,
  actionUrl,
  conversationId,
  priority = 'medium',
}) => {
  const notification = new Notification({
    userId,
    title,
    message,
    type,
    relatedEntityId,
    relatedEntityType,
    actionUrl,
    conversationId,
    priority,
  });

  await notification.save();
  await pushInAppNotification(reqOrApp, userId, notification);
  return notification;
};

module.exports = {
  getChatUrlForRole,
  getUnreadCounts,
  pushInAppNotification,
  createAndPushNotification,
};
