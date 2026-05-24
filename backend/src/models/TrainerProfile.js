/**
 * ============================================
 * TRAINER PROFILE MODEL
 * ============================================
 * Professional profile for trainer users
 * Displays qualifications, certifications, services
 */

const mongoose = require('mongoose');
const { FITNESS_GOALS } = require('../config/constants');

// TODO: Implement TrainerProfile schema with:
// 1. Reference to User model (trainer)
// 2. Professional bio/about
// 3. Certifications (array - ACE, NASM, etc.)
// 4. Experience years (numeric)
// 5. Specializations (array - weight loss, strength, etc.)
// 6. Services offered (array)
// 7. Hourly rate / Pricing packages
// 8. Availability/Schedule
// 9. Location/Service area
// 10. Client testimonials/reviews (array)
// 11. Ratings (average rating from clients)
// 12. Number of clients trained
// 13. Success stories/case studies
// 14. Education/Qualifications
// 15. Verification status
// 16. Bank/Payment details (for transactions)
// 17. Working hours

const trainerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    required: true
  },
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialUrl: String
  }],
  yearsOfExperience: {
    type: Number,
    required: true
  },
  specializations: [{
    type: String,
    enum: Object.values(FITNESS_GOALS)
  }],
  servicesOffered: [String],
  hourlyRate: {
    type: Number,
    required: true
  },
  pricingPackages: [{
    name: String,
    sessions: Number,
    price: Number,
    discount: Number
  }],
  availability: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  location: String,
  serviceArea: [String],
  testimonials: [{
    clientId: mongoose.Schema.Types.ObjectId,
    content: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    date: Date
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  clientsTrained: {
    type: Number,
    default: 0
  },
  successStories: [{
    title: String,
    description: String,
    beforeImage: String,
    afterImage: String,
    results: String
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    graduationYear: Number
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String
  },
  workingHours: {
    startTime: String,
    endTime: String,
    daysPerWeek: Number
  }
}, {
  timestamps: true
});

// Indexes for search/filter
trainerProfileSchema.index({ userId: 1 });
trainerProfileSchema.index({ specializations: 1 });
trainerProfileSchema.index({ averageRating: -1 });
trainerProfileSchema.index({ yearsOfExperience: -1 });

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema);
