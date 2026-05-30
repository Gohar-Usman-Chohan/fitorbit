/**
 * ============================================
 * ENVIRONMENT CONFIGURATION
 * ============================================
 * Load and validate environment variables
 */

require('dotenv').config();

const env = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/fitorbit',

  // Frontend / CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',

  // Email Service
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@fitorbit.com',

  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',

  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5242880, // 5MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  // Payment (Stripe/PayPal)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
};

// TODO: Validate required environment variables
// TODO: Add validation logic to check critical vars

module.exports = env;
