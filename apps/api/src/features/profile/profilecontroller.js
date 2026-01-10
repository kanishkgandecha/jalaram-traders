/**
 * Profile Controller
 * ====================
 * Express route handlers for profile operations
 * 
 * @module features/profile/profilecontroller
 */

const profileService = require('./profileservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * Get current user's profile
 * GET /api/v1/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await profileService.getProfile(req.user._id);

        sendSuccess(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user's profile
 * PUT /api/v1/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const user = await profileService.updateProfile(req.user._id, req.body);

        sendSuccess(res, 200, 'Profile updated successfully', { user });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload profile image
 * POST /api/v1/profile/image
 */
const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 400, 'No image file provided');
        }

        // Construct relative path for storage
        const imagePath = `/uploads/profiles/${req.file.filename}`;

        const user = await profileService.updateProfileImage(req.user._id, imagePath);

        sendSuccess(res, 200, 'Profile image uploaded successfully', { user });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove profile image
 * DELETE /api/v1/profile/image
 */
const removeProfileImage = async (req, res, next) => {
    try {
        const user = await profileService.removeProfileImage(req.user._id);

        sendSuccess(res, 200, 'Profile image removed successfully', { user });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfileImage,
    removeProfileImage,
};
