/**
 * Admin Service
 * ===============
 * Business logic for admin dashboard operations
 * 
 * @module features/admin/adminservice
 */

const User = require('../auth/User');
const Product = require('../products/Product');
const Order = require('../orders/Order');

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async () => {
    const [userStats, productStats, orderStats, recentOrders] = await Promise.all([
        getUserStats(),
        getProductStats(),
        getOrderStats(),
        getRecentOrders(),
    ]);

    return {
        orders: {
            total: orderStats.total,
            today: orderStats.today.count,
            thisMonth: orderStats.thisMonth?.count || 0,
            pending: orderStats.byStatus?.pending_payment || 0,
        },
        revenue: {
            total: orderStats.totalRevenue,
            today: orderStats.today.revenue,
            thisMonth: orderStats.thisMonth?.revenue || 0,
        },
        users: {
            total: userStats.total,
            retailers: userStats.byRole?.retailer?.total || 0,
        },
        products: {
            total: productStats.total,
            lowStock: productStats.lowStock,
        },
        recentOrders,
    };
};

/**
 * Get recent orders for dashboard
 */
const getRecentOrders = async () => {
    const orders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .select('orderNumber status createdAt totals');

    return orders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        totalAmount: o.totals?.grandTotal || 0,
        status: o.status,
        createdAt: o.createdAt,
        user: o.userId ? { name: o.userId.name, email: o.userId.email } : null,
    }));
};

/**
 * Get user statistics
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

    const total = stats.reduce((sum, s) => sum + s.count, 0);

    return {
        total,
        byRole: stats.reduce((acc, s) => {
            acc[s._id] = { total: s.count, active: s.active };
            return acc;
        }, {}),
    };
};

/**
 * Get product statistics
 */
const getProductStats = async () => {
    const stats = await Product.aggregate([
        {
            $addFields: {
                stockAvailable: { $subtract: ['$stockTotal', '$stockReserved'] },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                totalStock: { $sum: '$stockTotal' },
                lowStock: {
                    $sum: {
                        $cond: [
                            { $lte: ['$stockAvailable', '$lowStockThreshold'] },
                            1,
                            0,
                        ],
                    },
                },
                outOfStock: {
                    $sum: {
                        $cond: [{ $lte: ['$stockAvailable', 0] }, 1, 0],
                    },
                },
            },
        },
    ]);

    return stats[0] || { total: 0, active: 0, totalStock: 0, lowStock: 0, outOfStock: 0 };
};

/**
 * Get order statistics
 */
const getOrderStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await Order.aggregate([
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            totalRevenue: { $sum: '$totals.grandTotal' },
                        },
                    },
                ],
                today: [
                    { $match: { createdAt: { $gte: today } } },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            revenue: { $sum: '$totals.grandTotal' },
                        },
                    },
                ],
                thisMonth: [
                    { $match: { createdAt: { $gte: firstDayOfMonth } } },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            revenue: { $sum: '$totals.grandTotal' },
                        },
                    },
                ],
                byStatus: [
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ],
            },
        },
    ]);

    const result = stats[0];
    return {
        total: result.overall[0]?.total || 0,
        totalRevenue: result.overall[0]?.totalRevenue || 0,
        today: {
            count: result.today[0]?.count || 0,
            revenue: result.today[0]?.revenue || 0,
        },
        thisMonth: {
            count: result.thisMonth[0]?.count || 0,
            revenue: result.thisMonth[0]?.revenue || 0,
        },
        byStatus: result.byStatus.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
        }, {}),
    };
};

/**
 * Get sales report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Sales report
 */
const getSalesReport = async ({ startDate, endDate, groupBy }) => {
    const match = {
        status: { $in: ['paid', 'accepted', 'in_transit', 'delivered'] }, // Only completed orders
    };

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            match.createdAt.$lte = endOfDay;
        }
    }

    // Group by format
    let dateFormat;
    switch (groupBy) {
        case 'month':
            dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            break;
        case 'week':
            dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
            break;
        default:
            dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    // Run all aggregations in parallel
    const [salesData, summaryResult, topProducts] = await Promise.all([
        // Sales data grouped by date
        Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: dateFormat,
                    orders: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                    items: { $sum: { $size: '$items' } },
                },
            },
            { $sort: { _id: -1 } },
        ]),
        // Summary totals
        Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalItems: { $sum: { $size: '$items' } },
                    avgOrderValue: { $avg: '$totalAmount' },
                },
            },
        ]),
        // Top products by revenue
        Order.aggregate([
            { $match: match },
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
        ]),
    ]);

    const summary = summaryResult[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        avgOrderValue: 0,
    };

    return {
        period: { start: startDate, end: endDate, groupBy },
        summary: {
            totalOrders: summary.totalOrders || 0,
            totalRevenue: summary.totalRevenue || 0,
            totalItems: summary.totalItems || 0,
            avgOrderValue: Math.round(summary.avgOrderValue || 0),
        },
        salesData,
        topProducts,
    };
};

/**
 * Get inventory report
 * @returns {Promise<Object>} Inventory report
 */
const getInventoryReport = async () => {
    const [byCategory, lowStock, topValue] = await Promise.all([
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalStock: { $sum: '$stockTotal' },
                    totalValue: { $sum: { $multiply: ['$stockTotal', '$wholesalePrice'] } },
                },
            },
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $addFields: {
                    stockAvailable: { $subtract: ['$stockTotal', '$stockReserved'] },
                },
            },
            { $match: { $expr: { $lte: ['$stockAvailable', '$lowStockThreshold'] } } },
            { $limit: 10 },
            { $project: { name: 1, stockAvailable: 1, lowStockThreshold: 1, category: 1 } },
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $addFields: {
                    totalValue: { $multiply: ['$stockTotal', '$wholesalePrice'] },
                },
            },
            { $sort: { totalValue: -1 } },
            { $limit: 10 },
            { $project: { name: 1, stockTotal: 1, wholesalePrice: 1, totalValue: 1 } },
        ]),
    ]);

    return { byCategory, lowStock, topValue };
};

/**
 * Get activity log
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Activity log
 */
const getActivityLog = async (page, limit) => {
    // This would typically come from an ActivityLog model
    // For now, return recent orders as activity
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        Order.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .select('orderNumber status createdAt totals'),
        Order.countDocuments(),
    ]);

    return {
        activities: orders.map((o) => ({
            type: 'order',
            description: `Order ${o.orderNumber} - ${o.status}`,
            user: o.userId?.name || 'Unknown',
            amount: o.totals?.grandTotal,
            timestamp: o.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

module.exports = {
    getDashboardStats,
    getSalesReport,
    getInventoryReport,
    getActivityLog,
};
