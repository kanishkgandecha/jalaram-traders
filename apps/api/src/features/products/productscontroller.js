/**
 * Products Controller
 * =====================
 * Request handlers for product endpoints
 * Integrates role-based pricing service
 * 
 * @module features/products/productscontroller
 */

const productsService = require('./productsservice');
const pricingService = require('./pricingservice');
const { sendSuccess, sendError, sendPaginated } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get all products with filtering
 * @route   GET /api/v1/products
 * @access  Public
 */
const getAllProducts = async (req, res) => {
    try {
        const { products, pagination } = await productsService.getAllProducts(req.query);

        // Filter products based on user role if authenticated
        const userRole = req.user?.role || 'guest';
        const filteredProducts = products
            .map((product) => pricingService.filterProductForRole(product, userRole))
            .filter((product) => product !== null); // Remove null products (e.g., wholesale-only for farmers)

        sendPaginated(res, filteredProducts, pagination);
    } catch (error) {
        console.error('Get products error:', error);
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

        // Filter product based on user role
        const userRole = req.user?.role || 'guest';
        const filteredProduct = pricingService.filterProductForRole(product, userRole);

        if (!filteredProduct) {
            return sendError(res, 404, 'Product not available for your account type');
        }

        sendSuccess(res, 200, 'Product retrieved successfully', { product: filteredProduct });
    } catch (error) {
        console.error('Get product error:', error);
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

        // Filter product based on user role
        const userRole = req.user?.role || 'guest';
        const filteredProduct = pricingService.filterProductForRole(product, userRole);

        if (!filteredProduct) {
            return sendError(res, 404, 'Product not available for your account type');
        }

        sendSuccess(res, 200, 'Product retrieved successfully', { product: filteredProduct });
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
        await productsService.deleteProduct(req.params.id);
        sendSuccess(res, 200, 'Product deleted successfully');
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

        if (quantity === undefined) {
            return sendError(res, 400, 'Quantity is required');
        }

        const product = await productsService.updateStock(req.params.id, quantity);
        sendSuccess(res, 200, 'Stock updated successfully', { product });
    } catch (error) {
        console.error('Update stock error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Calculate price with bulk discounts (role-based)
 * @route   POST /api/v1/products/:id/calculate-price
 * @access  Public
 */
const calculatePrice = async (req, res) => {
    try {
        const { quantity } = req.body;
        const userRole = req.user?.role || 'guest';

        if (!quantity || quantity < 1) {
            return sendError(res, 400, 'Valid quantity is required');
        }

        const product = await productsService.getProductById(req.params.id);

        // Validate quantity based on role
        const validation = pricingService.validateOrderQuantity(product, userRole, quantity);
        if (!validation.valid) {
            return sendError(res, 400, validation.message);
        }

        // Get role-based pricing
        const pricing = pricingService.getPriceForRole(product, userRole, quantity);

        if (pricing.available === false) {
            return sendError(res, 403, pricing.message || 'Product not available for your account type');
        }

        sendSuccess(res, 200, 'Price calculated successfully', {
            product: {
                id: product._id,
                name: product.name,
                unit: product.unit,
            },
            pricing,
        });
    } catch (error) {
        console.error('Calculate price error:', error);
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
        const { category } = req.params;
        const { limit = 10 } = req.query;

        const products = await productsService.getProductsByCategory(category, parseInt(limit));

        // Filter products based on user role
        const userRole = req.user?.role || 'guest';
        const filteredProducts = products
            .map((product) => pricingService.filterProductForRole(product, userRole))
            .filter((product) => product !== null);

        sendSuccess(res, 200, 'Products retrieved successfully', {
            products: filteredProducts,
            count: filteredProducts.length,
        });
    } catch (error) {
        console.error('Get products by category error:', error);
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
        const { limit = 8 } = req.query;

        const products = await productsService.getFeaturedProducts(parseInt(limit));

        // Filter products based on user role
        const userRole = req.user?.role || 'guest';
        const filteredProducts = products
            .map((product) => pricingService.filterProductForRole(product, userRole))
            .filter((product) => product !== null);

        sendSuccess(res, 200, 'Featured products retrieved successfully', {
            products: filteredProducts,
            count: filteredProducts.length,
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/v1/products/admin/low-stock
 * @access  Private (Admin, Employee)
 */
const getLowStockProducts = async (req, res) => {
    try {
        const products = await productsService.getLowStockProducts();
        sendSuccess(res, 200, 'Low stock products retrieved successfully', {
            products,
            count: products.length,
        });
    } catch (error) {
        console.error('Get low stock products error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get product statistics
 * @route   GET /api/v1/products/admin/stats
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
    getProductsByCategory,
    getFeaturedProducts,
    getLowStockProducts,
    getProductStats,
};
