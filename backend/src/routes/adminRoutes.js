/**
 * ============================================
 * ADMIN ROUTES
 * ============================================
 * Expert approval workflow only
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(verifyToken);
router.use(authorizeRole('admin'));

router.get('/users', asyncHandler(adminController.listUsers));
router.post('/users/:id/approve', asyncHandler(adminController.approveExpert));
router.post('/users/:id/reject', asyncHandler(adminController.rejectExpert));
router.post('/users/:id/suspend', asyncHandler(adminController.suspendUser));
router.post('/users/:id/unsuspend', asyncHandler(adminController.unsuspendUser));

module.exports = router;
