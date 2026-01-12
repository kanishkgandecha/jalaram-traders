/**
 * Google Auth Service
 * ====================
 * Handles Google OAuth token verification and user management
 * 
 * Uses google-auth-library for token verification
 * Only allows retailer role for Google sign-in
 * 
 * @module features/auth/googleauthservice
 */

const { OAuth2Client } = require('google-auth-library');
const User = require('./User');
const authService = require('./authservice');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and return payload
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object>} Token payload with user info
 */
const verifyGoogleToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch (error) {
        const err = new Error('Invalid Google token');
        err.statusCode = 401;
        throw err;
    }
};

/**
 * Handle Google Sign-In
 * Creates new user or logs in existing user
 * 
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object>} User and JWT token
 */
const googleLogin = async (idToken) => {
    // Verify the Google token
    const payload = await verifyGoogleToken(idToken);

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
        const error = new Error('Email not provided by Google');
        error.statusCode = 400;
        throw error;
    }

    // Check if user exists by googleId or email
    let user = await User.findOne({
        $or: [{ googleId }, { email }]
    });

    if (user) {
        // Existing user found

        // Block admin/employee from Google login
        if (user.role === 'admin' || user.role === 'employee') {
            const error = new Error('Google sign-in is only available for retailers and farmers. Please use email/password login.');
            error.statusCode = 403;
            throw error;
        }

        // Check if account is active
        if (!user.isActive) {
            const error = new Error('Account is deactivated. Please contact admin.');
            error.statusCode = 401;
            throw error;
        }

        // Update Google ID if not set (user registered with email, now using Google)
        if (!user.googleId) {
            user.googleId = googleId;
            user.authProvider = 'google';
            if (picture && !user.profileImage) {
                user.profileImage = picture;
            }
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

    } else {
        // New user - create with retailer role
        // Generate username from Google user's name
        const username = await authService.generateUniqueUsername(name);

        user = await User.create({
            googleId,
            email,
            name,
            username,
            profileImage: picture || null,
            role: 'retailer', // Auto-assign retailer role for Google sign-ins
            authProvider: 'google',
            isActive: true,
        });
    }

    // Generate JWT token
    const token = authService.generateToken(user._id);

    return { user, token };
};

/**
 * Link Google account to existing user
 * For users who registered with email/password and want to add Google
 * 
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object>} Updated user
 */
const linkGoogleAccount = async (userId, idToken) => {
    const payload = await verifyGoogleToken(idToken);
    const { sub: googleId, email, picture } = payload;

    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
        const error = new Error('This Google account is already linked to another user');
        error.statusCode = 400;
        throw error;
    }

    // Verify email matches
    if (user.email !== email) {
        const error = new Error('Google email does not match your account email');
        error.statusCode = 400;
        throw error;
    }

    // Link Google account
    user.googleId = googleId;
    user.authProvider = 'google';
    if (picture && !user.profileImage) {
        user.profileImage = picture;
    }

    await user.save({ validateBeforeSave: false });

    return user;
};

module.exports = {
    verifyGoogleToken,
    googleLogin,
    linkGoogleAccount,
};
