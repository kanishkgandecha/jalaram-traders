/**
 * Payments Service
 * =================
 * Business logic for Razorpay payment integration
 * 
 * @module features/payments/paymentsservice
 */

const crypto = require('crypto');
const razorpay = require('../../shared/config/razorpay');
const Order = require('../orders/Order');

/**
 * Create a Razorpay order for payment
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Razorpay order details
 */
const createPaymentOrder = async (orderId, userId) => {
    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Verify ownership
    if (order.user.toString() !== userId.toString()) {
        const error = new Error('Not authorized to pay for this order');
        error.statusCode = 403;
        throw error;
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
        const error = new Error('Order is already paid');
        error.statusCode = 400;
        throw error;
    }

    // Check if order is cancelled
    if (order.status === 'cancelled') {
        const error = new Error('Cannot pay for a cancelled order');
        error.statusCode = 400;
        throw error;
    }

    // Create Razorpay order
    const razorpayOrderOptions = {
        amount: order.totalAmount * 100, // Amount in paise
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            userId: userId.toString(),
        },
    };

    try {
        const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

        // Save Razorpay order ID to our order
        order.paymentDetails.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderNumber: order.orderNumber,
            orderId: order._id,
            key: process.env.RAZORPAY_KEY_ID,
            customerInfo: {
                name: order.customerSnapshot.name,
                email: order.customerSnapshot.email,
                phone: order.customerSnapshot.phone,
            },
        };
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        const err = new Error('Failed to create payment order. Please try again.');
        err.statusCode = 500;
        throw err;
    }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verified order
 */
const verifyPayment = async (paymentData) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
    } = paymentData;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        const error = new Error('Missing payment verification data');
        error.statusCode = 400;
        throw error;
    }

    // Find order by Razorpay order ID
    const order = await Order.findOne({
        'paymentDetails.razorpayOrderId': razorpay_order_id,
    });

    if (!order) {
        const error = new Error('Order not found for this payment');
        error.statusCode = 404;
        throw error;
    }

    // Generate signature for verification
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
        // Mark payment as failed
        order.paymentStatus = 'failed';
        await order.save();

        const error = new Error('Payment verification failed. Invalid signature.');
        error.statusCode = 400;
        throw error;
    }

    // Update order with payment details
    order.paymentStatus = 'paid';
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.paymentDetails.paidAt = new Date();

    // Confirm order if it was pending
    if (order.status === 'pending') {
        order.updateStatus('confirmed', 'Payment received', null);
        await order.generateInvoiceNumber();
    }

    await order.save();

    return {
        success: true,
        order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            invoiceNumber: order.invoiceNumber,
        },
    };
};

/**
 * Handle Razorpay webhook events
 * @param {Object} webhookData - Webhook payload
 * @param {string} signature - Razorpay webhook signature
 * @returns {Promise<Object>} Processing result
 */
const handleWebhook = async (webhookData, signature) => {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(webhookData))
            .digest('hex');

        if (signature !== expectedSignature) {
            const error = new Error('Invalid webhook signature');
            error.statusCode = 400;
            throw error;
        }
    }

    const { event, payload } = webhookData;

    switch (event) {
        case 'payment.captured': {
            const paymentEntity = payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;

            const order = await Order.findOne({
                'paymentDetails.razorpayOrderId': razorpayOrderId,
            });

            if (order && order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
                order.paymentDetails.razorpayPaymentId = paymentEntity.id;
                order.paymentDetails.paidAt = new Date();

                if (order.status === 'pending') {
                    order.updateStatus('confirmed', 'Payment captured via webhook', null);
                    await order.generateInvoiceNumber();
                }

                await order.save();
            }

            return { event: 'payment.captured', processed: true };
        }

        case 'payment.failed': {
            const paymentEntity = payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;

            const order = await Order.findOne({
                'paymentDetails.razorpayOrderId': razorpayOrderId,
            });

            if (order && order.paymentStatus !== 'paid') {
                order.paymentStatus = 'failed';
                await order.save();
            }

            return { event: 'payment.failed', processed: true };
        }

        case 'refund.created': {
            const refundEntity = payload.refund.entity;
            const paymentId = refundEntity.payment_id;

            const order = await Order.findOne({
                'paymentDetails.razorpayPaymentId': paymentId,
            });

            if (order) {
                // Check if full or partial refund
                const refundAmount = refundEntity.amount / 100; // Convert from paise
                if (refundAmount >= order.totalAmount) {
                    order.paymentStatus = 'refunded';
                } else {
                    order.paymentStatus = 'partial_refund';
                }
                await order.save();
            }

            return { event: 'refund.created', processed: true };
        }

        default:
            return { event, processed: false, message: 'Unhandled event type' };
    }
};

/**
 * Get payment status for an order
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Payment status
 */
const getPaymentStatus = async (orderId, userId) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Verify ownership or admin
    if (order.user.toString() !== userId.toString()) {
        const error = new Error('Not authorized to view this payment');
        error.statusCode = 403;
        throw error;
    }

    return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentDetails: {
            razorpayOrderId: order.paymentDetails.razorpayOrderId,
            razorpayPaymentId: order.paymentDetails.razorpayPaymentId,
            paidAt: order.paymentDetails.paidAt,
        },
    };
};

/**
 * Initiate refund for an order (admin only)
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {number} amount - Refund amount (optional, defaults to full refund)
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund details
 */
const initiateRefund = async (orderId, amount, reason) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    if (order.paymentStatus !== 'paid') {
        const error = new Error('Cannot refund an unpaid order');
        error.statusCode = 400;
        throw error;
    }

    if (!order.paymentDetails.razorpayPaymentId) {
        const error = new Error('No payment found to refund');
        error.statusCode = 400;
        throw error;
    }

    const refundAmount = amount || order.totalAmount;

    try {
        const refund = await razorpay.payments.refund(
            order.paymentDetails.razorpayPaymentId,
            {
                amount: refundAmount * 100, // Convert to paise
                notes: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    reason: reason || 'Customer request',
                },
            }
        );

        // Update order status
        if (refundAmount >= order.totalAmount) {
            order.paymentStatus = 'refunded';
        } else {
            order.paymentStatus = 'partial_refund';
        }
        await order.save();

        return {
            refundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status,
            orderNumber: order.orderNumber,
        };
    } catch (error) {
        console.error('Refund error:', error);
        const err = new Error('Failed to process refund. Please try again.');
        err.statusCode = 500;
        throw err;
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handleWebhook,
    getPaymentStatus,
    initiateRefund,
};
