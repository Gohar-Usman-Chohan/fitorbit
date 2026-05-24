/**
 * ============================================
 * CHAT CONTROLLER
 * ============================================
 * Handles real-time messaging between users
 */

const Chat = require('../models/Chat');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');
const { MESSAGE_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const {
  getChatUrlForRole,
  getUnreadCounts,
  createAndPushNotification,
} = require('../utils/notificationHelpers');

const markConversationNotificationsRead = async (userId, conversationId) => {
  if (!conversationId) return;

  await Notification.updateMany(
    {
      userId,
      type: NOTIFICATION_TYPES.MESSAGE,
      conversationId,
      isRead: false,
    },
    { isRead: true, readAt: new Date() }
  );
};

/**
 * Send message
 */
const sendMessage = async (req, res, next) => {
  try {
    let { conversationId, receiverId, messageContent, messageType = 'text' } = req.body;
    messageContent = messageContent || req.body.content;
    const senderId = req.user.id;

    if (!receiverId || !messageContent) {
      throw new AppError('Missing required fields: receiverId and message content', 400);
    }

    if (!conversationId) {
      const existing = await Chat.findOne({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }).sort({ createdAt: -1 });

      conversationId = existing?.conversationId || new mongoose.Types.ObjectId();
    }

    const message = new Chat({
      conversationId,
      senderId,
      receiverId,
      messageContent,
      messageType,
      status: MESSAGE_STATUS.SENT
    });

    await message.save();

    const io = req.app?.locals?.io;
    if (io) {
      io.to(`conversation_${message.conversationId}`).emit('receive_message', {
        _id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        messageContent: message.messageContent,
        messageType: message.messageType,
        createdAt: message.createdAt,
      });
    }

    const receiver = await User.findById(receiverId).select('role firstName');
    const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Someone';

    await createAndPushNotification(req, {
      userId: receiverId,
      title: 'New Message',
      message: `${senderName} sent you a message`,
      type: NOTIFICATION_TYPES.MESSAGE,
      relatedEntityId: message._id,
      relatedEntityType: 'message',
      conversationId: message.conversationId,
      actionUrl: getChatUrlForRole(receiver?.role),
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages in a conversation
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await Chat.find({ conversationId })
      .populate('senderId', 'firstName lastName profilePicture')
      .populate('receiverId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Chat.countDocuments({ conversationId });

    // Mark messages as read
    await Chat.updateMany(
      { conversationId, receiverId: req.user.id, status: { $ne: MESSAGE_STATUS.READ } },
      { status: MESSAGE_STATUS.READ, readAt: new Date() }
    );

    await markConversationNotificationsRead(req.user.id, conversationId);

    const io = req.app?.locals?.io;
    const activeUsers = req.app?.locals?.activeUsers;
    if (io && activeUsers) {
      const socketId = activeUsers.get(String(req.user.id));
      if (socketId) {
        const counts = await getUnreadCounts(req.user.id);
        io.to(socketId).emit('unread_counts_updated', counts);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages retrieved',
      data: {
        messages: messages.reverse(),
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
 * Edit message
 */
const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { messageContent } = req.body;

    const message = await Chat.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId.toString() !== req.user.id) {
      throw new AppError('Unauthorized to edit this message', 403);
    }

    message.messageContent = messageContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Chat.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId.toString() !== req.user.id) {
      throw new AppError('Unauthorized to delete this message', 403);
    }

    await Chat.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const paramId = req.params.messageId || req.params.id || req.params.conversationId;
    const conversationId = req.body?.conversationId || req.params.conversationId || paramId;

    const message = paramId ? await Chat.findById(paramId) : null;

    if (message) {
      await Chat.findByIdAndUpdate(message._id, {
        status: MESSAGE_STATUS.READ,
        readAt: new Date()
      });
    } else if (conversationId) {
      await Chat.updateMany(
        { conversationId, receiverId: req.user.id, status: { $ne: MESSAGE_STATUS.READ } },
        { status: MESSAGE_STATUS.READ, readAt: new Date() }
      );
      await markConversationNotificationsRead(req.user.id, conversationId);
    }

    const io = req.app?.locals?.io;
    const activeUsers = req.app?.locals?.activeUsers;
    if (io && activeUsers) {
      const socketId = activeUsers.get(String(req.user.id));
      if (socketId) {
        const counts = await getUnreadCounts(req.user.id);
        io.to(socketId).emit('unread_counts_updated', counts);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [{ senderId: new mongoose.Types.ObjectId(userId) }, { receiverId: new mongoose.Types.ObjectId(userId) }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$messageContent' },
          lastMessageTime: { $first: '$createdAt' },
          otherUserId: {
            $first: {
              $cond: [
                { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
                '$receiverId',
                '$senderId'
              ]
            }
          }
        }
      },
      { $sort: { lastMessageTime: -1 } }
    ]);

    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv.otherUserId).select('firstName lastName profilePicture role');
        const unreadCount = await Chat.countDocuments({
          conversationId: conv._id,
          receiverId: userId,
          status: { $ne: MESSAGE_STATUS.READ },
        });

        const displayName = otherUser
          ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim()
          : 'User';

        return {
          id: conv._id.toString(),
          conversationId: conv._id.toString(),
          expertName: displayName,
          clientName: displayName,
          otherUserId: conv.otherUserId,
          otherUser,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount,
        };
      })
    );

    const totalUnread = populatedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved',
      data: { conversations: populatedConversations, totalUnread }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add reaction to message
 */
const addReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;

    if (!reaction) {
      throw new AppError('Reaction is required', 400);
    }

    const message = await Chat.findByIdAndUpdate(
      messageId,
      { reaction },
      { new: true }
    );

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Reaction added successfully',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get total unread message count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const counts = await getUnreadCounts(userId);

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved',
      data: { count: counts.chatUnread, ...counts },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  markAsRead,
  getConversations,
  getUnreadCount,
  addReaction
};
