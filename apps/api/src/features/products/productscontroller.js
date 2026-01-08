/**
 * Products Controller
 * ====================
 * Request handlers for product endpoints
 * 
 * @module features/products/productscontroller
 */

const productsService = require('./productsservice');
const { sendSuccess, sendError, sendPaginated } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get all products
 * @route   GET /api/v1/products
 * @access  Public
 */
const getAllProducts = async (req, res) => {
    try {
        const { products, pagination } = await productsService.getAllProducts(req.query);

        sendPaginated(
            res,
            products,
            pagination.page,
            pagination.limit,
            pagination.total,
            'Products retrieved successfully'
        );
    } catch (error) {
        console.error('Get all products error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
    try {
        const product = await productsService.getProductById(req.params.id);

        sendSuccess(res, 200, 'Product retrieved successfully', { product });
    } catch (error) {
        console.error('Get product by ID error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get product by slug
 * @route   GET /api/v1/products/slug/:slug
 * @access  Public
 */
const getProductBySlug = async (req, res) => {
    try {
        const product = await productsService.getProductBySlug(req.params.slug);

        sendSuccess(res, 200, 'Product retrieved successfully', { product });
    } catch (error) {
        console.error('Get product by slug error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Private (Admin, Employee)
 */
const createProduct = async (req, res) => {
    try {
        const product = await productsService.createProduct(req.body);

        sendSuccess(res, 201, 'Product created successfully', { product });
    } catch (error) {
        console.error('Create product error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update product
 * @route   PUT /api/v1/products/:id
 * @access  Private (Admin, Employee)
 */
const updateProduct = async (req, res) => {
    try {
        const product = await productsService.updateProduct(req.params.id, req.body);

        sendSuccess(res, 200, 'Product updated successfully', { product });
    } catch (error) {
        console.error('Update product error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Admin)
 */
const deleteProduct = async (req, res) => {
    try {
        const product = await productsService.deleteProduct(req.params.id);

        sendSuccess(res, 200, 'Product deleted successfully', { product });
    } catch (error) {
        console.error('Delete product error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update product stock
 * @route   PATCH /api/v1/products/:id/stock
 * @access  Private (Admin, Employee)
 */
const updateStock = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (typeof quantity !== 'number') {
            return sendError(res, 400, 'Please provide quantity as a number');
        }

        const product = await productsService.updateStock(req.params.id, quantity);

        sendSuccess(res, 200, 'Stock updated successfully', { product });
    } catch (error) {
        console.error('Update stock error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Calculate price for product with quantity
 * @route   POST /api/v1/products/:id/calculate-price
 * @access  Public
 */
const calculatePrice = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return sendError(res, 400, 'Please provide a valid quantity');
        }

        const priceData = await productsService.calculatePrice(req.params.id, quantity);

        sendSuccess(res, 200, 'Price calculated successfully', priceData);
    } catch (error) {
        console.error('Calculate price error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get featured products
 * @route   GET /api/v1/products/featured
 * @access  Public
 */
const getFeaturedProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const products = await productsService.getFeaturedProducts(limit);

        sendSuccess(res, 200, 'Featured products retrieved successfully', { products });
    } catch (error) {
        console.error('Get featured products error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get products by category
 * @route   GET /api/v1/products/category/:category
 * @access  Public
 */
const getProductsByCategory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await productsService.getProductsByCategory(req.params.category, limit);

        sendSuccess(res, 200, 'Products retrieved successfully', { products });
    } catch (error) {
        console.error('Get products by category error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/v1/products/low-stock
 * @access  Private (Admin, Employee)
 */
const getLowStockProducts = async (req, res) => {
    try {
        const products = await productsService.getLowStockProducts();

        sendSuccess(res, 200, 'Low stock products retrieved successfully', { products });
    } catch (error) {
        console.error('Get low stock products error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get product statistics
 * @route   GET /api/v1/products/stats
 * @access  Private (Admin, Employee)
 */
const getProductStats = async (req, res) => {
    try {
        const stats = await productsService.getProductStats();

        sendSuccess(res, 200, 'Product statistics retrieved successfully', { stats });
    } catch (error) {
        console.error('Get product stats error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    calculatePrice,
    getFeaturedProducts,
    getProductsByCategory,
    getLowStockProducts,
    getProductStats,
};
