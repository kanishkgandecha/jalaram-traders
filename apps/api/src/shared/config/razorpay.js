/**
 * Razorpay Configuration
 * =======================
 * Initialize Razorpay instance for payment processing
 * 
 * @module shared/config/razorpay
 */

const Razorpay = require('razorpay');

/**
 * Razorpay instance configured with API keys
 * Use test keys in development, live keys in production
 */
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
