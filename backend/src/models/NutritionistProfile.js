/**
 * ============================================
 * NUTRITIONIST PROFILE MODEL
 * ============================================
 * Professional profile for nutritionist users
 * Displays qualifications, specializations, services
 */

const mongoose = require('mongoose');

// TODO: Implement NutritionistProfile schema with:
// 1. Reference to User model (nutritionist)
// 2. Professional bio/about
// 3. Certifications (RDN, CSSD, LDN, etc.)
// 4. Experience years (numeric)
// 5. Specializations (weight management, sports nutrition, clinical, etc.)
// 6. Services offered (meal planning, consultations, etc.)
// 7. Consultation fee / Pricing packages
// 8. Availability/Schedule
// 9. Working location(s)
// 10. Client testimonials/reviews
// 11. Ratings (average from clients)
// 12. Number of clients served
// 13. Dietary approaches (keto, vegan, balanced, etc.)
// 14. Qualifications/Education background
// 15. Verification status
// 16. Payment/Bank details
// 17. Specialization areas (allergies, diabetes, etc.)

const nutritionistProfileSchema = new mongoose.Schema({
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
    enum: ['weight_management', 'sports_nutrition', 'clinical', 'pediatric', 'elderly_care', 'disease_management']
  }],
  servicesOffered: [String],
  consultationFee: {
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
  workingLocations: [String],
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
  clientsServed: {
    type: Number,
    default: 0
  },
  dietaryApproaches: [{
    type: String,
    enum: ['keto', 'vegan', 'vegetarian', 'balanced', 'low_carb', 'high_protein', 'intermittent_fasting']
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
  specializationAreas: [{
    type: String,
    enum: ['allergies', 'diabetes', 'hypertension', 'heart_disease', 'cancer', 'digestive_disorders', 'eating_disorders']
  }]
}, {
  timestamps: true
});

// Indexes for search/filtering
nutritionistProfileSchema.index({ userId: 1 });
nutritionistProfileSchema.index({ specializations: 1 });
nutritionistProfileSchema.index({ averageRating: -1 });
nutritionistProfileSchema.index({ yearsOfExperience: -1 });

module.exports = mongoose.model('NutritionistProfile', nutritionistProfileSchema);
