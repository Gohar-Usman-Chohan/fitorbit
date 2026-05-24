/**
 * ============================================
 * VALIDATION MIDDLEWARE
 * ============================================
 * Input validation and sanitization
 */

const { body, validationResult, query } = require('express-validator');

/**
 * Handle validation errors
 */
const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for authentication
 */
const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const lastName = value || req.body.firstName;
      if (!lastName || lastName.length < 1) {
        throw new Error('Last name is required');
      }
      return true;
    }),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['client', 'trainer', 'nutritionist'])
    .withMessage('Invalid role'),
  validationErrorHandler
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validationErrorHandler
];

/**
 * Validation rules for password reset
 */
const validatePasswordReset = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  validationErrorHandler
];

/**
 * Validation rules for new password
 */
const validateNewPassword = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  validationErrorHandler
];

/**
 * Validation for update profile
 */
const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  validationErrorHandler
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validationErrorHandler
];

module.exports = {
  validationErrorHandler,
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateUpdateProfile,
  validatePagination
};
