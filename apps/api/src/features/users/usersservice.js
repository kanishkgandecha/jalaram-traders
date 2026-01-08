/**
 * Users Service
 * ==============
 * Business logic for user management (admin operations)
 * 
 * @module features/users/usersservice
 */

const User = require('../auth/User');

/**
 * Get all users with filtering and pagination
 * @param {Object} queryParams - Query parameters
 * @returns {Promise<Object>} Users and pagination info
 */
const getAllUsers = async (queryParams) => {
    const {
        page = 1,
        limit = 10,
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = queryParams;

    // Build query
    const query = {};

    if (role) {
        query.role = role;
    }

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { businessName: { $regex: search, $options: 'i' } },
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [users, total] = await Promise.all([
        User.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password'),
        User.countDocuments(query),
    ]);

    return {
        users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get user by ID
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Create a new user (admin operation)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
    const { email, phone } = userData;

    // Check for existing user
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
    });

    if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'phone';
        const error = new Error(`User with this ${field} already exists`);
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create(userData);
    user.password = undefined;

    return user;
};

/**
 * Update user by ID (admin operation)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updateData) => {
    // Don't allow password update through this method
    delete updateData.password;

    // Check for duplicate email/phone if being updated
    if (updateData.email || updateData.phone) {
        const duplicateQuery = { _id: { $ne: userId } };
        const orConditions = [];

        if (updateData.email) {
            orConditions.push({ email: updateData.email });
        }
        if (updateData.phone) {
            orConditions.push({ phone: updateData.phone });
        }

        if (orConditions.length > 0) {
            duplicateQuery.$or = orConditions;
            const duplicate = await User.findOne(duplicateQuery);

            if (duplicate) {
                const field = duplicate.email === updateData.email ? 'email' : 'phone';
                const error = new Error(`Another user with this ${field} already exists`);
                error.statusCode = 400;
                throw error;
            }
        }
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    }).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Delete user by ID (soft delete - deactivate)
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Deleted user
 */
const deleteUser = async (userId) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Toggle user active status
 * @param {string} userId - User's MongoDB ObjectId
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} Updated user
 */
const toggleUserStatus = async (userId, isActive) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Update user's credit limit (for retailers)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {number} creditLimit - New credit limit
 * @returns {Promise<Object>} Updated user
 */
const updateCreditLimit = async (userId, creditLimit) => {
    if (creditLimit < 0) {
        const error = new Error('Credit limit cannot be negative');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { creditLimit },
        { new: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async () => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
                },
            },
        },
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: stats.reduce((acc, item) => {
            acc[item._id] = { total: item.count, active: item.activeCount };
            return acc;
        }, {}),
    };
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
