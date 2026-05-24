/**
 * ============================================
 * APPOINTMENT MODEL
 * ============================================
 * Manages booking and scheduling of sessions with trainers/nutritionists
 */

const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, PAYMENT_STATUS } = require('../config/constants');

// TODO: Implement Appointment schema with:
// 1. Reference to Client
// 2. Reference to Expert (Trainer or Nutritionist)
// 3. Expert type (trainer/nutritionist)
// 4. Appointment date and time
// 5. Duration (minutes)
// 6. Status (scheduled, completed, cancelled, no-show, rescheduled)
// 7. Session type (online/in-person)
// 8. Meeting link (for online sessions)
// 9. Location (for in-person sessions)
// 10. Topic/Focus (what will be discussed)
// 11. Notes from client (goals for session)
// 12. Notes from expert (after session)
// 13. Feedback from client (after session)
// 14. Rating (1-5 stars)
// 15. Cancellation reason
// 16. Payment status
// 17. Payment amount
// 18. Reminder sent (true/false)
// 19. Reminder time
// 20. Files/documents attached

const appointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertType: {
    type: String,
    enum: ['trainer', 'nutritionist'],
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  durationUnit: {
    type: String,
    enum: ['minutes', 'hours'],
    default: 'minutes'
  },
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.SCHEDULED
  },
  sessionType: {
    type: String,
    enum: ['online', 'in_person'],
    required: true
  },
  meetingLink: String,
  location: String,
  topic: String,
  clientNotes: String,
  expertNotes: String,
  clientFeedback: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  cancellationReason: String,
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentAmount: Number,
  stripeSessionId: String,
  rejectionReason: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderTime: Date,
  completedAt: Date,
  autoCompleted: {
    type: Boolean,
    default: false,
  },
  ratingReminderSent: {
    type: Boolean,
    default: false,
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  rescheduledFrom: mongoose.Schema.Types.ObjectId
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ clientId: 1 });
appointmentSchema.index({ expertId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
