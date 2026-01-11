/**
 * Admin Routes
 * ==============
 * Route definitions for admin dashboard endpoints
 * 
 * @module features/admin/adminroutes
 */

const express = require('express');
const router = express.Router();
const adminController = require('./admincontroller');
const usersController = require('../users/userscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// All admin routes require authentication and admin/employee role
router.use(protect);
router.use(authorize('admin', 'employee'));

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Private (Admin, Employee)
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/reports/sales
 * @desc    Get sales report
 * @access  Private (Admin, Employee)
 */
router.get('/reports/sales', adminController.getSalesReport);

/**
 * @route   GET /api/v1/admin/reports/inventory
 * @desc    Get inventory report
 * @access  Private (Admin, Employee)
 */
router.get('/reports/inventory', adminController.getInventoryReport);

/**
 * @route   GET /api/v1/admin/activity
 * @desc    Get recent activity log
 * @access  Private (Admin)
 */
router.get('/activity', authorize('admin'), adminController.getActivityLog);

// ==========================================
// ADMIN USER MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users (with filtering)
 * @access  Private (Admin, Employee)
 */
router.get('/users', usersController.getAllUsers);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post('/users', authorize('admin'), usersController.createUser);

/**
 * @route   PUT /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put('/users/:id/role', authorize('admin'), usersController.changeUserRole);

/**
 * @route   PUT /api/v1/admin/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private (Admin)
 */
router.put('/users/:id/toggle-status', authorize('admin'), usersController.toggleUserStatus);

module.exports = router;

