/**
 * Products Routes
 * ================
 * Route definitions for product endpoints
 * 
 * @module features/products/productsroutes
 */

const express = require('express');
const router = express.Router();
const productsController = require('./productscontroller');
const { protect, optionalAuth } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// ==========================================
// PUBLIC ROUTES (specific paths first)
// ==========================================

/**
 * @route   GET /api/v1/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', productsController.getFeaturedProducts);

/**
 * @route   GET /api/v1/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:category', productsController.getProductsByCategory);

/**
 * @route   GET /api/v1/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', productsController.getProductBySlug);

// ==========================================
// PROTECTED ROUTES (Admin/Employee) - BEFORE generic /:id
// ==========================================

/**
 * @route   GET /api/v1/products/admin/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin, Employee)
 */
router.get(
    '/admin/low-stock',
    protect,
    authorize('admin', 'employee'),
    productsController.getLowStockProducts
);

/**
 * @route   GET /api/v1/products/admin/stats
 * @desc    Get product statistics
 * @access  Private (Admin, Employee)
 */
router.get(
    '/admin/stats',
    protect,
    authorize('admin', 'employee'),
    productsController.getProductStats
);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (Admin, Employee)
 */
router.post(
    '/',
    protect,
    authorize('admin', 'employee'),
    productsController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin, Employee)
 */
router.put(
    '/:id',
    protect,
    authorize('admin', 'employee'),
    productsController.updateProduct
);

/**
 * @route   PATCH /api/v1/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin, Employee)
 */
router.patch(
    '/:id/stock',
    protect,
    authorize('admin', 'employee'),
    productsController.updateStock
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Admin)
 */
router.delete(
    '/:id',
    protect,
    authorize('admin'),
    productsController.deleteProduct
);

/**
 * @route   POST /api/v1/products/:id/calculate-price
 * @desc    Calculate price with bulk discounts
 * @access  Public
 */
router.post('/:id/calculate-price', productsController.calculatePrice);

// ==========================================
// GENERIC PUBLIC ROUTES (must be LAST)
// ==========================================

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filtering
 * @access  Public
 */
router.get('/', productsController.getAllProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productsController.getProductById);

module.exports = router;

