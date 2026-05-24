/**
 * ============================================
 * CHAT/MESSAGE MODEL
 * ============================================
 * Stores real-time chat messages between clients and experts
 */

const mongoose = require('mongoose');
const { MESSAGE_STATUS } = require('../config/constants');

// TODO: Implement Chat schema with:
// 1. Unique conversation ID (or reference to Conversation model)
// 2. Sender reference (User ID)
// 3. Receiver reference (User ID)
// 4. Message content (text)
// 5. Message type (text, image, file, video)
// 6. File URL (if attached)
// 7. File name
// 8. Status (sent, delivered, read)
// 9. Read timestamp
// 10. Created timestamp
// 11. Edited timestamp
// 12. Is edited (boolean)
// 13. Reaction/Emoji (optional)
// 14. Reply to (reference to another message)
// 15. Attachments (array)
// 16. Mentions (tags for @username)

const chatSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageContent: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'video'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  status: {
    type: String,
    enum: Object.values(MESSAGE_STATUS),
    default: MESSAGE_STATUS.SENT
  },
  readAt: Date,
  editedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  reaction: String,
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String,
    fileSize: Number
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ conversationId: 1 });
chatSchema.index({ senderId: 1 });
chatSchema.index({ receiverId: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
