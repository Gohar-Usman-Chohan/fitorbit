/**
 * ============================================
 * PROGRESS ROUTES
 * ============================================
 * Routes for progress tracking
 */

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(verifyToken);

router.get('/statistics', asyncHandler(progressController.getProgressStats));
router.get('/', asyncHandler(progressController.getProgress));
router.post('/', asyncHandler(progressController.createProgress));
router.get('/:id/stats', asyncHandler(progressController.getProgressStats));
router.get('/:id', asyncHandler(progressController.getProgressById));
router.put('/:id', asyncHandler(progressController.updateProgress));
router.delete('/:id', asyncHandler(progressController.deleteProgress));

module.exports = router;
