/**
 * Admin Controller
 * =================
 * Request handlers for admin endpoints
 * 
 * @module features/admin/admincontroller
 */

const adminService = require('./adminservice');
const { sendSuccess, sendError, sendPaginated } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/admin/dashboard
 * @access  Admin only
 */
const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();
        sendSuccess(res, 200, 'Dashboard stats retrieved', stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get sales report
 * @route   GET /api/v1/admin/reports/sales
 * @access  Admin only
 */
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy } = req.query;

        if (!startDate || !endDate) {
            return sendError(res, 400, 'Start date and end date are required');
        }

        const report = await adminService.getSalesReport(startDate, endDate, groupBy);
        sendSuccess(res, 200, 'Sales report generated', report);
    } catch (error) {
        console.error('Sales report error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Export report data
 * @route   GET /api/v1/admin/reports/export
 * @access  Admin only
 */
const exportReport = async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return sendError(res, 400, 'Start date and end date are required');
        }

        const report = await adminService.getSalesReport(startDate, endDate, 'day');

        if (format === 'csv') {
            // Generate CSV
            const headers = 'Date,Orders,Revenue,Items\n';
            const rows = report.salesData.map(d =>
                `${d._id},${d.orders},${d.revenue},${d.items}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-${endDate}.csv`);
            return res.send(headers + rows);
        }

        // JSON format
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}-${endDate}.json`);
        sendSuccess(res, 200, 'Report exported', report);
    } catch (error) {
        console.error('Export error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get all users
 * @route   GET /api/v1/admin/users
 * @access  Admin only
 */
const getAllUsers = async (req, res) => {
    try {
        const { users, pagination } = await adminService.getAllUsers(req.query);
        sendPaginated(res, users, pagination.page, pagination.limit, pagination.total, 'Users retrieved');
    } catch (error) {
        console.error('Get users error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Create new user
 * @route   POST /api/v1/admin/users
 * @access  Admin only
 */
const createUser = async (req, res) => {
    try {
        const user = await adminService.createUser(req.body);
        sendSuccess(res, 201, 'User created successfully', { user });
    } catch (error) {
        console.error('Create user error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update user role
 * @route   PUT /api/v1/admin/users/:id/role
 * @access  Admin only
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return sendError(res, 400, 'Role is required');
        }

        const user = await adminService.updateUserRole(req.params.id, role);
        sendSuccess(res, 200, 'User role updated', { user });
    } catch (error) {
        console.error('Update role error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Toggle user active status
 * @route   PUT /api/v1/admin/users/:id/toggle-status
 * @access  Admin only
 */
const toggleUserStatus = async (req, res) => {
    try {
        const user = await adminService.toggleUserStatus(req.params.id);
        sendSuccess(res, 200, `User ${user.isActive ? 'enabled' : 'disabled'}`, { user });
    } catch (error) {
        console.error('Toggle status error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getDashboardStats,
    getSalesReport,
    exportReport,
    getAllUsers,
    createUser,
    updateUserRole,
    toggleUserStatus,
};
