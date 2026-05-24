/**
 * ============================================
 * NOTIFICATION MODEL
 * ============================================
 * Stores notifications for users
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

// TODO: Implement Notification schema with:
// 1. Reference to User (recipient)
// 2. Title
// 3. Message/Description
// 4. Type (message, appointment, progress_update, plan_assigned, achievement, system_alert)
// 5. Related entity reference (appointment ID, plan ID, etc.)
// 6. Related entity type
// 7. Is read (boolean)
// 8. Read timestamp
// 9. Priority (low, medium, high, urgent)
// 10. Action URL (link to navigate when clicked)
// 11. Image/Icon URL
// 12. Sent timestamp
// 13. Expiry date (when to remove)
// 14. Notification channel (in-app, email, SMS)
// 15. Email sent status
// 16. SMS sent status

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    default: NOTIFICATION_TYPES.SYSTEM_ALERT
  },
  relatedEntityId: mongoose.Schema.Types.ObjectId,
  relatedEntityType: {
    type: String,
    enum: ['appointment', 'plan', 'message', 'progress_update', 'user']
  },
  conversationId: mongoose.Schema.Types.ObjectId,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: String,
  imageUrl: String,
  iconUrl: String,
  sentAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  notificationChannels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  smsSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
