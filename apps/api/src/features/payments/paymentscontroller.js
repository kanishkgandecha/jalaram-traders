/**
 * Payments Controller
 * =====================
 * Request handlers for payment endpoints
 * 
 * @module features/payments/paymentscontroller
 */

const paymentsService = require('./paymentsservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * @desc    Create Razorpay order
 * @route   POST /api/v1/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount) {
            return sendError(res, 400, 'Order ID and amount are required');
        }

        const razorpayOrder = await paymentsService.createRazorpayOrder(
            orderId,
            amount,
            req.user._id
        );

        sendSuccess(res, 200, 'Payment order created', { order: razorpayOrder });
    } catch (error) {
        console.error('Create payment order error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Verify payment signature
 * @route   POST /api/v1/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return sendError(res, 400, 'Payment verification details are required');
        }

        const result = await paymentsService.verifyPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        });

        sendSuccess(res, 200, 'Payment verified successfully', result);
    } catch (error) {
        console.error('Verify payment error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get payment status for an order
 * @route   GET /api/v1/payments/:orderId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
    try {
        const payment = await paymentsService.getPaymentByOrderId(req.params.orderId);
        sendSuccess(res, 200, 'Payment status retrieved', { payment });
    } catch (error) {
        console.error('Get payment status error:', error);
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
        await paymentsService.handleWebhook(req.body, signature);
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        // Return 200 to acknowledge receipt (Razorpay expects this)
        res.status(200).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    handleWebhook,
};
