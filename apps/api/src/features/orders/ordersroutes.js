/**
 * Orders Routes
 * ==============
 * Route definitions for order endpoints
 * 
 * @module features/orders/ordersroutes
 */

const express = require('express');
const router = express.Router();
const ordersController = require('./orderscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// All routes require authentication
router.use(protect);

// ==========================================
// ADMIN/EMPLOYEE ROUTES (place before :id routes)
// ==========================================

/**
 * @route   GET /api/v1/orders/admin/stats
 * @desc    Get order statistics
 * @access  Private (Admin, Employee)
 */
router.get(
    '/admin/stats',
    authorize('admin', 'employee'),
    ordersController.getOrderStats
);

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Get all orders (admin view)
 * @access  Private (Admin, Employee)
 */
router.get(
    '/admin/all',
    authorize('admin', 'employee'),
    ordersController.getAllOrders
);

// ==========================================
// USER ROUTES
// ==========================================

/**
 * @route   GET /api/v1/orders
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/', ordersController.getMyOrders);

/**
 * @route   POST /api/v1/orders
 * @desc    Create new order from cart
 * @access  Private
 */
router.post('/', ordersController.createOrder);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', ordersController.getOrderById);

/**
 * @route   GET /api/v1/orders/:id/invoice
 * @desc    Get invoice data for order
 * @access  Private
 */
router.get('/:id/invoice', ordersController.getInvoiceData);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post('/:id/cancel', ordersController.cancelOrder);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin, Employee)
 */
router.patch(
    '/:id/status',
    authorize('admin', 'employee'),
    ordersController.updateOrderStatus
);

module.exports = router;
