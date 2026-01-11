/**
 * Cart Controller
 * =================
 * Request handlers for cart endpoints
 * 
 * @module features/cart/cartcontroller
 */

const cartService = require('./cartservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get current user's cart
 * @route   GET /api/v1/cart
 * @access  Private
 */
const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCart(req.user._id);
        sendSuccess(res, 200, 'Cart retrieved successfully', { cart });
    } catch (error) {
        console.error('Get cart error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart
 * @access  Private
 */
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return sendError(res, 400, 'Product ID and quantity are required');
        }

        const cart = await cartService.addToCart(req.user._id, productId, quantity);
        sendSuccess(res, 200, 'Item added to cart', { cart });
    } catch (error) {
        console.error('Add to cart error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/v1/cart/:itemId
 * @access  Private
 */
const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return sendError(res, 400, 'Product ID and quantity are required');
        }

        const cart = await cartService.updateCartItem(
            req.user._id,
            productId,
            quantity
        );
        sendSuccess(res, 200, 'Cart updated successfully', { cart });
    } catch (error) {
        console.error('Update cart item error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/:itemId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
    try {
        const cart = await cartService.removeFromCart(req.user._id, req.params.productId);
        sendSuccess(res, 200, 'Item removed from cart', { cart });
    } catch (error) {
        console.error('Remove from cart error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req.user._id);
        sendSuccess(res, 200, 'Cart cleared successfully', { cart });
    } catch (error) {
        console.error('Clear cart error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};
