/**
 * Admin Service
 * ==============
 * Business logic for admin operations
 * 
 * @module features/admin/adminservice
 */

const Order = require('../orders/Order');
const User = require('../auth/User');
const Product = require('../products/Product');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Parallel queries for better performance
    const [
        totalOrders,
        todayOrders,
        monthOrders,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        totalUsers,
        totalRetailers,
        totalProducts,
        lowStockProducts,
        pendingOrders,
        recentOrders,
    ] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ createdAt: { $gte: today } }),
        Order.countDocuments({ createdAt: { $gte: thisMonth } }),
        Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Order.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Order.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: thisMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'retailer', isActive: true }),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, isActive: true }),
        Order.countDocuments({ status: 'pending' }),
        Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .select('orderNumber totalAmount status createdAt'),
    ]);

    return {
        orders: {
            total: totalOrders,
            today: todayOrders,
            thisMonth: monthOrders,
            pending: pendingOrders,
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
            today: todayRevenue[0]?.total || 0,
            thisMonth: monthRevenue[0]?.total || 0,
        },
        users: {
            total: totalUsers,
            retailers: totalRetailers,
        },
        products: {
            total: totalProducts,
            lowStock: lowStockProducts,
        },
        recentOrders,
    };
};

/**
 * Get sales report for date range
 */
const getSalesReport = async (startDate, endDate, groupBy = 'day') => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let dateFormat;
    if (groupBy === 'month') {
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else if (groupBy === 'week') {
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
    } else {
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const salesData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                paymentStatus: { $in: ['paid', 'partial_refund'] },
            },
        },
        {
            $group: {
                _id: dateFormat,
                orders: { $sum: 1 },
                revenue: { $sum: '$totalAmount' },
                items: { $sum: { $size: '$items' } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Summary stats
    const summary = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                paymentStatus: { $in: ['paid', 'partial_refund'] },
            },
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                totalItems: { $sum: { $size: '$items' } },
                avgOrderValue: { $avg: '$totalAmount' },
            },
        },
    ]);

    // Top products
    const topProducts = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                paymentStatus: { $in: ['paid', 'partial_refund'] },
            },
        },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productSnapshot.name',
                quantity: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.total' },
            },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
    ]);

    return {
        period: { start, end, groupBy },
        summary: summary[0] || { totalOrders: 0, totalRevenue: 0, totalItems: 0, avgOrderValue: 0 },
        salesData,
        topProducts,
    };
};

/**
 * Get all users with filters
 */
const getAllUsers = async (filters = {}) => {
    const { page = 1, limit = 20, role, isActive, search } = filters;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
        query.$or = [
            { name: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
            { phone: new RegExp(search, 'i') },
            { businessName: new RegExp(search, 'i') },
        ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(query)
            .sort({ createdAt: -1 })
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
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Create new user (admin only)
 */
const createUser = async (userData) => {
    const { name, email, phone, password, role, businessName, gstin } = userData;

    // Check if user exists
    const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
    });

    if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'phone';
        const error = new Error(`User with this ${field} already exists`);
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create({
        name,
        email,
        phone,
        password,
        role: role || 'retailer',
        businessName,
        gstin,
    });

    user.password = undefined;
    return user;
};

/**
 * Update user role
 */
const updateUserRole = async (userId, newRole) => {
    const validRoles = ['admin', 'employee', 'retailer', 'farmer'];

    if (!validRoles.includes(newRole)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
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
 * Toggle user active status
 */
const toggleUserStatus = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    return user;
};

module.exports = {
    getDashboardStats,
    getSalesReport,
    getAllUsers,
    createUser,
    updateUserRole,
    toggleUserStatus,
};
