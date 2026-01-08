/**
 * Cart Service
 * =============
 * Business logic for cart operations
 * 
 * @module features/cart/cartservice
 */

const Cart = require('./Cart');
const Product = require('../products/Product');

/**
 * Get user's cart with populated products
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Cart with populated items
 */
const getCart = async (userId) => {
    let cart = await Cart.getOrCreateCart(userId);

    // Populate products and recalculate totals
    await cart.populate('items.product');
    await cart.recalculateTotals();
    await cart.save();

    return cart;
};

/**
 * Add item to cart
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Updated cart
 */
const addToCart = async (userId, productId, quantity) => {
    // Validate product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) {
        const error = new Error('Product not found or not available');
        error.statusCode = 404;
        throw error;
    }

    // Check minimum order quantity
    if (quantity < product.minOrderQuantity) {
        const error = new Error(
            `Minimum order quantity for this product is ${product.minOrderQuantity} ${product.unit}`
        );
        error.statusCode = 400;
        throw error;
    }

    // Check maximum order quantity
    if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
        const error = new Error(
            `Maximum order quantity for this product is ${product.maxOrderQuantity} ${product.unit}`
        );
        error.statusCode = 400;
        throw error;
    }

    // Check stock availability
    if (!product.isInStock(quantity)) {
        const error = new Error(
            `Insufficient stock. Only ${product.stock} ${product.unit} available.`
        );
        error.statusCode = 400;
        throw error;
    }

    // Get or create cart
    const cart = await Cart.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
    );

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        // Validate new quantity
        if (product.maxOrderQuantity && newQuantity > product.maxOrderQuantity) {
            const error = new Error(
                `Cannot add more. Maximum order quantity is ${product.maxOrderQuantity} ${product.unit}`
            );
            error.statusCode = 400;
            throw error;
        }

        if (!product.isInStock(newQuantity)) {
            const error = new Error(
                `Insufficient stock. Only ${product.stock} ${product.unit} available.`
            );
            error.statusCode = 400;
            throw error;
        }

        existingItem.quantity = newQuantity;
    } else {
        cart.addItem(productId, quantity, product);
    }

    // Recalculate and save
    await cart.populate('items.product');
    await cart.recalculateTotals();
    await cart.save();

    return cart;
};

/**
 * Update item quantity in cart
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart
 */
const updateCartItem = async (userId, productId, quantity) => {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        throw error;
    }

    const item = cart.items.find(
        (item) => item.product.toString() === productId
    );

    if (!item) {
        const error = new Error('Item not found in cart');
        error.statusCode = 404;
        throw error;
    }

    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
        return await removeFromCart(userId, productId);
    }

    // Validate with product
    const product = await Product.findById(productId);

    if (!product) {
        // Product was deleted, remove from cart
        cart.removeItem(productId);
        await cart.recalculateTotals();
        await cart.save();

        const error = new Error('Product no longer available');
        error.statusCode = 400;
        throw error;
    }

    // Check MOQ
    if (quantity < product.minOrderQuantity) {
        const error = new Error(
            `Minimum order quantity is ${product.minOrderQuantity} ${product.unit}`
        );
        error.statusCode = 400;
        throw error;
    }

    // Check max quantity
    if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
        const error = new Error(
            `Maximum order quantity is ${product.maxOrderQuantity} ${product.unit}`
        );
        error.statusCode = 400;
        throw error;
    }

    // Check stock
    if (!product.isInStock(quantity)) {
        const error = new Error(
            `Insufficient stock. Only ${product.stock} ${product.unit} available.`
        );
        error.statusCode = 400;
        throw error;
    }

    // Update quantity
    item.quantity = quantity;

    // Recalculate and save
    await cart.populate('items.product');
    await cart.recalculateTotals();
    await cart.save();

    return cart;
};

/**
 * Remove item from cart
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} productId - Product's MongoDB ObjectId
 * @returns {Promise<Object>} Updated cart
 */
const removeFromCart = async (userId, productId) => {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        throw error;
    }

    const removed = cart.removeItem(productId);

    if (!removed) {
        const error = new Error('Item not found in cart');
        error.statusCode = 404;
        throw error;
    }

    // Recalculate and save
    await cart.populate('items.product');
    await cart.recalculateTotals();
    await cart.save();

    return cart;
};

/**
 * Clear all items from cart
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Empty cart
 */
const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        throw error;
    }

    cart.clearCart();
    await cart.save();

    return cart;
};

/**
 * Get cart summary (for checkout preview)
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Cart summary
 */
const getCartSummary = async (userId) => {
    const cart = await getCart(userId);

    // Check for any stock issues
    const stockIssues = [];

    for (const item of cart.items) {
        if (item.product) {
            if (!item.product.isInStock(item.quantity)) {
                stockIssues.push({
                    product: item.product.name,
                    requestedQuantity: item.quantity,
                    availableStock: item.product.stock,
                });
            }
        }
    }

    return {
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        estimatedGst: cart.estimatedGst,
        estimatedTotal: cart.estimatedTotal,
        items: cart.items.map((item) => ({
            productId: item.product?._id,
            productName: item.product?.name,
            quantity: item.quantity,
            unit: item.product?.unit,
            pricePerUnit: item.appliedPrice,
            discountPercent: item.discountPercent,
            subtotal: item.subtotal,
        })),
        stockIssues,
        canCheckout: stockIssues.length === 0 && cart.items.length > 0,
    };
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary,
};
