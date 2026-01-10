/**
 * Orders Service
 * ===============
 * Business logic for order operations
 * 
 * Order Status Flow:
 * PENDING_PAYMENT -> PAID -> ACCEPTED -> IN_TRANSIT -> DELIVERED
 * 
 * @module features/orders/ordersservice
 */

const Order = require('./Order');
const Cart = require('../cart/Cart');
const Product = require('../products/Product');
const User = require('../auth/User');
const inventoryService = require('../inventory/inventoryservice');

/**
 * Create order from cart
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} orderData - Order details (addresses, notes, payment method)
 * @returns {Promise<Object>} Created order
 */
const createOrder = async (userId, orderData) => {
    const { shippingAddress, billingAddress, customerNotes, paymentMethod } = orderData;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.street) {
        const error = new Error('Complete shipping address is required');
        error.statusCode = 400;
        throw error;
    }

    // Validate payment method
    if (!paymentMethod || !['upi', 'bank_transfer'].includes(paymentMethod)) {
        const error = new Error('Valid payment method is required (upi or bank_transfer)');
        error.statusCode = 400;
        throw error;
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        const error = new Error('Cart is empty');
        error.statusCode = 400;
        throw error;
    }

    // Get user for snapshot
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Validate stock and build order items
    const orderItems = [];
    let subtotal = 0;
    let totalGst = 0;

    for (const cartItem of cart.items) {
        const product = cartItem.product;

        if (!product || !product.isActive) {
            const error = new Error(`Product "${cartItem.product?.name || 'Unknown'}" is no longer available`);
            error.statusCode = 400;
            throw error;
        }

        // Check stock availability
        const stockAvailable = product.stockTotal - product.stockReserved;
        if (stockAvailable < cartItem.quantity) {
            const error = new Error(
                `Insufficient stock for "${product.name}". Available: ${stockAvailable} ${product.unit}`
            );
            error.statusCode = 400;
            throw error;
        }

        // Validate MOQ
        if (cartItem.quantity < product.minOrderQuantity) {
            const error = new Error(
                `Minimum order quantity for "${product.name}" is ${product.minOrderQuantity} ${product.unit}`
            );
            error.statusCode = 400;
            throw error;
        }

        // Calculate pricing
        const priceData = product.calculatePrice(cartItem.quantity);

        orderItems.push({
            product: product._id,
            productSnapshot: {
                name: product.name,
                category: product.category,
                brand: product.brand,
                unit: product.unit,
                hsnCode: product.hsnCode,
                gstRate: product.gstRate,
            },
            quantity: cartItem.quantity,
            pricePerUnit: priceData.pricePerUnit,
            discountPercent: priceData.discountPercent,
            subtotal: priceData.subtotal,
            gstAmount: priceData.gstAmount,
            total: priceData.total,
        });

        subtotal += priceData.subtotal;
        totalGst += priceData.gstAmount;
    }

    // Calculate GST split (CGST + SGST for intra-state, IGST for inter-state)
    // For Maharashtra to Maharashtra, use CGST + SGST
    const isIntraState = shippingAddress.state?.toLowerCase() === 'maharashtra';

    const cgst = isIntraState ? totalGst / 2 : 0;
    const sgst = isIntraState ? totalGst / 2 : 0;
    const igst = isIntraState ? 0 : totalGst;

    // Calculate total
    const totalBeforeRound = subtotal + totalGst;
    const roundedTotal = Math.round(totalBeforeRound);
    const roundOff = Math.round((roundedTotal - totalBeforeRound) * 100) / 100;

    // Create order with pending_payment status
    const order = await Order.create({
        user: userId,
        customerSnapshot: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            businessName: user.businessName,
            gstin: user.gstin,
        },
        items: orderItems,
        subtotal: Math.round(subtotal * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        roundOff,
        totalAmount: roundedTotal,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        customerNotes,
        status: 'pending_payment',
        paymentStatus: 'pending',
    });

    // Reserve product stock (Inventory-First: reserve instead of deducting)
    for (const item of orderItems) {
        await inventoryService.reserveStock(
            item.product,
            item.quantity,
            order._id,
            userId
        );
    }

    // Clear cart
    cart.clearCart();
    await cart.save();

    return order;
};

