/**
 * ============================================
 * USER MODEL
 * ============================================
 * Base user schema for all user types
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { USER_ROLES, ACCOUNT_STATUS } = require('../config/constants');
const env = require('../config/environment');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },

  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio must not exceed 500 characters'],
    default: ''
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },

  // Role and Status
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true,
    default: USER_ROLES.CLIENT
  },
  accountStatus: {
    type: String,
    enum: Object.values(ACCOUNT_STATUS),
    default: ACCOUNT_STATUS.ACTIVE
  },

  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,

  // Authentication
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,

  // Additional
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    privateProfile: { type: Boolean, default: false }
  },

}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ createdAt: -1 });

// ============================================
// HOOKS
// ============================================

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// METHODS
// ============================================

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      name: `${this.firstName} ${this.lastName}`.trim()
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRE }
  );
};

// Get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    profilePicture: this.profilePicture,
    bio: this.bio,
    gender: this.gender,
    role: this.role,
    createdAt: this.createdAt
  };
};

// ============================================
// STATICS
// ============================================

// Find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
