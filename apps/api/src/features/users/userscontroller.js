/**
 * Users Controller
 * =================
 * Request handlers for user management endpoints
 * 
 * @module features/users/userscontroller
 */

const usersService = require('./usersservice');
const { sendSuccess, sendError, sendPaginated } = require('../../shared/utils/responsehelper');

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private (Admin, Employee)
 */
const getAllUsers = async (req, res) => {
    try {
        const { users, pagination } = await usersService.getAllUsers(req.query);

        sendPaginated(
            res,
            users,
            pagination.page,
            pagination.limit,
            pagination.total,
            'Users retrieved successfully'
        );
    } catch (error) {
        console.error('Get all users error:', error);
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
        console.error('Get user by ID error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Create new user
 * @route   POST /api/v1/users
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
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res) => {
    try {
        const user = await usersService.deleteUser(req.params.id);

        sendSuccess(res, 200, 'User deactivated successfully', { user });
    } catch (error) {
        console.error('Delete user error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/v1/users/:id/status
 * @access  Private (Admin)
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return sendError(res, 400, 'Please provide isActive as boolean');
        }

        const user = await usersService.toggleUserStatus(req.params.id, isActive);

        const statusText = isActive ? 'activated' : 'deactivated';
        sendSuccess(res, 200, `User ${statusText} successfully`, { user });
    } catch (error) {
        console.error('Toggle user status error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update user credit limit
 * @route   PATCH /api/v1/users/:id/credit-limit
 * @access  Private (Admin)
 */
const updateCreditLimit = async (req, res) => {
    try {
        const { creditLimit } = req.body;

        if (typeof creditLimit !== 'number') {
            return sendError(res, 400, 'Please provide creditLimit as a number');
        }

        const user = await usersService.updateCreditLimit(req.params.id, creditLimit);

        sendSuccess(res, 200, 'Credit limit updated successfully', { user });
    } catch (error) {
        console.error('Update credit limit error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/v1/users/stats
 * @access  Private (Admin, Employee)
 */
const getUserStats = async (req, res) => {
    try {
        const stats = await usersService.getUserStats();

        sendSuccess(res, 200, 'User statistics retrieved successfully', { stats });
    } catch (error) {
        console.error('Get user stats error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateCreditLimit,
    getUserStats,
};
