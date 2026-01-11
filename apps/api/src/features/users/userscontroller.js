/**
 * Users Controller
 * ==================
 * Request handlers for user management endpoints
 * 
 * @module features/users/userscontroller
 */

const usersService = require('./usersservice');
const { sendSuccess, sendError, sendPaginated } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get all users with filtering
 * @route   GET /api/v1/users
 * @access  Private (Admin, Employee)
 */
const getAllUsers = async (req, res) => {
    try {
        const { users, pagination } = await usersService.getAllUsers(req.query);
        sendPaginated(res, users, pagination);
    } catch (error) {
        console.error('Get users error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/users/:id
 * @access  Private (Admin, Employee)
 */
const getUserById = async (req, res) => {
    try {
        const user = await usersService.getUserById(req.params.id);
        sendSuccess(res, 200, 'User retrieved successfully', { user });
    } catch (error) {
        console.error('Get user error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update user
 * @route   PUT /api/v1/users/:id
 * @access  Private (Admin)
 */
const updateUser = async (req, res) => {
    try {
        const user = await usersService.updateUser(req.params.id, req.body);
        sendSuccess(res, 200, 'User updated successfully', { user });
    } catch (error) {
        console.error('Update user error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Toggle user active status
 * @route   PUT /api/v1/admin/users/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleUserStatus = async (req, res) => {
    try {
        const user = await usersService.toggleUserStatus(req.params.id);
        sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, { user });
    } catch (error) {
        console.error('Toggle user status error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Create new user (Admin only)
 * @route   POST /api/v1/admin/users
 * @access  Private (Admin)
 */
const createUser = async (req, res) => {
    try {
        const user = await usersService.createUser(req.body);
        sendSuccess(res, 201, 'User created successfully', { user });
    } catch (error) {
        console.error('Create user error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Change user role
 * @route   PATCH /api/v1/users/:id/role
 * @access  Private (Admin)
 */
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return sendError(res, 400, 'Role is required');
        }

        const user = await usersService.changeUserRole(req.params.id, role, req.user._id);
        sendSuccess(res, 200, 'User role updated successfully', { user });
    } catch (error) {
        console.error('Change user role error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res) => {
    try {
        await usersService.deleteUser(req.params.id, req.user._id);
        sendSuccess(res, 200, 'User deleted successfully');
    } catch (error) {
        console.error('Delete user error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    toggleUserStatus,
    changeUserRole,
    deleteUser,
    createUser,
};
