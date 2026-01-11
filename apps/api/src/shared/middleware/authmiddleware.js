/**
 * Auth Middleware
 * ================
 * JWT authentication and protection middleware
 * 
 * @module shared/middleware/authmiddleware
 */

const jwt = require('jsonwebtoken');
const User = require('../../features/auth/User');
const { sendError } = require('../utils/responsehelper');

/**
 * Protect routes - require valid JWT
 * Attaches user object to request
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for Bearer token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return sendError(res, 401, 'Not authorized, no token provided');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return sendError(res, 401, 'Not authorized, user not found');
        }

        // Check if user is active
        if (!user.isActive) {
            return sendError(res, 401, 'Account is deactivated. Please contact admin.');
        }

        // Check if password was changed after token was issued
        if (user.passwordChangedAfter && user.passwordChangedAfter(decoded.iat)) {
            return sendError(res, 401, 'Password recently changed. Please login again.');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return sendError(res, 401, 'Not authorized, invalid token');
        }
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 401, 'Not authorized, token expired');
        }
        console.error('Auth middleware error:', error);
        return sendError(res, 500, 'Authentication error');
    }
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // No token, continue without user
            req.user = null;
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (user && user.isActive) {
            req.user = user;
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // Token invalid or expired, continue without user
        req.user = null;
        next();
    }
};

module.exports = {
    protect,
    optionalAuth,
};
