/**
 * Cart Routes
 * =============
 * Route definitions for shopping cart endpoints
 * 
 * @module features/cart/cartroutes
 */

const express = require('express');
const router = express.Router();
const cartController = require('./cartcontroller');
const { protect } = require('../../shared/middleware/authmiddleware');

// All cart routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/v1/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', cartController.addToCart);

/**
 * @route   PUT /api/v1/cart/update
 * @desc    Update cart item quantity
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
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear', cartController.clearCart);

module.exports = router;

