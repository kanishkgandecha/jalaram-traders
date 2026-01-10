/**
 * Products Service
 * =================
 * Business logic for product operations
 * 
 * @module features/products/productsservice
 */

const Product = require('./Product');

/**
 * Get all products with filtering, search, and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Products and pagination info
 */
const getAllProducts = async (queryParams) => {
    const {
        page = 1,
        limit = 12,
        category,
        brand,
        minPrice,
        maxPrice,
        inStock,
        isFeatured,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive = true,
    } = queryParams;

    // Build query
    const query = {};

    // Active status (admins might want to see inactive products)
    if (isActive !== undefined) {
        query.isActive = isActive === 'true' || isActive === true;
    }

    if (category) {
        query.category = category;
    }

    if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
    }

    if (minPrice || maxPrice) {
        query.basePrice = {};
        if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
        if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
        // Check available stock (total - reserved > 0)
        query.$expr = { $gt: [{ $subtract: ['$stockTotal', '$stockReserved'] }, 0] };
    }

    if (isFeatured === 'true') {
        query.isFeatured = true;
    }

    // Text search
    if (search) {
        query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    let sortOptions = {};
    if (search) {
        // If searching, sort by text score first
        sortOptions = { score: { $meta: 'textScore' }, [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    } else {
        sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    // Execute query
    let productsQuery = Product.find(query);

    if (search) {
        productsQuery = productsQuery.select({ score: { $meta: 'textScore' } });
    }

    const [products, total] = await Promise.all([
        productsQuery.sort(sortOptions).skip(skip).limit(parseInt(limit)),
        Product.countDocuments(query),
    ]);

    return {
        products,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get product by ID
 * @param {string} productId - Product's MongoDB ObjectId
 * @returns {Promise<Object>} Product object
 */
const getProductById = async (productId) => {
    const product = await Product.findById(productId);

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    return product;
};

/**
 * Get product by slug
 * @param {string} slug - Product's URL slug
 * @returns {Promise<Object>} Product object
 */
const getProductBySlug = async (slug) => {
    const product = await Product.findOne({ slug, isActive: true });

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    return product;
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData) => {
    const product = await Product.create(productData);
    return product;
};

/**
 * Update product by ID
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated product
 */
const updateProduct = async (productId, updateData) => {
    const product = await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
        runValidators: true,
    });

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    return product;
};

/**
 * Delete product (soft delete)
 * @param {string} productId - Product's MongoDB ObjectId
 * @returns {Promise<Object>} Deleted product
 */
const deleteProduct = async (productId) => {
    const product = await Product.findByIdAndUpdate(
        productId,
        { isActive: false },
        { new: true }
    );

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    return product;
};

/**
 * Hard delete product (permanent)
 * @param {string} productId - Product's MongoDB ObjectId
 * @returns {Promise<void>}
 */
const hardDeleteProduct = async (productId) => {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    return product;
};

/**
 * Update product stock (DEPRECATED - use inventoryService.addStock instead)
 * Kept for backward compatibility but should use inventory service
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to add (negative to subtract)
 * @returns {Promise<Object>} Updated product
 * @deprecated Use inventoryService.addStock or inventoryService.adjustStock instead
 */
const updateStock = async (productId, quantity) => {
    const product = await Product.findById(productId);

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    const newStock = product.stockTotal + quantity;

    if (newStock < 0) {
        const error = new Error('Insufficient stock');
        error.statusCode = 400;
        throw error;
    }

    // Ensure available stock doesn't go negative
    if (newStock < product.stockReserved) {
        const error = new Error('Cannot reduce stock below reserved amount');
        error.statusCode = 400;
        throw error;
    }

    product.stockTotal = newStock;
    await product.save();

    return product;
};

/**
 * Calculate price for a product with quantity
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Order quantity
 * @returns {Promise<Object>} Price calculation
 */
const calculatePrice = async (productId, quantity) => {
    const product = await Product.findById(productId);

    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    if (quantity < product.minOrderQuantity) {
        const error = new Error(`Minimum order quantity is ${product.minOrderQuantity}`);
        error.statusCode = 400;
        throw error;
    }

    if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
        const error = new Error(`Maximum order quantity is ${product.maxOrderQuantity}`);
        error.statusCode = 400;
        throw error;
    }

    return {
        product: {
            id: product._id,
            name: product.name,
            unit: product.unit,
        },
        pricing: product.calculatePrice(quantity),
    };
};

/**
 * Get products by category
 * @param {string} category - Product category
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} Products
 */
const getProductsByCategory = async (category, limit = 10) => {
    return await Product.find({ category, isActive: true })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit);
};

/**
 * Get featured products
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} Featured products
 */
const getFeaturedProducts = async (limit = 8) => {
    return await Product.find({ isFeatured: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Get low stock products
 * @returns {Promise<Array>} Low stock products
 */
const getLowStockProducts = async () => {
    return await Product.aggregate([
        { $match: { isActive: true } },
        {
            $addFields: {
                stockAvailable: { $subtract: ['$stockTotal', '$stockReserved'] },
            },
        },
        {
            $match: {
                $expr: { $lte: ['$stockAvailable', '$lowStockThreshold'] },
            },
        },
        { $sort: { stockAvailable: 1 } },
    ]);
};

/**
 * Get product statistics
 * @returns {Promise<Object>} Product statistics
 */
const getProductStats = async () => {
    const [stats, categoryStats] = await Promise.all([
        Product.aggregate([
            {
                $addFields: {
                    stockAvailable: { $subtract: ['$stockTotal', '$stockReserved'] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
                    totalStock: { $sum: '$stockTotal' },
                    totalReserved: { $sum: '$stockReserved' },
                    totalAvailable: { $sum: '$stockAvailable' },
                    avgPrice: { $avg: '$basePrice' },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        '$isActive',
                                        { $lte: ['$stockAvailable', '$lowStockThreshold'] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    outOfStockCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: ['$isActive', { $lte: ['$stockAvailable', 0] }],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$basePrice' },
                },
            },
        ]),
    ]);

    return {
        ...(stats[0] || {}),
        byCategory: categoryStats.reduce((acc, item) => {
            acc[item._id] = { count: item.count, avgPrice: item.avgPrice };
            return acc;
        }, {}),
    };
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    hardDeleteProduct,
    updateStock,
    calculatePrice,
    getProductsByCategory,
    getFeaturedProducts,
    getLowStockProducts,
    getProductStats,
};
