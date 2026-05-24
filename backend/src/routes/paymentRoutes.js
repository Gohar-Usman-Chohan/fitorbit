const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(verifyToken);

router.post('/create-checkout-session', asyncHandler(paymentController.createCheckoutSession));
router.post('/confirm', asyncHandler(paymentController.confirmPayment));

module.exports = router;
