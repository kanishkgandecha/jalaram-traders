/**
 * Payments Controller
 * ====================
 * Request handlers for payment endpoints
 * 
 * @module features/payments/paymentscontroller
 */

const paymentsService = require('./paymentsservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * @desc    Create Razorpay order for payment
 * @route   POST /api/v1/payments/create-order
 * @access  Private
 */
const createPaymentOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return sendError(res, 400, 'Order ID is required');
        }

        const paymentOrder = await paymentsService.createPaymentOrder(orderId, req.user._id);

        sendSuccess(res, 200, 'Payment order created successfully', paymentOrder);
    } catch (error) {
        console.error('Create payment order error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/v1/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
    try {
        const result = await paymentsService.verifyPayment(req.body);

        sendSuccess(res, 200, 'Payment verified successfully', result);
    } catch (error) {
        console.error('Verify payment error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Handle Razorpay webhook
 * @route   POST /api/v1/payments/webhook
 * @access  Public (verified by signature)
 */
const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];

        const result = await paymentsService.handleWebhook(req.body, signature);

        // Always return 200 to Razorpay, even if we didn't process the event
        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Webhook error:', error);
        // Still return 200 to avoid Razorpay retries for invalid signatures
        res.status(200).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * @desc    Get payment status for an order
 * @route   GET /api/v1/payments/status/:orderId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
    try {
        const status = await paymentsService.getPaymentStatus(
            req.params.orderId,
            req.user._id
        );

        sendSuccess(res, 200, 'Payment status retrieved successfully', status);
    } catch (error) {
        console.error('Get payment status error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Initiate refund for an order
 * @route   POST /api/v1/payments/refund
 * @access  Private (Admin)
 */
const initiateRefund = async (req, res) => {
    try {
        const { orderId, amount, reason } = req.body;

        if (!orderId) {
            return sendError(res, 400, 'Order ID is required');
        }

        const refund = await paymentsService.initiateRefund(orderId, amount, reason);

        sendSuccess(res, 200, 'Refund initiated successfully', refund);
    } catch (error) {
        console.error('Initiate refund error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handleWebhook,
    getPaymentStatus,
    initiateRefund,
};
