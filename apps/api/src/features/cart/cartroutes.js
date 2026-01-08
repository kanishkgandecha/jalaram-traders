/**
 * Cart Routes
 * ============
 * Route definitions for cart endpoints
 * 
 * All cart routes require authentication
 * 
 * @module features/cart/cartroutes
 */

const express = require('express');
const router = express.Router();
const cartController = require('./cartcontroller');
const { protect } = require('../../shared/middleware/authmiddleware');

// All cart routes require authentication
router.use(protect);

// ==========================================
// CART ROUTES
// ==========================================

/**
 * @route   GET /api/v1/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   GET /api/v1/cart/summary
 * @desc    Get cart summary for checkout
 * @access  Private
 */
router.get('/summary', cartController.getCartSummary);

/**
 * @route   POST /api/v1/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', cartController.addToCart);

/**
 * @route   PUT /api/v1/cart/update
 * @desc    Update item quantity in cart
 * @access  Private
 */
router.put('/update', cartController.updateCartItem);

/**
 * @route   DELETE /api/v1/cart/remove/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/remove/:productId', cartController.removeFromCart);

/**
 * @route   DELETE /api/v1/cart/clear
 * @desc    Clear all items from cart
 * @access  Private
 */
router.delete('/clear', cartController.clearCart);

module.exports = router;
