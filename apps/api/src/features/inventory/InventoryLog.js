/**
 * Inventory Log Model
 * ====================
 * MongoDB schema for tracking all inventory movements
 * 
 * Action Types:
 * - ADD: New stock received from supplier
 * - ADJUST: Manual adjustment (correction, audit)
 * - RESERVE: Stock reserved for pending order
 * - RELEASE: Reserved stock released (order cancelled/expired)
 * - DEDUCT: Stock deducted from reserved (order confirmed)
 * - DAMAGED: Stock marked as damaged/expired
 * 
 * @module features/inventory/InventoryLog
 */

const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
    {
        // Product reference
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required'],
            index: true,
        },

        // Action type
        actionType: {
            type: String,
            required: [true, 'Action type is required'],
            enum: {
                values: ['ADD', 'ADJUST', 'RESERVE', 'RELEASE', 'DEDUCT', 'DAMAGED'],
                message: 'Invalid action type',
            },
            index: true,
        },

        // Quantity changed (positive for add, negative for reduce)
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
        },

        // Stock snapshot before and after
        previousStockTotal: {
            type: Number,
            required: true,
        },

        previousStockReserved: {
            type: Number,
            required: true,
        },

        newStockTotal: {
            type: Number,
            required: true,
        },

        newStockReserved: {
            type: Number,
            required: true,
        },

        // Who performed the action
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Performer is required'],
            index: true,
        },

        // Related order (for RESERVE, RELEASE, DEDUCT actions)
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },

        // Reason for action (required for ADJUST, DAMAGED; optional for others)
        reason: {
            type: String,
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters'],
        },

        // Additional notes
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

// Compound indexes for common queries
inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ performedBy: 1, createdAt: -1 });
inventoryLogSchema.index({ actionType: 1, createdAt: -1 });
inventoryLogSchema.index({ order: 1 });
inventoryLogSchema.index({ createdAt: -1 });

// ==========================================
// VIRTUALS
// ==========================================

/**
 * Computed available stock change
 */
inventoryLogSchema.virtual('previousStockAvailable').get(function () {
    return this.previousStockTotal - this.previousStockReserved;
});

inventoryLogSchema.virtual('newStockAvailable').get(function () {
    return this.newStockTotal - this.newStockReserved;
});

/**
 * Human-readable action description
 */
inventoryLogSchema.virtual('actionDescription').get(function () {
    const descriptions = {
        ADD: 'Stock added',
        ADJUST: 'Stock adjusted',
        RESERVE: 'Stock reserved for order',
        RELEASE: 'Reserved stock released',
        DEDUCT: 'Stock deducted (order confirmed)',
        DAMAGED: 'Stock marked as damaged/expired',
    };
    return descriptions[this.actionType] || this.actionType;
});

// ==========================================
// STATICS
// ==========================================

/**
 * Get inventory logs for a product with pagination
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Logs and pagination
 */
inventoryLogSchema.statics.getLogsForProduct = async function (productId, options = {}) {
    const { page = 1, limit = 20, actionType, startDate, endDate } = options;

    const query = { product: productId };

    if (actionType) {
        query.actionType = actionType;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('performedBy', 'name email role')
            .populate('order', 'orderNumber'),
        this.countDocuments(query),
    ]);

    return {
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get all logs with filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Logs and pagination
 */
inventoryLogSchema.statics.getAllLogs = async function (options = {}) {
    const { page = 1, limit = 50, actionType, productId, performedBy, startDate, endDate } = options;

    const query = {};

    if (actionType) query.actionType = actionType;
    if (productId) query.product = productId;
    if (performedBy) query.performedBy = performedBy;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('product', 'name category')
            .populate('performedBy', 'name email role')
            .populate('order', 'orderNumber'),
        this.countDocuments(query),
    ]);

    return {
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
