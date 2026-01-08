/**
 * Cart Model
 * ===========
 * MongoDB schema for shopping cart
 * 
 * Cart is user-specific and holds items before checkout
 * 
 * @module features/cart/Cart
 */

const mongoose = require('mongoose');

/**
 * Cart Item Schema
 * Each item in the cart references a product with quantity and price snapshot
 */
const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product reference is required'],
        },

        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },

        // Price snapshot at time of adding (protects against price changes)
        priceAtAdd: {
            type: Number,
            required: true,
        },

        // Calculated fields (updated on cart operations)
        appliedPrice: {
            type: Number, // Price after bulk discount is applied
        },

        discountPercent: {
            type: Number,
            default: 0,
        },

        subtotal: {
            type: Number,
        },
    },
    { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true, // One cart per user
        },

        items: {
            type: [cartItemSchema],
            default: [],
        },

        // Calculated totals
        itemCount: {
            type: Number,
            default: 0,
        },

        subtotal: {
            type: Number,
            default: 0,
        },

        estimatedGst: {
            type: Number,
            default: 0,
        },

        estimatedTotal: {
            type: Number,
            default: 0,
        },

        // Cart notes
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ==========================================
// INDEXES
// ==========================================

cartSchema.index({ user: 1 });

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Recalculate cart totals
 * Should be called after any item changes
 */
cartSchema.methods.recalculateTotals = async function () {
    // Populate products to get current prices
    await this.populate('items.product');

    let subtotal = 0;
    let totalGst = 0;
    let itemCount = 0;

    for (const item of this.items) {
        if (item.product) {
            // Calculate price using product's bulk pricing method
            const priceData = item.product.calculatePrice(item.quantity);

            item.appliedPrice = priceData.pricePerUnit;
            item.discountPercent = priceData.discountPercent;
            item.subtotal = priceData.subtotal;

            subtotal += priceData.subtotal;
            totalGst += priceData.gstAmount;
            itemCount += item.quantity;
        }
    }

    this.itemCount = itemCount;
    this.subtotal = Math.round(subtotal * 100) / 100;
    this.estimatedGst = Math.round(totalGst * 100) / 100;
    this.estimatedTotal = Math.round((subtotal + totalGst) * 100) / 100;

    return this;
};

/**
 * Add or update an item in the cart
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to add
 * @param {Object} product - Product object with pricing
 * @returns {Object} Updated cart item
 */
cartSchema.methods.addItem = function (productId, quantity, product) {
    const existingItemIndex = this.items.findIndex(
        (item) => item.product.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
        // Update existing item
        this.items[existingItemIndex].quantity += quantity;
        return this.items[existingItemIndex];
    } else {
        // Add new item
        const newItem = {
            product: productId,
            quantity,
            priceAtAdd: product.basePrice,
        };
        this.items.push(newItem);
        return newItem;
    }
};

/**
 * Update item quantity
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - New quantity
 * @returns {Object|null} Updated cart item or null if not found
 */
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
    const item = this.items.find(
        (item) => item.product.toString() === productId.toString()
    );

    if (item) {
        item.quantity = quantity;
        return item;
    }

    return null;
};

/**
 * Remove an item from the cart
 * @param {string} productId - Product's MongoDB ObjectId
 * @returns {boolean} True if item was removed
 */
cartSchema.methods.removeItem = function (productId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(
        (item) => item.product.toString() !== productId.toString()
    );
    return this.items.length < initialLength;
};

/**
 * Clear all items from the cart
 */
cartSchema.methods.clearCart = function () {
    this.items = [];
    this.itemCount = 0;
    this.subtotal = 0;
    this.estimatedGst = 0;
    this.estimatedTotal = 0;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get or create cart for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Cart object
 */
cartSchema.statics.getOrCreateCart = async function (userId) {
    let cart = await this.findOne({ user: userId });

    if (!cart) {
        cart = await this.create({ user: userId });
    }

    return cart;
};

module.exports = mongoose.model('Cart', cartSchema);
