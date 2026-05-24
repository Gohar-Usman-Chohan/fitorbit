/**
 * ============================================
 * NUTRITIONIST ROUTES
 * ============================================
 * Routes for nutritionist-specific operations
 */

const express = require('express');
const router = express.Router();
const nutritionistController = require('../controllers/nutritionistController');
const userController = require('../controllers/userController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { validateUpdateProfile } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes (no authentication required)
router.get('/all', asyncHandler(nutritionistController.getAllNutritionists));

// All routes below require authentication and nutritionist role
router.use(verifyToken);
router.use(authorizeRole('nutritionist'));

router.get('/dashboard', asyncHandler(nutritionistController.getDashboard));

router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', validateUpdateProfile, asyncHandler(userController.updateProfile));

router.get('/clients', asyncHandler(nutritionistController.getClients));
router.get('/clients/:clientId/assessment', asyncHandler(nutritionistController.getAssessments));
router.get('/clients/:clientId/progress', asyncHandler(nutritionistController.getClientProgress));
router.post('/clients/:clientId/feedback', asyncHandler(nutritionistController.provideClientFeedback));
router.get('/meal-plans', asyncHandler(nutritionistController.getMealPlans));
router.post('/meal-plans', asyncHandler(nutritionistController.createMealPlan));
router.put('/meal-plans/:planId', asyncHandler(nutritionistController.updateMealPlan));
router.delete('/meal-plans/:planId', asyncHandler(nutritionistController.deleteMealPlan));
router.get('/assessments', asyncHandler(nutritionistController.getAssessments));
router.put('/assessments/:assessmentId', asyncHandler(nutritionistController.updateAssessment));
router.get('/schedule', asyncHandler(nutritionistController.getSchedule));
router.get('/availability', asyncHandler(nutritionistController.getAvailability));
router.get('/availability-slots', asyncHandler(nutritionistController.getAvailability));
router.put('/availability', asyncHandler(nutritionistController.updateAvailability));

module.exports = router;
