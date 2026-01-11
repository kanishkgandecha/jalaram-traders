/**
 * Payments Routes
 * =================
 * Route definitions for payment endpoints
 * 
 * @module features/payments/paymentsroutes
 */

const express = require('express');
const router = express.Router();
const paymentsController = require('./paymentscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// All payment routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create Razorpay order
 * @access  Private
 */
router.post('/create-order', paymentsController.createOrder);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify payment signature
 * @access  Private
 */
router.post('/verify', paymentsController.verifyPayment);

/**
 * @route   GET /api/v1/payments/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get('/:orderId', paymentsController.getPaymentStatus);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Razorpay webhook handler
 * @access  Public (verified by signature)
 */
router.post('/webhook', paymentsController.handleWebhook);

module.exports = router;
