/**
 * Users Routes
 * ==============
 * Route definitions for user management (admin operations)
 * 
 * @module features/users/usersroutes
 */

const express = require('express');
const router = express.Router();
const usersController = require('./userscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// All user management routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (with filtering)
 * @access  Private (Admin, Employee)
 */
router.get('/', authorize('admin', 'employee'), usersController.getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin, Employee)
 */
router.get('/:id', authorize('admin', 'employee'), usersController.getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/:id', authorize('admin'), usersController.updateUser);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Activate/Deactivate user
 * @access  Private (Admin)
 */
router.patch('/:id/status', authorize('admin'), usersController.toggleUserStatus);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin)
 */
router.patch('/:id/role', authorize('admin'), usersController.changeUserRole);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/:id', authorize('admin'), usersController.deleteUser);

module.exports = router;
