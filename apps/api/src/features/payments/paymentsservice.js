/**
 * Payments Service
 * ==================
 * Business logic for Razorpay payment operations
 * 
 * @module features/payments/paymentsservice
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param {string} orderId - Internal order ID
 * @param {number} amount - Amount in rupees
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Razorpay order
 */
const createRazorpayOrder = async (orderId, amount, userId) => {
    try {
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: orderId,
            notes: {
                orderId,
                userId: userId.toString(),
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);
        return razorpayOrder;
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        const err = new Error('Failed to create payment order');
        err.statusCode = 500;
        throw err;
    }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification result
 */
const verifyPayment = async (paymentData) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = paymentData;

    // Generate expected signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
        const error = new Error('Invalid payment signature');
        error.statusCode = 400;
        throw error;
    }

    return {
        verified: true,
        razorpay_order_id,
        razorpay_payment_id,
        orderId,
    };
};

/**
 * Get payment details by order ID
 * @param {string} orderId - Internal order ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentByOrderId = async (orderId) => {
    try {
        // Fetch from Razorpay using the order receipt
        const orders = await razorpay.orders.all({
            receipt: orderId,
        });

        if (!orders.items || orders.items.length === 0) {
            return { status: 'not_found', orderId };
        }

        const razorpayOrder = orders.items[0];
        const payments = await razorpay.orders.fetchPayments(razorpayOrder.id);

        return {
            orderId,
            razorpayOrderId: razorpayOrder.id,
            status: razorpayOrder.status,
            amount: razorpayOrder.amount / 100,
            payments: payments.items,
        };
    } catch (error) {
        console.error('Get payment error:', error);
        const err = new Error('Failed to fetch payment status');
        err.statusCode = 500;
        throw err;
    }
};

/**
 * Handle Razorpay webhook
 * @param {Object} body - Webhook body
 * @param {string} signature - Razorpay signature
 */
const handleWebhook = async (body, signature) => {
    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

    if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
    }

    const event = body.event;
    const payload = body.payload;

    // Handle different webhook events
    switch (event) {
        case 'payment.captured':
            console.log('Payment captured:', payload.payment.entity.id);
            // Update order status in database
            break;
        case 'payment.failed':
            console.log('Payment failed:', payload.payment.entity.id);
            // Handle failed payment
            break;
        default:
            console.log('Unhandled webhook event:', event);
    }
};

module.exports = {
    createRazorpayOrder,
    verifyPayment,
    getPaymentByOrderId,
    handleWebhook,
};