/**
 * Mark payment as submitted by retailer
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} paymentData - Payment details (method, reference)
 * @returns {Promise<Object>} Updated order
 */
const markPaymentSubmitted = async (orderId, userId, paymentData = {}) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Check ownership
    if (order.user.toString() !== userId.toString()) {
        const error = new Error('Not authorized to update this order');
        error.statusCode = 403;
        throw error;
    }

    // Check if order is in pending_payment status
    if (order.status !== 'pending_payment') {
        const error = new Error('Payment can only be submitted for pending orders');
        error.statusCode = 400;
        throw error;
    }

    // Mark payment as submitted
    order.markPaymentSubmitted(
        paymentData.paymentMethod || order.paymentMethod,
        paymentData.reference
    );

    await order.save();

    return order;
};

/**
 * Confirm payment received (Admin/Employee)
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} staffId - Admin/Employee user ID
 * @returns {Promise<Object>} Updated order
 */
const confirmPayment = async (orderId, staffId) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if payment can be confirmed
    if (order.paymentStatus !== 'submitted') {
        const error = new Error('Payment has not been submitted or is already confirmed');
        error.statusCode = 400;
        throw error;
    }

    if (order.status !== 'pending_payment') {
        const error = new Error('Order is not in pending payment status');
        error.statusCode = 400;
        throw error;
    }

    // Confirm payment (this also updates order status to 'paid')
    order.confirmPayment(staffId);

    // Generate invoice
    await order.generateInvoiceNumber();

    await order.save();

    return order;
};

/**
 * Assign employee to order (Admin/Employee)
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} employeeId - Employee user ID to assign
 * @param {string} assignedBy - Admin/Employee who assigned
 * @returns {Promise<Object>} Updated order
 */
