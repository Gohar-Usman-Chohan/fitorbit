/**
 * ============================================
 * UTILITY HELPERS
 * ============================================
 * Common utility functions
 */

const crypto = require('crypto');

/**
 * Generate random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token for storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Format response
 */
const formatResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data
  };
};

/**
 * Format error response
 */
const formatErrorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    ...(errors && { errors })
  };
};

/**
 * Pagination helper
 */
const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Calculate pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
};

/**
 * Extract user info for response
 */
const extractUserInfo = (user) => {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    bio: user.bio,
    phone: user.phone,
    gender: user.gender,
    accountStatus: user.accountStatus,
    isProfileComplete: user.isProfileComplete,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin,
    dateOfBirth: user.dateOfBirth
  };
};

/**
 * Calculate fitness metrics
 */
const calculateBMI = (weight, height) => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Parse sort parameter
 */
const parseSort = (sortParam) => {
  if (!sortParam) return {};
  
  const sortObj = {};
  sortParam.split(',').forEach(field => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });
  return sortObj;
};

/**
 * Sanitize object (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  const sanitized = user.toObject ? user.toObject() : { ...user };
  delete sanitized.password;
  delete sanitized.passwordResetToken;
  delete sanitized.passwordResetExpire;
  delete sanitized.emailVerificationToken;
  delete sanitized.emailVerificationExpire;
  return sanitized;
};

module.exports = {
  generateToken,
  hashToken,
  formatResponse,
  formatErrorResponse,
  getPagination,
  getPaginationMeta,
  extractUserInfo,
  calculateBMI,
  isValidEmail,
  parseSort,
  sanitizeUser
};
