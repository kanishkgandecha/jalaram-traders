/**
 * Orders Routes
 * ==============
 * Route definitions for order endpoints
 * 
 * Order Status Flow:
 * PENDING_PAYMENT -> PAID -> ACCEPTED -> IN_TRANSIT -> DELIVERED
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

/**
 * @route   GET /api/v1/orders/admin/pending-payment
 * @desc    Get orders with pending payment confirmation
 * @access  Private (Admin, Employee)
 */
router.get(
    '/admin/pending-payment',
    authorize('admin', 'employee'),
    ordersController.getPendingPaymentOrders
);

/**
 * @route   GET /api/v1/orders/employee/assigned
 * @desc    Get orders assigned to current employee
 * @access  Private (Admin, Employee)
 */
router.get(
    '/employee/assigned',
    authorize('admin', 'employee'),
    ordersController.getEmployeeOrders
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
 * @access  Private (Retailers)
 */
router.post('/', authorize('retailer'), ordersController.createOrder);

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
 * @route   POST /api/v1/orders/:id/payment-submitted
 * @desc    Mark payment as submitted by retailer
 * @access  Private (Order Owner)
 */
router.post('/:id/payment-submitted', ordersController.markPaymentSubmitted);

/**
 * @route   POST /api/v1/orders/:id/confirm-payment
 * @desc    Confirm payment received
 * @access  Private (Admin, Employee)
 */
router.post(
    '/:id/confirm-payment',
    authorize('admin', 'employee'),
    ordersController.confirmPayment
);

/**
 * @route   POST /api/v1/orders/:id/assign-employee
 * @desc    Assign employee to order
 * @access  Private (Admin, Employee)
 */
router.post(
    '/:id/assign-employee',
    authorize('admin', 'employee'),
    ordersController.assignEmployee
);

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
