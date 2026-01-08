/**
 * Orders Controller
 * ==================
 * Request handlers for order endpoints
 * 
 * @module features/orders/orderscontroller
 */

const ordersService = require('./ordersservice');
const { sendSuccess, sendError, sendPaginated } = require('../../shared/utils/responsehelper');

/**
 * @desc    Create new order from cart
 * @route   POST /api/v1/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
    try {
        const order = await ordersService.createOrder(req.user._id, req.body);

        sendSuccess(res, 201, 'Order created successfully', { order });
    } catch (error) {
        console.error('Create order error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get all orders (admin/employee)
 * @route   GET /api/v1/orders/admin/all
 * @access  Private (Admin, Employee)
 */
const getAllOrders = async (req, res) => {
    try {
        const { orders, pagination } = await ordersService.getAllOrders(req.query);

        sendPaginated(
            res,
            orders,
            pagination.page,
            pagination.limit,
            pagination.total,
            'Orders retrieved successfully'
        );
    } catch (error) {
        console.error('Get all orders error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get current user's orders
 * @route   GET /api/v1/orders
 * @access  Private
 */
const getMyOrders = async (req, res) => {
    try {
        const { orders, pagination } = await ordersService.getUserOrders(req.user._id, req.query);

        sendPaginated(
            res,
            orders,
            pagination.page,
            pagination.limit,
            pagination.total,
            'Orders retrieved successfully'
        );
    } catch (error) {
        console.error('Get my orders error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
    try {
        const order = await ordersService.getOrderById(
            req.params.id,
            req.user._id,
            req.user.role
        );

        sendSuccess(res, 200, 'Order retrieved successfully', { order });
    } catch (error) {
        console.error('Get order by ID error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/v1/orders/:id/status
 * @access  Private (Admin, Employee)
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;

        if (!status) {
            return sendError(res, 400, 'Status is required');
        }

        const order = await ordersService.updateOrderStatus(
            req.params.id,
            status,
            note,
            req.user._id
        );

        sendSuccess(res, 200, 'Order status updated successfully', { order });
    } catch (error) {
        console.error('Update order status error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Cancel order
 * @route   POST /api/v1/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await ordersService.cancelOrder(req.params.id, req.user._id, reason);

        sendSuccess(res, 200, 'Order cancelled successfully', { order });
    } catch (error) {
        console.error('Cancel order error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/v1/orders/admin/stats
 * @access  Private (Admin, Employee)
 */
const getOrderStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await ordersService.getOrderStats({ startDate, endDate });

        sendSuccess(res, 200, 'Order statistics retrieved successfully', { stats });
    } catch (error) {
        console.error('Get order stats error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get invoice data for order
 * @route   GET /api/v1/orders/:id/invoice
 * @access  Private
 */
const getInvoiceData = async (req, res) => {
    try {
        // First check authorization
        await ordersService.getOrderById(req.params.id, req.user._id, req.user.role);

        const invoiceData = await ordersService.getInvoiceData(req.params.id);

        sendSuccess(res, 200, 'Invoice data retrieved successfully', { invoice: invoiceData });
    } catch (error) {
        console.error('Get invoice data error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getOrderStats,
    getInvoiceData,
};
