/**
 * Notification Model
 * ===================
 * MongoDB schema for user notifications
 * 
 * @module features/notifications/Notification
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        // User who receives the notification
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Notification type for icons/styling
        type: {
            type: String,
            enum: ['order', 'product', 'payment', 'system', 'alert'],
            default: 'system',
        },

        title: {
            type: String,
            required: true,
            maxlength: 100,
        },

        message: {
            type: String,
            required: true,
            maxlength: 500,
        },

        // Link to navigate to when notification is clicked
        link: {
            type: String,
        },

        // Reference to related entity
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        relatedModel: {
            type: String,
            enum: ['Order', 'Product', 'User', null],
        },

        // Read status
        read: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// TTL index to auto-delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static: Create notification for a user
notificationSchema.statics.createForUser = async function (userId, data) {
    return await this.create({
        user: userId,
        ...data,
    });
};

// Static: Create notification for multiple users
notificationSchema.statics.createForUsers = async function (userIds, data) {
    const notifications = userIds.map((userId) => ({
        user: userId,
        ...data,
    }));
    return await this.insertMany(notifications);
};

// Static: Create notification for all users with a role
notificationSchema.statics.createForRole = async function (role, data) {
    const User = mongoose.model('User');
    const users = await User.find({ role, isActive: true }).select('_id');
    const userIds = users.map((u) => u._id);
    return await this.createForUsers(userIds, data);
};

module.exports = mongoose.model('Notification', notificationSchema);
