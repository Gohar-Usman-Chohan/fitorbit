/**
 * ============================================
 * CHAT ROUTES
 * ============================================
 * Routes for messaging
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(verifyToken);

router.post('/messages', asyncHandler(chatController.sendMessage));
router.get('/messages/:conversationId', asyncHandler(chatController.getMessages));
router.put('/messages/:messageId', asyncHandler(chatController.editMessage));
router.delete('/messages/:messageId', asyncHandler(chatController.deleteMessage));
router.put('/messages/:messageId/read', asyncHandler(chatController.markAsRead));
router.put('/conversations/:conversationId/read', asyncHandler(chatController.markAsRead));
router.get('/conversations', asyncHandler(chatController.getConversations));
router.get('/unread-count', asyncHandler(chatController.getUnreadCount));
router.post('/messages/:messageId/react', asyncHandler(chatController.addReaction));

module.exports = router;
