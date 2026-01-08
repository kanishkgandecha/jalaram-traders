/**
 * Role-Based Access Control Middleware
 * =====================================
 * Restrict access to routes based on user roles
 * 
 * Available Roles:
 * - admin: Full access (owner/manager)
 * - employee: Limited admin access
 * - retailer: B2B wholesale customers
 * - farmer: Individual customers (future-ready)
 * 
 * @module shared/middleware/rolemiddleware
 */

/**
 * Authorize access based on user roles
 * Must be used AFTER the protect middleware
 * 
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only admin can access
 * router.delete('/user/:id', protect, authorize('admin'), deleteUser);
 * 
 * // Admin and employee can access
 * router.get('/orders', protect, authorize('admin', 'employee'), getOrders);
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if user exists (should be attached by protect middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, please login',
            });
        }

        // Check if user's role is in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
                requiredRoles: roles,
            });
        }

        next();
    };
};

/**
 * Check if user is the owner of a resource or has elevated role
 * Useful for routes where users can access their own data, or admins can access all
 * 
 * @param {string} paramName - Request parameter containing the user ID to check
 * @param {...string} bypassRoles - Roles that bypass ownership check
 * @returns {Function} Express middleware function
 * 
 * @example
 * // User can access own profile, admin can access any
 * router.get('/user/:userId', protect, ownerOrRole('userId', 'admin'), getUser);
 */
const ownerOrRole = (paramName, ...bypassRoles) => {
    return (req, res, next) => {
        // Bypass roles can access any resource
        if (bypassRoles.includes(req.user.role)) {
            return next();
        }

        // Check if the user is accessing their own resource
        const resourceUserId = req.params[paramName];
        if (req.user._id.toString() === resourceUserId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.',
        });
    };
};

/**
 * Middleware to check minimum role level (hierarchical roles)
 * Role hierarchy: admin > employee > retailer > farmer
 * 
 * @param {string} minRole - Minimum required role
 * @returns {Function} Express middleware function
 */
const minRole = (minRole) => {
    const roleHierarchy = {
        farmer: 1,
        retailer: 2,
        employee: 3,
        admin: 4,
    };

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, please login',
            });
        }

        const userRoleLevel = roleHierarchy[req.user.role] || 0;
        const requiredRoleLevel = roleHierarchy[minRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Minimum role required: ${minRole}`,
            });
        }

        next();
    };
};

module.exports = { authorize, ownerOrRole, minRole };
