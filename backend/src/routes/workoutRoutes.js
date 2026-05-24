/**
 * ============================================
 * WORKOUT ROUTES
 * ============================================
 * Routes for workout management
 */

const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes (with optional auth) — specific paths before /:id
router.get('/search', optionalAuth, asyncHandler(workoutController.getWorkouts));
router.get('/category/:category', optionalAuth, asyncHandler(workoutController.getWorkoutsByCategory));
router.get('/difficulty/:level', optionalAuth, asyncHandler(workoutController.getWorkoutsByDifficulty));
router.get('/', optionalAuth, asyncHandler(workoutController.getWorkouts));
router.get('/:id', optionalAuth, asyncHandler(workoutController.getWorkoutById));

// Protected routes
router.post('/', verifyToken, asyncHandler(workoutController.createWorkout));
router.put('/:id', verifyToken, asyncHandler(workoutController.updateWorkout));
router.delete('/:id', verifyToken, asyncHandler(workoutController.deleteWorkout));

module.exports = router;
