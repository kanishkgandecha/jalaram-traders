/**
 * Admin Controller
 * ==================
 * Request handlers for admin dashboard endpoints
 * 
 * @module features/admin/admincontroller
 */

const adminService = require('./adminservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/v1/admin/dashboard
 * @access  Private (Admin, Employee)
 */
const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();
        sendSuccess(res, 200, 'Dashboard stats retrieved successfully', stats);
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get sales report
 * @route   GET /api/v1/admin/reports/sales
 * @access  Private (Admin, Employee)
 */
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const report = await adminService.getSalesReport({ startDate, endDate, groupBy });
        sendSuccess(res, 200, 'Sales report retrieved successfully', { report });
    } catch (error) {
        console.error('Get sales report error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get inventory report
 * @route   GET /api/v1/admin/reports/inventory
 * @access  Private (Admin, Employee)
 */
const getInventoryReport = async (req, res) => {
    try {
        const report = await adminService.getInventoryReport();
        sendSuccess(res, 200, 'Inventory report retrieved successfully', { report });
    } catch (error) {
        console.error('Get inventory report error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get activity log
 * @route   GET /api/v1/admin/activity
 * @access  Private (Admin)
 */
const getActivityLog = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const activity = await adminService.getActivityLog(parseInt(page), parseInt(limit));
        sendSuccess(res, 200, 'Activity log retrieved successfully', activity);
    } catch (error) {
        console.error('Get activity log error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getDashboardStats,
    getSalesReport,
    getInventoryReport,
    getActivityLog,
};
