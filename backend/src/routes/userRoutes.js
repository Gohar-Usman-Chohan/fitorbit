/**
 * ============================================
 * USER ROUTES
 * ============================================
 * Routes for user profile management
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const clientController = require('../controllers/clientController');
const { verifyToken } = require('../middleware/auth');
const { validateUpdateProfile, validatePagination } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Protected routes - require authentication
router.use(verifyToken);

// Profile management
router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', validateUpdateProfile, asyncHandler(userController.updateProfile));

// Fitness goals aliases (frontend legacy paths)
router.get('/goals', asyncHandler(clientController.getGoals));
router.put('/goals', asyncHandler(clientController.createGoal));

// Avatar upload
router.post('/avatar', asyncHandler(userController.uploadAvatar));

// Settings
router.get('/settings', asyncHandler(userController.getSettings));
router.put('/settings', asyncHandler(userController.updateSettings));

// Preferences
router.get('/preferences', asyncHandler(userController.getPreferences));
router.put('/preferences', asyncHandler(userController.updatePreferences));

router.get('/:id', asyncHandler(userController.getUserById));

module.exports = router;
