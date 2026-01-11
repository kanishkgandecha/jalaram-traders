/**
 * Auth Service
 * =============
 * Core authentication business logic
 * 
 * Handles:
 * - User registration with password hashing
 * - User login with email/phone + password
 * - JWT token generation
 * - Profile management
 * - Password changes
 * 
 * @module features/auth/authservice
 */

const jwt = require('jsonwebtoken');
const User = require('./User');

/**
 * Generate JWT token
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and token
 */
const registerUser = async (userData) => {
    const { email, phone, password, name, role = 'farmer', ...rest } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
        const error = new Error('User with this email or phone already exists');
        error.statusCode = 400;
        throw error;
    }

    // Prevent registration as admin (must be done manually)
    const allowedRoles = ['retailer', 'farmer'];
    const userRole = allowedRoles.includes(role) ? role : 'farmer';

    // Create user
    const user = await User.create({
        email,
        phone,
        password,
        name,
        role: userRole,
        authProvider: 'local',
        ...rest,
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userObject = user.toObject();
    delete userObject.password;

    return { user: userObject, token };
};

/**
 * Login user with email/phone and password
 * @param {string} identifier - Email or phone
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} User and token
 */
const loginUser = async (identifier, password) => {
    // Find user by email or phone (include password for comparison)
    const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
    }).select('+password');

    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    // Check if account is active
    if (!user.isActive) {
        const error = new Error('Account is deactivated. Please contact admin.');
        error.statusCode = 401;
        throw error;
    }

    // Check if user registered with Google (no password)
    if (user.authProvider === 'google' && !user.password) {
        const error = new Error('Please use Google Sign-In for this account');
        error.statusCode = 400;
        throw error;
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userObject = user.toObject();
    delete userObject.password;

    return { user: userObject, token };
};

/**
 * Get user profile by ID
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} User object
 */
const getUserProfile = async (userId) => {
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
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUserProfile = async (userId, updateData) => {
    // Fields that cannot be updated via this method
    const restrictedFields = ['password', 'role', 'isActive', 'googleId', 'authProvider'];
    restrictedFields.forEach((field) => delete updateData[field]);

    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    );

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Change user password
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} User and new token
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if user uses Google auth
    if (user.authProvider === 'google' && !user.password) {
        const error = new Error('Cannot change password for Google-authenticated accounts');
        error.statusCode = 400;
        throw error;
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Generate new token (old tokens will be invalid due to passwordChangedAt)
    const token = generateToken(user._id);

    // Remove password from response
    const userObject = user.toObject();
    delete userObject.password;

    return { user: userObject, token };
};

/**
 * Check if user email is available
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if available
 */
const isEmailAvailable = async (email) => {
    const user = await User.findOne({ email });
    return !user;
};

/**
 * Check if phone is available
 * @param {string} phone - Phone to check
 * @returns {Promise<boolean>} True if available
 */
const isPhoneAvailable = async (phone) => {
    const user = await User.findOne({ phone });
    return !user;
};

module.exports = {
    generateToken,
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    isEmailAvailable,
    isPhoneAvailable,
};
