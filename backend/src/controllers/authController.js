/**
 * ============================================
 * AUTHENTICATION CONTROLLER
 * ============================================
 * Handles user authentication and authorization
 */

const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const TrainerProfile = require('../models/TrainerProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const emailService = require('../services/emailService');
const env = require('../config/environment');
const { generateToken, hashToken, extractUserInfo } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { ACCOUNT_STATUS } = require('../config/constants');
const jwt = require('jsonwebtoken');

const assertCanLogin = (user) => {
  if (!user.isEmailVerified) {
    throw new AppError(
      'Please verify your email before signing in. Check your inbox for the verification link.',
      403
    );
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new AppError('Your account has been suspended. Please contact support.', 403);
  }

  if (user.accountStatus === ACCOUNT_STATUS.PENDING_APPROVAL) {
    throw new AppError(
      'Your expert account is pending admin approval. You can sign in after approval.',
      403
    );
  }

  if (user.accountStatus === ACCOUNT_STATUS.INACTIVE) {
    throw new AppError(
      'Your account is inactive. Please verify your email to activate it.',
      403
    );
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Your account is not active. Please contact support.', 403);
  }
};

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const userRole = role || 'client';

    // All new accounts start inactive until email is verified.
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: userRole,
      accountStatus: ACCOUNT_STATUS.INACTIVE,
      isEmailVerified: false,
    });

    // Create role-specific profile
    if (userRole === 'client') {
      await ClientProfile.create({ userId: user._id });
    } else if (userRole === 'trainer') {
      await TrainerProfile.create({
        userId: user._id,
        bio: `${firstName} ${lastName} - Personal Trainer`,
        yearsOfExperience: 0,
        hourlyRate: 0
      });
    } else if (userRole === 'nutritionist') {
      await NutritionistProfile.create({
        userId: user._id,
        bio: `${firstName} ${lastName} - Nutritionist`,
        yearsOfExperience: 0,
        consultationFee: 0
      });
    }

    // Generate email verification token
    const verificationToken = generateToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    // Send welcome email
    await emailService.sendWelcomeEmail(user.firstName, user.email);

    res.status(201).json({
      success: true,
      message:
        'Registration successful. Please check your email and verify your account before signing in.',
      data: {
        user: extractUserInfo(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and select password
    const user = await User.findByEmail(email).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    assertCanLogin(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Ensure client profile exists for existing accounts
    if (user.role === 'client') {
      const existingProfile = await ClientProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await ClientProfile.create({ userId: user._id });
      }
    }

    // Generate tokens
    const authToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: extractUserInfo(user),
        token: authToken,
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.accountStatus !== 'active') {
      throw new AppError(
        user.accountStatus === 'suspended'
          ? 'Your account has been suspended. Please contact support.'
          : 'Your account is not active. Please contact support.',
        403
      );
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        'Please verify your email before signing in. Check your inbox for the verification link.',
        403
      );
    }

    // Generate new tokens
    const newAuthToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        token: newAuthToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      throw new AppError('Reset token is required', 400);
    }

    // Hash the token to compare
    const hashedToken = hashToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    // Hash the token to compare
    const hashedToken = hashToken(token);

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Mark email as verified and activate based on role
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;

    if (user.role === 'client') {
      user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    } else if (user.role === 'trainer' || user.role === 'nutritionist') {
      user.accountStatus = ACCOUNT_STATUS.PENDING_APPROVAL;
    }

    await user.save();

    const responseData = {
      user: extractUserInfo(user),
    };

    let message = 'Email verified successfully! You can now sign in.';

    if (user.role === 'client') {
      responseData.token = user.generateAuthToken();
      responseData.refreshToken = user.generateRefreshToken();
      message = 'Email verified successfully! Welcome to FitOrbit.';
    } else if (user.role === 'trainer' || user.role === 'nutritionist') {
      message =
        'Email verified! Your expert account is pending admin approval. You can sign in after approval.';
    }

    res.status(200).json({
      success: true,
      message,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Generate new verification token
    const verificationToken = generateToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public platform statistics
 */
const getPlatformStats = async (req, res, next) => {
  try {
    // Count total active users
    const totalUsers = await User.countDocuments({ accountStatus: 'active' });
    const totalClients = await User.countDocuments({ 
      role: 'client',
      accountStatus: 'active'
    });
    const totalTrainers = await User.countDocuments({ 
      role: 'trainer',
      accountStatus: 'active'
    });
    const totalNutritionists = await User.countDocuments({ 
      role: 'nutritionist',
      accountStatus: 'active'
    });

    // Calculate average rating (if there's a rating system)
    // For now, returning a static value
    const avgRating = 4.8;

    res.status(200).json({
      success: true,
      message: 'Platform statistics retrieved',
      data: {
        totalUsers,
        totalClients,
        totalTrainers,
        totalNutritionists,
        avgRating
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getPlatformStats
};

