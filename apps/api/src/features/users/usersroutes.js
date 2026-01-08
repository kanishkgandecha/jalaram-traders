/**
 * Users Routes
 * =============
 * Route definitions for user management endpoints
 * 
 * All routes require authentication.
 * Most routes are restricted to admin / employee roles.
 * 
 * @module features/users/usersroutes
 */

const express = require('express');
const router = express.Router();
const usersController = require('./userscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize, minRole } = require('../../shared/middleware/rolemiddleware');

// All routes require authentication
router.use(protect);

// ==========================================
// ADMIN & EMPLOYEE ROUTES
// ==========================================

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin, Employee)
 */
router.get('/stats', authorize('admin', 'employee'), usersController.getUserStats);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin, Employee)
 */
router.get('/', authorize('admin', 'employee'), usersController.getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin, Employee)
 */
router.get('/:id', authorize('admin', 'employee'), usersController.getUserById);

// ==========================================
// ADMIN ONLY ROUTES
// ==========================================

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post('/', authorize('admin'), usersController.createUser);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/:id', authorize('admin'), usersController.updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', authorize('admin'), usersController.deleteUser);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin)
 */
router.patch('/:id/status', authorize('admin'), usersController.toggleUserStatus);

/**
 * @route   PATCH /api/v1/users/:id/credit-limit
 * @desc    Update user credit limit
 * @access  Private (Admin)
 */
router.patch('/:id/credit-limit', authorize('admin'), usersController.updateCreditLimit);

module.exports = router;
