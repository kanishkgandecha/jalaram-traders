/**
 * Pricing Service
 * =================
 * Role-based pricing logic for wholesale and retail prices
 * 
 * - Retailers: See wholesalePrice, must meet MOQ
 * - Farmers: See retailMRP (when enabled)
 * - Admin/Employee: See all pricing fields
 * 
 * @module features/products/pricingservice
 */

/**
 * Get price for a specific user role
 * @param {Object} product - Product document
 * @param {string} role - User role (admin, employee, retailer, farmer)
 * @param {number} quantity - Order quantity
 * @returns {Object} Pricing details for the role
 */
const getPriceForRole = (product, role, quantity = 1) => {
    // Admin and Employee see all pricing info
    if (role === 'admin' || role === 'employee') {
        const effectivePrice = product.wholesalePrice || product.basePrice;
        return {
            wholesalePrice: effectivePrice,
            wholesaleMOQ: product.wholesaleMOQ || product.minOrderQuantity || 1,
            retailMRP: product.retailMRP,
            retailMaxQuantity: product.retailMaxQuantity,
            pricingMode: product.pricingMode || 'WHOLESALE_ONLY',
            bulkPricing: product.bulkPricing || [],
            // Calculate based on wholesale for admin view
            ...calculateWholesalePrice(product, quantity),
        };
    }

    // Retailer sees wholesale pricing only
    if (role === 'retailer') {
        const effectivePrice = product.wholesalePrice || product.basePrice;
        return {
            price: effectivePrice,
            minQuantity: product.wholesaleMOQ || product.minOrderQuantity || 1,
            unit: product.unit,
            gstRate: product.gstRate || 18,
            bulkPricing: product.bulkPricing || [],
            ...calculateWholesalePrice(product, quantity),
        };
    }

    // Farmer sees retail pricing (if available)
    if (role === 'farmer') {
        // Check if retail is enabled
        if (product.pricingMode !== 'WHOLESALE_AND_RETAIL' || !product.retailMRP) {
            return {
                available: false,
                message: 'This product is only available for wholesale orders',
            };
        }

        return {
            price: product.retailMRP,
            maxQuantity: product.retailMaxQuantity,
            unit: product.unit,
            gstRate: product.gstRate,
            ...calculateRetailPrice(product, quantity),
        };
    }

    // Default: no pricing access
    return { available: false };
};

/**
 * Calculate wholesale price with bulk pricing tiers
 * @param {Object} product - Product document
 * @param {number} quantity - Order quantity
 * @returns {Object} Calculated price details
 */
const calculateWholesalePrice = (product, quantity) => {
    // Use wholesalePrice or fall back to basePrice for legacy products
    const effectivePrice = product.wholesalePrice || product.basePrice || 0;
    const gstRate = product.gstRate || 18;

    // Sort bulk pricing by minQuantity descending
    const sortedTiers = [...(product.bulkPricing || [])].sort(
        (a, b) => b.minQuantity - a.minQuantity
    );

    // Find applicable tier
    const applicableTier = sortedTiers.find(
        (tier) =>
            quantity >= tier.minQuantity &&
            (tier.maxQuantity === null || quantity <= tier.maxQuantity)
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
};

/**
 * Calculate retail price (for farmers)
 * @param {Object} product - Product document
 * @param {number} quantity - Order quantity
 * @returns {Object} Calculated price details
 */
const calculateRetailPrice = (product, quantity) => {
    const pricePerUnit = product.retailMRP;
    const subtotal = pricePerUnit * quantity;
    const gstAmount = (subtotal * product.gstRate) / 100;
    const total = subtotal + gstAmount;

    return {
        pricePerUnit,
        quantity,
        subtotal,
        gstRate: product.gstRate,
        gstAmount,
        total,
        discountPercent: 0,
        tierApplied: 'retail',
        savings: 0,
    };
};

/**
 * Validate order quantity based on role
 * @param {Object} product - Product document
 * @param {string} role - User role
 * @param {number} quantity - Requested quantity
 * @returns {Object} Validation result
 */
const validateOrderQuantity = (product, role, quantity) => {
    if (role === 'retailer') {
        // Must meet wholesale MOQ
        const minQty = product.wholesaleMOQ || product.minOrderQuantity || 1;
        if (quantity < minQty) {
            return {
                valid: false,
                message: `Minimum order quantity is ${minQty} ${product.unit}`,
                minQuantity: minQty,
            };
        }

        // Check max order quantity if set
        if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
            return {
                valid: false,
                message: `Maximum order quantity is ${product.maxOrderQuantity} ${product.unit}`,
                maxQuantity: product.maxOrderQuantity,
            };
        }
    }

    if (role === 'farmer') {
        // Check retail availability
        if (product.pricingMode !== 'WHOLESALE_AND_RETAIL') {
            return {
                valid: false,
                message: 'This product is not available for retail purchase',
            };
        }

        // Check retail max quantity
        if (quantity > product.retailMaxQuantity) {
            return {
                valid: false,
                message: `Maximum retail quantity is ${product.retailMaxQuantity} ${product.unit}`,
                maxQuantity: product.retailMaxQuantity,
            };
        }
    }

    // Check stock availability
    const availableStock = product.stockTotal - product.stockReserved;
    if (quantity > availableStock) {
        return {
            valid: false,
            message: `Only ${availableStock} ${product.unit} available in stock`,
            availableStock,
        };
    }

    return { valid: true };
};

/**
 * Filter product data based on role (for API responses)
 * @param {Object} product - Product document (lean or toObject)
 * @param {string} role - User role
 * @returns {Object} Filtered product data
 */
const filterProductForRole = (product, role) => {
    const productObj = product.toObject ? product.toObject() : { ...product };

    if (role === 'admin' || role === 'employee') {
        // Full access - return everything
        return productObj;
    }

    if (role === 'retailer') {
        // Hide retail pricing, show wholesale
        const { retailMRP, retailMaxQuantity, ...wholesaleView } = productObj;
        const effectivePrice = productObj.wholesalePrice || productObj.basePrice;
        return {
            ...wholesaleView,
            // Map wholesalePrice to basePrice for backwards compatibility
            basePrice: effectivePrice,
            // Use minOrderQuantity from product (don't override with wholesaleMOQ)
            minOrderQuantity: productObj.minOrderQuantity || productObj.wholesaleMOQ || 1,
        };
    }

    if (role === 'farmer') {
        // Hide wholesale pricing, show retail if enabled
        if (productObj.pricingMode !== 'WHOLESALE_AND_RETAIL' || !productObj.retailMRP) {
            // Not available for retail
            return null;
        }

        const {
            wholesalePrice,
            wholesaleMOQ,
            bulkPricing,
            ...retailView
        } = productObj;

        return {
            ...retailView,
            basePrice: productObj.retailMRP,
            maxOrderQuantity: productObj.retailMaxQuantity,
        };
    }

    // Default minimal view
    return {
        _id: productObj._id,
        name: productObj.name,
        description: productObj.description,
        category: productObj.category,
        images: productObj.images,
        isActive: productObj.isActive,
    };
};

module.exports = {
    getPriceForRole,
    calculateWholesalePrice,
    calculateRetailPrice,
    validateOrderQuantity,
    filterProductForRole,
};
