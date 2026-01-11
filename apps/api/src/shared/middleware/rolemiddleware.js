/**
 * Role Middleware
 * ================
 * Role-based authorization middleware
 * 
 * @module shared/middleware/rolemiddleware
 */

const { sendError } = require('../utils/responsehelper');

/**
 * Authorize specific roles
 * Must be used after protect middleware
 * 
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/admin', protect, authorize('admin'), controller);
 * router.post('/staff', protect, authorize('admin', 'employee'), controller);
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 401, 'Not authorized, please login');
        }

        if (!roles.includes(req.user.role)) {
            return sendError(
                res,
                403,
                `Role '${req.user.role}' is not authorized to access this resource`
            );
        }

        next();
    };
};

/**
 * Require active account
 * Additional check beyond isActive in auth middleware
 */
const requireActive = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 401, 'Not authorized, please login');
    }

    if (!req.user.isActive) {
        return sendError(res, 403, 'Your account is deactivated');
    }

    next();
};

/**
 * Check if user owns the resource
 * Must be used after protect middleware
 * 
 * @param {string} userIdField - Field name containing the user ID in the resource
 * @returns {Function} Express middleware
 */
const isOwner = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 401, 'Not authorized, please login');
        }

        // Admin and employee can access all resources
        if (req.user.role === 'admin' || req.user.role === 'employee') {
            return next();
        }

        // Check if user ID matches
        const resourceUserId = req.resource?.[userIdField]?.toString();
        if (resourceUserId && resourceUserId !== req.user._id.toString()) {
            return sendError(res, 403, 'Not authorized to access this resource');
        }

        next();
    };
};

module.exports = {
    authorize,
    requireActive,
    isOwner,
};
