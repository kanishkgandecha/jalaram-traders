/**
 * Notifications Routes
 * ====================
 * API routes for notifications
 * 
 * @module features/notifications/notificationsroutes
 */

const express = require('express');
const router = express.Router();
const notificationsController = require('./notificationscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');

// All routes require authentication
router.use(protect);

// GET /api/v1/notifications - Get user notifications
router.get('/', notificationsController.getNotifications);

// GET /api/v1/notifications/unread-count - Get unread count
router.get('/unread-count', notificationsController.getUnreadCount);

// PUT /api/v1/notifications/read-all - Mark all as read
router.put('/read-all', notificationsController.markAllAsRead);

// PUT /api/v1/notifications/:id/read - Mark single notification as read
router.put('/:id/read', notificationsController.markAsRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
