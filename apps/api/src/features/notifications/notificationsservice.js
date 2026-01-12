/**
 * Notifications Service
 * =====================
 * Business logic for notifications
 * 
 * @module features/notifications/notificationsservice
 */

const Notification = require('./Notification');

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Notifications with pagination
 */
const getNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
    const query = { user: userId };
    if (unreadOnly) {
        query.read = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ user: userId, read: false }),
    ]);

    return {
        notifications,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get unread count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ user: userId, read: false });
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated notification
 */
const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
    );

    if (!notification) {
        const error = new Error('Notification not found');
        error.statusCode = 404;
        throw error;
    }

    return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const markAllAsRead = async (userId) => {
    const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
    );

    return { modifiedCount: result.modifiedCount };
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 */
const deleteNotification = async (notificationId, userId) => {
    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
    });

    if (!notification) {
        const error = new Error('Notification not found');
        error.statusCode = 404;
        throw error;
    }

    return notification;
};

/**
 * Create a notification
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (data) => {
    return await Notification.create(data);
};

/**
 * Create notifications for order events
 * @param {string} type - Event type
 * @param {Object} order - Order object
 * @param {Object} options - Additional options
 */
const notifyOrderEvent = async (type, order, options = {}) => {
    const notifications = [];

    switch (type) {
        case 'order_placed':
            // Notify admins and employees about new order
            notifications.push({
                role: ['admin', 'employee'],
                data: {
                    type: 'order',
                    title: 'New Order Received',
                    message: `Order #${order.orderNumber} placed by ${order.customerSnapshot?.name || 'Customer'}`,
                    link: `/dashboard/admin/orders/${order._id}`,
                    relatedId: order._id,
                    relatedModel: 'Order',
                },
            });
            break;

        case 'payment_confirmed':
            // Notify customer
            notifications.push({
                userId: order.user,
                data: {
                    type: 'payment',
                    title: 'Payment Confirmed',
                    message: `Payment for Order #${order.orderNumber} has been confirmed`,
                    link: `/dashboard/retailer/orders/${order._id}`,
                    relatedId: order._id,
                    relatedModel: 'Order',
                },
            });
            break;

        case 'order_accepted':
            // Notify customer
            notifications.push({
                userId: order.user,
                data: {
                    type: 'order',
                    title: 'Order Accepted',
                    message: `Your Order #${order.orderNumber} has been accepted and is being processed`,
                    link: `/dashboard/retailer/orders/${order._id}`,
                    relatedId: order._id,
                    relatedModel: 'Order',
                },
            });
            break;

        case 'order_shipped':
            // Notify customer
            notifications.push({
                userId: order.user,
                data: {
                    type: 'order',
                    title: 'Order Shipped',
                    message: `Your Order #${order.orderNumber} is on the way!`,
                    link: `/dashboard/retailer/orders/${order._id}`,
                    relatedId: order._id,
                    relatedModel: 'Order',
                },
            });
            break;

        case 'order_delivered':
            // Notify customer
            notifications.push({
                userId: order.user,
                data: {
                    type: 'order',
                    title: 'Order Delivered',
                    message: `Your Order #${order.orderNumber} has been delivered`,
                    link: `/dashboard/retailer/orders/${order._id}`,
                    relatedId: order._id,
                    relatedModel: 'Order',
                },
            });
            break;

        case 'order_cancelled':
            // Notify customer about cancellation with clear indication of who cancelled
            let cancelMessage;
            if (options.cancelledBy === 'customer') {
                // Customer cancelled their own order
                cancelMessage = options.reason
                    ? `Your Order #${order.orderNumber} has been cancelled. Reason: ${options.reason}`
                    : `Your Order #${order.orderNumber} has been cancelled`;
            } else {
                // Staff/Admin cancelled the order
                cancelMessage = options.reason
                    ? `Your Order #${order.orderNumber} has been cancelled by the seller. Reason: ${options.reason}`
                    : `Your Order #${order.orderNumber} has been cancelled by the seller`;
            }
            notifications.push({
                userId: order.user,
                data: {
                    type: 'alert',
                    title: 'Order Cancelled',
                    message: cancelMessage,
                    link: `/dashboard/retailer/orders/${order._id}`,
                    relatedId: order._id,
                    relatedModel: 'Order',
                },
            });
            // Also notify admins if cancelled by customer
            if (options.cancelledBy === 'customer') {
                notifications.push({
                    role: ['admin', 'employee'],
                    data: {
                        type: 'alert',
                        title: 'Order Cancelled',
                        message: `Order #${order.orderNumber} was cancelled by the customer`,
                        link: `/dashboard/admin/orders/${order._id}`,
                        relatedId: order._id,
                        relatedModel: 'Order',
                    },
                });
            }
            break;
    }

    // Create all notifications
    for (const notif of notifications) {
        if (notif.role) {
            await Notification.createForRole(notif.role[0], notif.data);
        } else if (notif.userId) {
            await Notification.createForUser(notif.userId, notif.data);
        }
    }
};

/**
 * Notify about low stock
 * @param {Object} product - Product object
 */
const notifyLowStock = async (product) => {
    await Notification.createForRole('admin', {
        type: 'alert',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is running low (${product.stockAvailable} units left)`,
        link: `/dashboard/admin/inventory`,
        relatedId: product._id,
        relatedModel: 'Product',
    });
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    notifyOrderEvent,
    notifyLowStock,
};
