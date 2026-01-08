/**
 * Auth Service
 * =============
 * Business logic for authentication operations
 * 
 * @module features/auth/authservice
 */

const jwt = require('jsonwebtoken');
const User = require('./User');

/**
 * Generate JWT token for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user and token
 */
const registerUser = async (userData) => {
    const { name, email, phone, password, role, businessName, gstin, address } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
    });

    if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'phone';
        const error = new Error(`User with this ${field} already exists`);
        error.statusCode = 400;
        throw error;
    }

    // Create user
    const user = await User.create({
        name,
        email,
        phone,
        password,
        role: role || 'farmer', // Default role
        businessName,
        gstin,
        address,
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    return { user, token };
};

/**
 * Login user with email/phone and password
 * @param {string} identifier - Email or phone number
 * @param {string} password - User's password
 * @returns {Promise<Object>} User and token
 */
const loginUser = async (identifier, password) => {
    // Find user by email or phone
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
    user.password = undefined;

    return { user, token };
};

/**
 * Get user profile by ID
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} User profile
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
    // Fields that cannot be updated through this method
    const restrictedFields = ['password', 'role', 'isActive', 'creditLimit', 'outstandingBalance'];
    restrictedFields.forEach((field) => delete updateData[field]);

    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    });

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
 * @returns {Promise<Object>} Updated user and new token
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    user.password = undefined;

    return { user, token };
};

module.exports = {
    generateToken,
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
};
