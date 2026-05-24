/**
 * ============================================
 * EXPRESS APP CONFIGURATION
 * ============================================
 * Main Express app setup with middleware
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config();

const connectDB = require('./config/database');
const env = require('./config/environment');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const nutritionistRoutes = require('./routes/nutritionistRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');
const progressRoutes = require('./routes/progressRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { validationErrorHandler } = require('./middleware/validation');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// DATABASE CONNECTION
// ============================================
connectDB();

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);           // Authentication routes
app.use('/api/users', userRoutes);          // User management routes
app.use('/api/clients', clientRoutes);      // Client-specific routes
app.use('/api/trainers', trainerRoutes);    // Trainer-specific routes
app.use('/api/nutritionists', nutritionistRoutes); // Nutritionist routes
app.use('/api/workouts', workoutRoutes);    // Workout plan routes
app.use('/api/diets', dietRoutes);          // Diet plan routes
app.use('/api/progress', progressRoutes);   // Progress tracking routes
app.use('/api/appointments', appointmentRoutes); // Appointment routes
app.use('/api/payments', paymentRoutes); // Payment routes
app.use('/api/chat', chatRoutes);           // Chat/Messaging routes
app.use('/api/notifications', notificationRoutes); // Notification routes
app.use('/api/admin', adminRoutes);         // Admin management routes

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'FitOrbit Backend is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    apiVersion: env.API_BASE_URL
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use(errorHandler);

module.exports = app;
