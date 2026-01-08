/**
 * Product Model
 * ==============
 * MongoDB schema for agricultural products with bulk pricing
 * 
 * Categories: seeds, fertilizers, pesticides, tools, equipment
 * 
 * @module features/products/Product
 */

const mongoose = require('mongoose');

/**
 * Bulk Pricing Tier Schema
 * Defines discount tiers based on quantity
 */
const bulkPricingTierSchema = new mongoose.Schema(
    {
        minQuantity: {
            type: Number,
            required: [true, 'Minimum quantity is required'],
            min: [1, 'Minimum quantity must be at least 1'],
        },
        maxQuantity: {
            type: Number,
            default: null, // null means unlimited
        },
        pricePerUnit: {
            type: Number,
            required: [true, 'Price per unit is required'],
            min: [0, 'Price cannot be negative'],
        },
        discountPercent: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        // Basic Information
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [200, 'Product name cannot exceed 200 characters'],
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },

        // Categorization
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: {
                values: ['seeds', 'fertilizers', 'pesticides', 'tools', 'equipment', 'others'],
                message: 'Invalid category',
            },
        },

        subCategory: {
            type: String,
            trim: true,
        },

        brand: {
            type: String,
            trim: true,
            maxlength: [100, 'Brand name cannot exceed 100 characters'],
        },

        manufacturer: {
            type: String,
            trim: true,
        },

        // Pricing
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [0, 'Price cannot be negative'],
        },

        // Bulk pricing tiers for wholesalers
        bulkPricing: {
            type: [bulkPricingTierSchema],
            default: [],
        },

        // GST
        hsnCode: {
            type: String,
            trim: true,
            maxlength: [10, 'HSN code cannot exceed 10 characters'],
        },

        gstRate: {
            type: Number,
            default: 18, // Default GST rate
            enum: {
                values: [0, 5, 12, 18, 28],
                message: 'GST rate must be 0, 5, 12, 18, or 28',
            },
        },

        // Units and Quantities
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            enum: {
                values: ['kg', 'g', 'l', 'ml', 'piece', 'packet', 'bag', 'box', 'bottle', 'can'],
                message: 'Invalid unit type',
            },
        },

        packSize: {
            type: String,
            trim: true, // e.g., "5kg", "1L", "500g"
        },

        minOrderQuantity: {
            type: Number,
            default: 1,
            min: [1, 'Minimum order quantity must be at least 1'],
        },

        maxOrderQuantity: {
            type: Number,
            default: null, // null means no limit
        },

        // Inventory
        stock: {
            type: Number,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },

        lowStockThreshold: {
            type: Number,
            default: 10,
            min: [0, 'Threshold cannot be negative'],
        },

        // Product Details
        specifications: {
            composition: String,
            dosage: String,
            applicationMethod: String,
            targetCrops: [String],
            validity: String, // e.g., "2 years from manufacturing"
            storageInstructions: String,
        },

        // Media
        images: [
            {
                url: { type: String, required: true },
                alt: { type: String },
                isPrimary: { type: Boolean, default: false },
            },
        ],

        // Status
        isActive: {
            type: Boolean,
            default: true,
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },

        // Tags for search
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
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

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ stock: 1 });

// ==========================================
// PRE-SAVE MIDDLEWARE
// ==========================================

/**
 * Generate slug from product name before saving
 */
productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Add random suffix to make unique
        this.slug += '-' + Date.now().toString(36);
    }
    next();
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Calculate price based on quantity (bulk pricing)
 * @param {number} quantity - Order quantity
 * @returns {Object} Price details
 */
productSchema.methods.calculatePrice = function (quantity) {
    // Sort bulk pricing by minQuantity descending to find the best tier
    const sortedTiers = [...this.bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity);

    // Find applicable tier
    const applicableTier = sortedTiers.find(
        (tier) => quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    );

    let pricePerUnit = this.basePrice;
    let discountPercent = 0;
    let tierApplied = 'base';

    if (applicableTier) {
        pricePerUnit = applicableTier.pricePerUnit;
        discountPercent = applicableTier.discountPercent;
        tierApplied = `${applicableTier.minQuantity}+ units`;
    }

    const subtotal = pricePerUnit * quantity;
    const gstAmount = (subtotal * this.gstRate) / 100;
    const total = subtotal + gstAmount;

    return {
        pricePerUnit,
        quantity,
        subtotal,
        gstRate: this.gstRate,
        gstAmount,
        total,
        discountPercent,
        tierApplied,
        savings: (this.basePrice - pricePerUnit) * quantity,
    };
};

/**
 * Check if product is in stock
 * @param {number} quantity - Required quantity
 * @returns {boolean} True if in stock
 */
productSchema.methods.isInStock = function (quantity = 1) {
    return this.stock >= quantity;
};

// ==========================================
// VIRTUALS
// ==========================================

/**
 * Check if stock is low
 */
productSchema.virtual('isLowStock').get(function () {
    return this.stock <= this.lowStockThreshold;
});

/**
 * Get primary image URL
 */
productSchema.virtual('primaryImage').get(function () {
    const primary = this.images.find((img) => img.isPrimary);
    return primary ? primary.url : this.images[0]?.url || null;
});

module.exports = mongoose.model('Product', productSchema);
