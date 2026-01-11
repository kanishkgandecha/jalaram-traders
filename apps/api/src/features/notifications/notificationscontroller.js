/**
 * Notifications Controller
 * ========================
 * HTTP handlers for notifications endpoints
 * 
 * @module features/notifications/notificationscontroller
 */

const notificationsService = require('./notificationsservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const result = await notificationsService.getNotifications(req.user._id, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true',
        });

        sendSuccess(res, 200, 'Notifications retrieved successfully', result);
    } catch (error) {
        console.error('Get notifications error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get unread count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await notificationsService.getUnreadCount(req.user._id);
        sendSuccess(res, 200, 'Unread count retrieved', { unreadCount: count });
    } catch (error) {
        console.error('Get unread count error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await notificationsService.markAsRead(req.params.id, req.user._id);
        sendSuccess(res, 200, 'Notification marked as read', { notification });
    } catch (error) {
        console.error('Mark as read error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
    try {
        const result = await notificationsService.markAllAsRead(req.user._id);
        sendSuccess(res, 200, 'All notifications marked as read', result);
    } catch (error) {
        console.error('Mark all as read error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
    try {
        await notificationsService.deleteNotification(req.params.id, req.user._id);
        sendSuccess(res, 200, 'Notification deleted');
    } catch (error) {
        console.error('Delete notification error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
