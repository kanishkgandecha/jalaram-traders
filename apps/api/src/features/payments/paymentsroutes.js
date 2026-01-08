/**
 * Payments Routes
 * ================
 * Route definitions for payment endpoints
 * 
 * @module features/payments/paymentsroutes
 */

const express = require('express');
const router = express.Router();
const paymentsController = require('./paymentscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// ==========================================
// PUBLIC ROUTES (Webhook)
// ==========================================

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Razorpay webhook events
 * @access  Public (verified by Razorpay signature)
 */
router.post('/webhook', paymentsController.handleWebhook);

// ==========================================
// PROTECTED ROUTES
// ==========================================

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create Razorpay order for payment
 * @access  Private
 */
router.post('/create-order', protect, paymentsController.createPaymentOrder);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay payment after completion
 * @access  Private
 */
router.post('/verify', protect, paymentsController.verifyPayment);

/**
 * @route   GET /api/v1/payments/status/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get('/status/:orderId', protect, paymentsController.getPaymentStatus);

// ==========================================
// ADMIN ROUTES
// ==========================================

/**
 * @route   POST /api/v1/payments/refund
 * @desc    Initiate refund for an order
 * @access  Private (Admin)
 */
router.post('/refund', protect, authorize('admin'), paymentsController.initiateRefund);

module.exports = router;
