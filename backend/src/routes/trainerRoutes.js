/**
 * ============================================
 * TRAINER ROUTES
 * ============================================
 * Routes for trainer-specific operations
 */

const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const userController = require('../controllers/userController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { validateUpdateProfile } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes (no authentication required)
router.get('/all', asyncHandler(trainerController.getAllTrainers));

// All routes below require authentication and trainer role
router.use(verifyToken);
router.use(authorizeRole('trainer'));

// Dashboard
router.get('/dashboard', asyncHandler(trainerController.getDashboard));

// Profile (uses shared user profile endpoints)
router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', validateUpdateProfile, asyncHandler(userController.updateProfile));

// Clients management
router.get('/clients', asyncHandler(trainerController.getClients));
router.get('/clients/:clientId', asyncHandler(trainerController.getClientDetails));

// Workout plans
router.get('/workouts', asyncHandler(trainerController.getWorkouts));
router.post('/workouts', asyncHandler(trainerController.createWorkout));
router.put('/workouts/:workoutId', asyncHandler(trainerController.updateWorkout));
router.delete('/workouts/:workoutId', asyncHandler(trainerController.deleteWorkout));
router.get('/workouts/:workoutId/details', asyncHandler(trainerController.getWorkoutDetails));

// Schedule and availability
router.get('/schedule', asyncHandler(trainerController.getSchedule));
router.get('/availability', asyncHandler(trainerController.getAvailability));
router.get('/availability-slots', asyncHandler(trainerController.getAvailability));
router.put('/availability', asyncHandler(trainerController.updateAvailability));

// Client progress
router.get('/clients/:clientId/progress', asyncHandler(trainerController.getClientProgress));

module.exports = router;