const assignEmployee = async (orderId, employeeId, assignedBy) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Verify employee exists and has correct role
    const employee = await User.findById(employeeId);
    if (!employee || !['admin', 'employee'].includes(employee.role)) {
        const error = new Error('Invalid employee');
        error.statusCode = 400;
        throw error;
    }

    order.assignedEmployee = employeeId;
    order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Assigned to ${employee.name}`,
        updatedBy: assignedBy,
    });

    await order.save();

    return order;
};

/**
 * Get orders assigned to an employee
 * @param {string} employeeId - Employee's MongoDB ObjectId
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Orders and pagination
 */
const getEmployeeOrders = async (employeeId, queryParams) => {
    const { page = 1, limit = 10, status } = queryParams;

    const query = { assignedEmployee: employeeId };

    if (status) {
        query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
        Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email phone'),
        Order.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get orders with pending payment confirmation
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Orders and pagination
 */
const getPendingPaymentOrders = async (queryParams) => {
    const { page = 1, limit = 10 } = queryParams;

    const query = {
        status: 'pending_payment',
        paymentStatus: 'submitted',
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
        Order.find(query)
            .sort({ paymentSubmittedAt: 1 }) // Oldest submitted first
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email phone'),
        Order.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get all orders with filtering (admin/employee)
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Orders and pagination
 */
const getAllOrders = async (queryParams) => {
    const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        assignedEmployee,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = queryParams;

    const query = {};

    if (status) {
        query.status = status;
    }

    if (paymentStatus) {
        query.paymentStatus = paymentStatus;
    }

    if (assignedEmployee) {
        query.assignedEmployee = assignedEmployee;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
            { 'customerSnapshot.phone': { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
        Order.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email phone')
            .populate('assignedEmployee', 'name'),
        Order.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get orders for a specific user
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Orders and pagination
 */
const getUserOrders = async (userId, queryParams) => {
    const { page = 1, limit = 10, status } = queryParams;

    const query = { user: userId };

    if (status) {
        query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
        Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Order.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get order by ID
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} userId - User's MongoDB ObjectId (for authorization)
 * @param {string} userRole - User's role
 * @returns {Promise<Object>} Order
 */
const getOrderById = async (orderId, userId, userRole) => {
    const order = await Order.findById(orderId)
        .populate('user', 'name email phone')
        .populate('assignedEmployee', 'name')
        .populate('paymentConfirmedBy', 'name')
        .populate('statusHistory.updatedBy', 'name');

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Check authorization - only owner, admin, or employee can view
    const isOwner = order.user._id.toString() === userId.toString();
    const hasAdminAccess = ['admin', 'employee'].includes(userRole);

    if (!isOwner && !hasAdminAccess) {
        const error = new Error('Not authorized to view this order');
        error.statusCode = 403;
        throw error;
    }

    return order;
};

/**
 * Update order status with strict sequence enforcement
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} newStatus - New status
 * @param {string} note - Status change note
 * @param {string} updatedBy - User ID making the update
 * @returns {Promise<Object>} Updated order
 */
const updateOrderStatus = async (orderId, newStatus, note, updatedBy) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Validate status transition using model's static method
    if (!Order.isValidTransition(order.status, newStatus)) {
        const error = new Error(
            `Cannot change status from '${order.status}' to '${newStatus}'`
        );
        error.statusCode = 400;
        throw error;
    }

    // Handle specific status transitions
    if (newStatus === 'cancelled') {
        // Release reserved stock
        for (const item of order.items) {
            await inventoryService.releaseStock(
                item.product,
                item.quantity,
                orderId,
                updatedBy,
                note || 'Order cancelled'
            );
        }
        order.cancellationReason = note;
    }

    if (newStatus === 'accepted') {
        // Deduct reserved stock (Inventory-First)
        for (const item of order.items) {
            await inventoryService.deductStock(
                item.product,
                item.quantity,
                orderId,
                updatedBy
            );
        }
    }

    order.updateStatus(newStatus, note, updatedBy);
    await order.save();

    return order;
};

/**
 * Cancel order (by customer or staff)
 * @param {string} orderId - Order's MongoDB ObjectId
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} reason - Cancellation reason
 * @param {string} userRole - User's role
 * @returns {Promise<Object>} Cancelled order
 */
const cancelOrder = async (orderId, userId, reason, userRole = 'retailer') => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Check authorization
    const isOwner = order.user.toString() === userId.toString();
    const isStaff = ['admin', 'employee'].includes(userRole);

    if (!isOwner && !isStaff) {
        const error = new Error('Not authorized to cancel this order');
        error.statusCode = 403;
        throw error;
    }

    // Check if cancellable
    if (!order.canBeCancelled) {
        const error = new Error('Order cannot be cancelled at this stage');
        error.statusCode = 400;
        throw error;
    }

    // Release reserved stock (Inventory-First)
    for (const item of order.items) {
        await inventoryService.releaseStock(
            item.product,
            item.quantity,
            orderId,
            userId,
            reason || 'Order cancelled'
        );
    }

    order.updateStatus('cancelled', reason, userId);
    order.cancellationReason = reason;
    await order.save();

    return order;
};

/**
 * Get order statistics
 * @param {Object} dateRange - Optional date range
 * @returns {Promise<Object>} Order statistics
 */
const getOrderStats = async (dateRange = {}) => {
    const { startDate, endDate } = dateRange;

    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const [stats, statusBreakdown, dailyOrders] = await Promise.all([
        Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    avgOrderValue: { $avg: '$totalAmount' },
                    totalGstCollected: { $sum: '$totalGst' },
                },
            },
        ]),

        Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                },
            },
        ]),

        Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: -1 } },
            { $limit: 30 },
        ]),
    ]);

    return {
        summary: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalGstCollected: 0 },
        byStatus: statusBreakdown.reduce((acc, item) => {
            acc[item._id] = { count: item.count, revenue: item.revenue };
            return acc;
        }, {}),
        dailyTrend: dailyOrders,
    };
};

/**
 * Get invoice data for an order
 * @param {string} orderId - Order's MongoDB ObjectId
 * @returns {Promise<Object>} Invoice data
 */
const getInvoiceData = async (orderId) => {
    const order = await Order.findById(orderId);

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Generate invoice number if not exists
    if (!order.invoiceNumber) {
        await order.generateInvoiceNumber();
        await order.save();
    }

    return order.getInvoiceData();
};

module.exports = {
    createOrder,
    markPaymentSubmitted,
    confirmPayment,
    assignEmployee,
    getEmployeeOrders,
    getPendingPaymentOrders,
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getOrderStats,
    getInvoiceData,
};
