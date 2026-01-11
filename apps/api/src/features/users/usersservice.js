/**
 * Users Service
 * ===============
 * Business logic for user management
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
        limit = 20,
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
        query.isActive = isActive === 'true' || isActive === true;
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

    // Build sort
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
 * Update user
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updateData) => {
    // Prevent updating sensitive fields directly
    const restrictedFields = ['password', 'googleId', 'authProvider'];
    restrictedFields.forEach((field) => delete updateData[field]);

    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Toggle user active status (automatically toggles)
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Updated user
 */
const toggleUserStatus = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    user.isActive = !user.isActive;
    await user.save();

    return user;
};

/**
 * Change user role
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} newRole - New role
 * @param {string} adminId - Admin making the change
 * @returns {Promise<Object>} Updated user
 */
const changeUserRole = async (userId, newRole, adminId) => {
    // Validate role
    const validRoles = ['admin', 'employee', 'retailer', 'farmer'];
    if (!validRoles.includes(newRole)) {
        const error = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    // Prevent self-demotion (admin can't remove their own admin role)
    if (userId === adminId.toString() && newRole !== 'admin') {
        const error = new Error('Cannot change your own admin role');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
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
 * Delete user (soft delete by deactivation)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} adminId - Admin making the change
 * @returns {Promise<void>}
 */
const deleteUser = async (userId, adminId) => {
    // Prevent self-deletion
    if (userId === adminId.toString()) {
        const error = new Error('Cannot delete your own account');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
    );

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
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
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
            },
        },
    ]);

    const total = await User.countDocuments();
    const activeTotal = await User.countDocuments({ isActive: true });

    return {
        total,
        active: activeTotal,
        inactive: total - activeTotal,
        byRole: stats.reduce((acc, item) => {
            acc[item._id] = { total: item.count, active: item.active };
            return acc;
        }, {}),
    };
};
/**
 * Create new user (Admin function)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
    const { name, email, phone, password, role, businessName } = userData;

    // Check for existing user
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
    });

    if (existingUser) {
        const error = new Error('User with this email or phone already exists');
        error.statusCode = 400;
        throw error;
    }

    const user = new User({
        name,
        email,
        phone,
        password,
        role: role || 'retailer',
        businessName,
        isActive: true,
    });

    await user.save();

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    toggleUserStatus,
    changeUserRole,
    deleteUser,
    getUserStats,
    createUser,
};
