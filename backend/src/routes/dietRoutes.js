/**
 * ============================================
 * DIET ROUTES
 * ============================================
 * Routes for diet management
 */

const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes (with optional auth) — specific paths before /:id
router.get('/search', optionalAuth, asyncHandler(dietController.searchDiets));
router.get('/category/:category', optionalAuth, asyncHandler(dietController.getDietsByCategory));
router.get('/', optionalAuth, asyncHandler(dietController.getDiets));
router.get('/:id', optionalAuth, asyncHandler(dietController.getDietById));

// Protected routes
router.post('/', verifyToken, asyncHandler(dietController.createDiet));
router.put('/:id', verifyToken, asyncHandler(dietController.updateDiet));
router.delete('/:id', verifyToken, asyncHandler(dietController.deleteDiet));

module.exports = router;
