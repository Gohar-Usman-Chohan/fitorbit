/**
 * ============================================
 * AUTHENTICATION ROUTES
 * ============================================
 * Routes for user authentication
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validateNewPassword
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes
router.post('/register', validateRegister, asyncHandler(authController.register));
router.post('/login', validateLogin, asyncHandler(authController.login));
router.post('/forgot-password', validatePasswordReset, asyncHandler(authController.forgotPassword));
router.post('/reset-password/:token', validateNewPassword, asyncHandler(authController.resetPassword));
router.get('/verify-email/:token', asyncHandler(authController.verifyEmail));
router.post('/resend-verification', asyncHandler(authController.resendVerificationEmail));
router.get('/stats', asyncHandler(authController.getPlatformStats));

// Protected routes
router.post('/logout', verifyToken, asyncHandler(authController.logout));
router.post('/refresh-token', asyncHandler(authController.refreshToken));

module.exports = router;
