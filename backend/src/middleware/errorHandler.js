/**
 * ============================================
 * ERROR HANDLER MIDDLEWARE
 * ============================================
 * Centralized error handling
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    err = new AppError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    err = new AppError(`${field} already exists`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    err = new AppError('Token expired', 401);
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    err = new AppError('Invalid ID format', 400);
  }

  const response = {
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(err.statusCode).json(response);
};

/**
 * Wrapper for async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError
};
