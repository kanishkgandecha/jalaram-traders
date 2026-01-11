/**
 * Cart Model
 * ============
 * MongoDB schema for shopping cart
 * 
 * Features:
 * - User-specific cart
 * - Product items with quantity tracking
 * - Price calculations with bulk discounts
 * - GST estimation
 * 
 * @module features/cart/Cart
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        // Snapshot of price at time of adding (may update on recalculation)
        appliedPrice: {
            type: Number,
            required: true,
        },
        discountPercent: {
            type: Number,
            default: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
        // Calculated totals (updated on each modification)
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
        // Item count (for quick reference)
        itemCount: {
            type: Number,
            default: 0,
        },
        // Last updated timestamp
        lastUpdated: {
            type: Date,
            default: Date.now,
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

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ 'items.product': 1 });

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get or create cart for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Cart document
 */
cartSchema.statics.getOrCreateCart = async function (userId) {
    let cart = await this.findOne({ user: userId });

    if (!cart) {
        cart = await this.create({ user: userId, items: [] });
    }

    return cart;
};

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Add item to cart
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to add
 * @param {Object} product - Product document (for price snapshot)
 */
cartSchema.methods.addItem = function (productId, quantity, product) {
    // Calculate price based on quantity (bulk pricing)
    const pricing = product.calculatePrice ? product.calculatePrice(quantity) : {
        pricePerUnit: product.wholesalePrice || product.basePrice,
        discountPercent: 0,
    };

    this.items.push({
        product: productId,
        quantity,
        appliedPrice: pricing.pricePerUnit,
        discountPercent: pricing.discountPercent || 0,
        subtotal: pricing.pricePerUnit * quantity,
        addedAt: new Date(),
    });
};

/**
 * Remove item from cart
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
 * Clear all items from cart
 */
cartSchema.methods.clearCart = function () {
    this.items = [];
    this.subtotal = 0;
    this.estimatedGst = 0;
    this.estimatedTotal = 0;
    this.itemCount = 0;
    this.lastUpdated = new Date();
};

/**
 * Recalculate all totals
 * Must be called after cart modifications
 * Requires items to be populated with product data
 */
cartSchema.methods.recalculateTotals = async function () {
    let subtotal = 0;
    let estimatedGst = 0;
    let itemCount = 0;

    for (const item of this.items) {
        if (!item.product) continue;

        const product = item.product;

        // Recalculate price based on current quantity
        const price = product.wholesalePrice || product.basePrice || 0;
        let pricePerUnit = price;
        let discountPercent = 0;

        // Check bulk pricing if available
        if (product.bulkPricing && product.bulkPricing.length > 0) {
            const sortedTiers = [...product.bulkPricing].sort(
                (a, b) => b.minQuantity - a.minQuantity
            );
            const applicableTier = sortedTiers.find(
                (tier) =>
                    item.quantity >= tier.minQuantity &&
                    (tier.maxQuantity === null || item.quantity <= tier.maxQuantity)
            );
            if (applicableTier) {
                pricePerUnit = applicableTier.pricePerUnit;
                discountPercent = applicableTier.discountPercent || 0;
            }
        }

        // Update item
        item.appliedPrice = pricePerUnit;
        item.discountPercent = discountPercent;
        item.subtotal = pricePerUnit * item.quantity;

        // Add to totals
        subtotal += item.subtotal;
        const gstRate = product.gstRate || 18;
        estimatedGst += (item.subtotal * gstRate) / 100;
        itemCount += item.quantity;
    }

    this.subtotal = Math.round(subtotal * 100) / 100;
    this.estimatedGst = Math.round(estimatedGst * 100) / 100;
    this.estimatedTotal = Math.round((subtotal + estimatedGst) * 100) / 100;
    this.itemCount = itemCount;
    this.lastUpdated = new Date();
};

module.exports = mongoose.model('Cart', cartSchema);
