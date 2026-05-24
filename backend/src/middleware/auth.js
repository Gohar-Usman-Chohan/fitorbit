/**
 * ============================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================
 * Verifies JWT tokens and extracts user info
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/environment');

/**
 * Verify JWT token and extract user
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
      });
    }

    if (user.accountStatus !== 'active') {
      const isSuspended = user.accountStatus === 'suspended';
      const isPendingApproval = user.accountStatus === 'pending_approval';
      const isInactive = user.accountStatus === 'inactive';

      return res.status(403).json({
        error: true,
        code: 'account_inactive',
        message: isSuspended
          ? 'Your account has been suspended. Please contact support.'
          : isPendingApproval
            ? 'Your expert account is pending admin approval.'
            : isInactive
              ? 'Please verify your email to activate your account.'
              : 'Your account is not active. Please contact support.',
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: true,
        code: 'email_not_verified',
        message: 'Please verify your email before accessing the app.',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expired'
      });
    }
    
    res.status(401).json({
      error: true,
      message: 'Invalid token'
    });
  }
};

/**
 * Check if user has specific role
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      req.user = user;
    }
  } catch (error) {
    // Silently fail - user is optional
  }
  
  next();
};

module.exports = {
  verifyToken,
  authorizeRole,
  optionalAuth
};
