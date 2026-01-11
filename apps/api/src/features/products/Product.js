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

        // ==========================================
        // PRICING SYSTEM
        // ==========================================


        // Wholesale Pricing (for retailers)
        // This is the primary price used for B2B wholesale orders
        wholesalePrice: {
            type: Number,
            min: [0, 'Price cannot be negative'],
        },

        // Wholesale Minimum Order Quantity
        wholesaleMOQ: {
            type: Number,
            default: 1,
            min: [1, 'Wholesale MOQ must be at least 1'],
        },

        // Retail MRP (for farmers - future use)
        // Maximum Retail Price for individual small-quantity purchases
        retailMRP: {
            type: Number,
            default: null, // null means retail not available
            min: [0, 'MRP cannot be negative'],
        },

        // Retail Maximum Quantity per order (for farmers)
        retailMaxQuantity: {
            type: Number,
            default: 10, // Limit per order for retail
            min: [1, 'Retail max quantity must be at least 1'],
        },

        // Pricing Mode - controls which pricing is active
        pricingMode: {
            type: String,
            enum: {
                values: ['WHOLESALE_ONLY', 'WHOLESALE_AND_RETAIL'],
                message: 'Pricing mode must be WHOLESALE_ONLY or WHOLESALE_AND_RETAIL',
            },
            default: 'WHOLESALE_ONLY',
        },

        // Legacy: basePrice (kept for backwards compatibility, maps to wholesalePrice)
        basePrice: {
            type: Number,
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

        // Quantity limits (overrides for specific products)
        minOrderQuantity: {
            type: Number,
            default: 1,
            min: [1, 'Minimum order quantity must be at least 1'],
        },

        maxOrderQuantity: {
            type: Number,
            default: null, // null means no limit
        },

        // Inventory - Inventory-First System
        stockTotal: {
            type: Number,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },

        stockReserved: {
            type: Number,
            default: 0,
            min: [0, 'Reserved stock cannot be negative'],
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
productSchema.index({ stockTotal: 1 });

// ==========================================
// PRE-SAVE MIDDLEWARE
// ==========================================

/**
 * Generate slug from product name before saving
 * Using async pattern for Mongoose 9+ compatibility
 */
productSchema.pre('save', function () {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Add random suffix to make unique
        this.slug += '-' + Date.now().toString(36);
    }

    // Sync wholesalePrice and basePrice for backwards compatibility
    if (!this.wholesalePrice && this.basePrice) {
        this.wholesalePrice = this.basePrice;
    }
    if (!this.basePrice && this.wholesalePrice) {
        this.basePrice = this.wholesalePrice;
    }
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
    // Primary: wholesalePrice (for retailers)
    // Fallback: basePrice (legacy support)
    const effectivePrice = this.wholesalePrice || this.basePrice || 0;
    const gstRate = this.gstRate || 18;

    // Sort bulk pricing by minQuantity descending to find the best tier
    const sortedTiers = [...(this.bulkPricing || [])].sort((a, b) => b.minQuantity - a.minQuantity);

    // Find applicable tier
    const applicableTier = sortedTiers.find(
        (tier) => quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    );

    let pricePerUnit = effectivePrice;
    let discountPercent = 0;
    let tierApplied = 'base';

    if (applicableTier) {
        pricePerUnit = applicableTier.pricePerUnit;
        discountPercent = applicableTier.discountPercent || 0;
        tierApplied = `${applicableTier.minQuantity}+ units`;
    }

    const subtotal = pricePerUnit * quantity;
    const gstAmount = (subtotal * gstRate) / 100;
    const total = subtotal + gstAmount;

    return {
        pricePerUnit,
        quantity,
        subtotal,
        gstRate,
        gstAmount,
        total,
        discountPercent,
        tierApplied,
        savings: (effectivePrice - pricePerUnit) * quantity,
    };

    // TODO: Future - Farmer/Retail checkout
    // For farmers, use retailMRP instead of wholesalePrice
    // const retailPrice = this.retailMRP;
    // if (this.pricingMode === 'WHOLESALE_AND_RETAIL' && retailPrice) {
    //     ...calculate retail pricing...
    // }
};

/**
 * Check if product is in stock (using available stock)
 * @param {number} quantity - Required quantity
 * @returns {boolean} True if in stock
 */
productSchema.methods.isInStock = function (quantity = 1) {
    return this.stockAvailable >= quantity;
};

// ==========================================
// VIRTUALS
// ==========================================

/**
 * Computed available stock (total - reserved)
 */
productSchema.virtual('stockAvailable').get(function () {
    return this.stockTotal - this.stockReserved;
});

/**
 * Check if stock is low
 */
productSchema.virtual('isLowStock').get(function () {
    return this.stockAvailable <= this.lowStockThreshold;
});

/**
 * Get primary image URL
 */
productSchema.virtual('primaryImage').get(function () {
    const primary = this.images.find((img) => img.isPrimary);
    return primary ? primary.url : this.images[0]?.url || null;
});

module.exports = mongoose.model('Product', productSchema);
