/**
 * Profile Service
 * =================
 * Business logic for user profile operations
 * 
 * @module features/profile/profileservice
 */

const fs = require('fs');
const path = require('path');
const User = require('../auth/User');

/**
 * Get user profile by ID
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} User profile
 */
const getProfile = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Update user profile
 * Only allows updating safe fields (name, phone, address)
 * Prevents updating role, email (for Google users), isActive, etc.
 * 
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateProfile = async (userId, updateData) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Fields that are NEVER allowed to be updated via profile
    const restrictedFields = [
        'password',
        'role',
        'isActive',
        'creditLimit',
        'outstandingBalance',
        'authProvider',
        'lastLogin',
        'passwordChangedAt',
    ];

    // Remove restricted fields from update data
    restrictedFields.forEach((field) => delete updateData[field]);

    // Email is read-only for Google users AND all verified users
    // For simplicity, we make email always read-only
    delete updateData.email;

    // Update only allowed fields with actual values
    const allowedFields = ['name', 'phone', 'businessName', 'gstin', 'address'];
    const filteredData = {};

    allowedFields.forEach((field) => {
        const value = updateData[field];
        // Only include fields that have actual non-empty values
        // This prevents validation errors for required fields that aren't being updated
        if (value !== undefined && value !== null && value !== '') {
            // For address, also filter out empty nested fields
            if (field === 'address' && typeof value === 'object') {
                const cleanedAddress = {};
                Object.keys(value).forEach((key) => {
                    if (value[key] !== undefined && value[key] !== null && value[key] !== '') {
                        cleanedAddress[key] = value[key];
                    }
                });
                // Only include address if it has at least one valid field
                if (Object.keys(cleanedAddress).length > 0) {
                    filteredData[field] = cleanedAddress;
                }
            } else {
                filteredData[field] = value;
            }
        }
    });

    // Apply updates
    const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
    });

    return updatedUser;
};

/**
 * Update user profile image
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} imagePath - Path to new image
 * @returns {Promise<Object>} Updated user
 */
const updateProfileImage = async (userId, imagePath) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Delete old image if exists
    if (user.profileImage) {
        deleteOldImage(user.profileImage);
    }

    // Update with new image path
    user.profileImage = imagePath;
    await user.save({ validateBeforeSave: false });

    return user;
};

/**
 * Delete old profile image from disk
 * @param {string} imagePath - Relative path to image
 */
const deleteOldImage = (imagePath) => {
    try {
        if (!imagePath) return;

        // Construct full path
        const fullPath = path.join(__dirname, '../../../uploads', imagePath.replace('/uploads/', ''));

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error('Error deleting old profile image:', error.message);
        // Don't throw - deleting old image is not critical
    }
};

/**
 * Remove profile image
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Updated user
 */
const removeProfileImage = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Delete old image if exists
    if (user.profileImage) {
        deleteOldImage(user.profileImage);
    }

    // Remove image path
    user.profileImage = null;
    await user.save({ validateBeforeSave: false });

    return user;
};

module.exports = {
    getProfile,
    updateProfile,
    updateProfileImage,
    removeProfileImage,
    deleteOldImage,
};
