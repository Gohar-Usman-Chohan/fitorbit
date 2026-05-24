/**
 * ============================================
 * CLIENT ROUTES
 * ============================================
 * Routes for client-specific operations
 */

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// All routes require authentication and client role
router.use(verifyToken);
router.use(authorizeRole('client'));

// Dashboard and overview
router.get('/dashboard', asyncHandler(clientController.getDashboard));

// Goals management
router.get('/goals', asyncHandler(clientController.getGoals));
router.post('/goals', asyncHandler(clientController.createGoal));
router.put('/goals/:goalId', asyncHandler(clientController.updateGoal));
router.delete('/goals/:goalId', asyncHandler(clientController.deleteGoal));

// Frontend-compatible aliases
router.get('/fitness-goals', asyncHandler(clientController.getGoals));
router.post('/fitness-goals', asyncHandler(clientController.createGoal));
router.put('/fitness-goals/:goalId', asyncHandler(clientController.updateGoal));
router.delete('/fitness-goals/:goalId', asyncHandler(clientController.deleteGoal));

// Plans
router.get('/plans', asyncHandler(clientController.getPlans));
router.get('/assigned-plans', asyncHandler(clientController.getPlans));
router.get('/active-plans', asyncHandler(clientController.getPlans));
router.get('/plans/:planId', asyncHandler(clientController.getPlanDetails));

// Progress tracking
router.get('/progress', asyncHandler(clientController.getProgress));
router.get('/progress-summary', asyncHandler(clientController.getProgress));
router.get('/recent-progress', asyncHandler(clientController.getProgress));
router.post('/progress', asyncHandler(clientController.addProgress));

// Assigned experts
router.get('/experts', asyncHandler(clientController.getAssignedExperts));
router.get('/experts/:expertId', asyncHandler(clientController.getExpertDetails));

// Browse and book experts
router.get('/available-trainers', asyncHandler(clientController.getAvailableTrainers));
router.get('/available-nutritionists', asyncHandler(clientController.getAvailableNutritionists));
router.post('/book-trainer/:trainerId', asyncHandler(clientController.assignTrainer));
router.post('/book-nutritionist/:nutritionistId', asyncHandler(clientController.assignNutritionist));

module.exports = router;
