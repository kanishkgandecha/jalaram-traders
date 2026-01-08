/**
 * Admin Routes
 * =============
 * Route definitions for admin-only endpoints
 * 
 * @module features/admin/adminroutes
 */

const express = require('express');
const router = express.Router();
const adminController = require('./admincontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// ==========================================
// DASHBOARD
// ==========================================

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard', adminController.getDashboardStats);

// ==========================================
// REPORTS
// ==========================================

/**
 * @route   GET /api/v1/admin/reports/sales
 * @desc    Get sales report
 * @access  Admin only
 */
router.get('/reports/sales', adminController.getSalesReport);

/**
 * @route   GET /api/v1/admin/reports/export
 * @desc    Export report data
 * @access  Admin only
 */
router.get('/reports/export', adminController.exportReport);

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post('/users', adminController.createUser);

/**
 * @route   PUT /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 */
router.put('/users/:id/role', adminController.updateUserRole);

/**
 * @route   PUT /api/v1/admin/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Admin only
 */
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);

module.exports = router;
