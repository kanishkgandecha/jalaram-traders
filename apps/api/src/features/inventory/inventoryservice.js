/**
 * Inventory Service
 * ==================
 * Business logic for inventory operations with atomic transactions
 * 
 * All stock operations are transaction-safe to ensure data consistency.
 * 
 * @module features/inventory/inventoryservice
 */

const mongoose = require('mongoose');
const Product = require('../products/Product');
const InventoryLog = require('./InventoryLog');

/**
 * Add stock to a product (from supplier/warehouse)
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to add (must be positive)
 * @param {string} performedBy - User ID performing the action
 * @param {string} reason - Reason for adding stock
 * @returns {Promise<Object>} Updated product and log entry
 */
const addStock = async (productId, quantity, performedBy, reason = 'Stock received from supplier') => {
    if (quantity <= 0) {
        const error = new Error('Quantity must be positive');
        error.statusCode = 400;
        throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        // Save previous state
        const previousStockTotal = product.stockTotal;
        const previousStockReserved = product.stockReserved;

        // Update stock
        product.stockTotal += quantity;
        await product.save({ session });

        // Create log entry
        const log = await InventoryLog.create(
            [
                {
                    product: productId,
                    actionType: 'ADD',
                    quantity,
                    previousStockTotal,
                    previousStockReserved,
                    newStockTotal: product.stockTotal,
                    newStockReserved: product.stockReserved,
                    performedBy,
                    reason,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            product,
            log: log[0],
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Adjust stock (manual correction with reason)
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity adjustment (positive or negative)
 * @param {string} performedBy - User ID performing the action
 * @param {string} reason - Required reason for adjustment
 * @returns {Promise<Object>} Updated product and log entry
 */
const adjustStock = async (productId, quantity, performedBy, reason) => {
    if (!reason || reason.trim().length === 0) {
        const error = new Error('Reason is required for stock adjustment');
        error.statusCode = 400;
        throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        // Save previous state
        const previousStockTotal = product.stockTotal;
        const previousStockReserved = product.stockReserved;

        // Calculate new stock
        const newStockTotal = product.stockTotal + quantity;

        if (newStockTotal < 0) {
            const error = new Error('Adjustment would result in negative stock');
            error.statusCode = 400;
            throw error;
        }

        // Ensure available stock doesn't go negative
        if (newStockTotal < product.stockReserved) {
            const error = new Error('Cannot reduce stock below reserved amount');
            error.statusCode = 400;
            throw error;
        }

        // Update stock
        product.stockTotal = newStockTotal;
        await product.save({ session });

        // Create log entry
        const log = await InventoryLog.create(
            [
                {
                    product: productId,
                    actionType: 'ADJUST',
                    quantity,
                    previousStockTotal,
                    previousStockReserved,
                    newStockTotal: product.stockTotal,
                    newStockReserved: product.stockReserved,
                    performedBy,
                    reason,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            product,
            log: log[0],
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Reserve stock for a pending order
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to reserve
 * @param {string} orderId - Related order ID
 * @param {string} performedBy - User ID (usually system or retailer)
 * @returns {Promise<Object>} Updated product and log entry
 */
const reserveStock = async (productId, quantity, orderId, performedBy) => {
    if (quantity <= 0) {
        const error = new Error('Quantity must be positive');
        error.statusCode = 400;
        throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        // Check available stock
        const availableStock = product.stockTotal - product.stockReserved;
        if (availableStock < quantity) {
            const error = new Error(
                `Insufficient stock for "${product.name}". Available: ${availableStock} ${product.unit}`
            );
            error.statusCode = 400;
            throw error;
        }

        // Save previous state
        const previousStockTotal = product.stockTotal;
        const previousStockReserved = product.stockReserved;

        // Reserve stock
        product.stockReserved += quantity;
        await product.save({ session });

        // Create log entry
        const log = await InventoryLog.create(
            [
                {
                    product: productId,
                    actionType: 'RESERVE',
                    quantity,
                    previousStockTotal,
                    previousStockReserved,
                    newStockTotal: product.stockTotal,
                    newStockReserved: product.stockReserved,
                    performedBy,
                    order: orderId,
                    reason: `Stock reserved for order`,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            product,
            log: log[0],
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Release reserved stock (order cancelled/expired)
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to release
 * @param {string} orderId - Related order ID
 * @param {string} performedBy - User ID performing the action
 * @param {string} reason - Reason for release (cancellation, expiration)
 * @returns {Promise<Object>} Updated product and log entry
 */
const releaseStock = async (productId, quantity, orderId, performedBy, reason = 'Order cancelled') => {
    if (quantity <= 0) {
        const error = new Error('Quantity must be positive');
        error.statusCode = 400;
        throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        // Check reserved stock
        if (product.stockReserved < quantity) {
            const error = new Error('Cannot release more stock than reserved');
            error.statusCode = 400;
            throw error;
        }

        // Save previous state
        const previousStockTotal = product.stockTotal;
        const previousStockReserved = product.stockReserved;

        // Release reserved stock
        product.stockReserved -= quantity;
        await product.save({ session });

        // Create log entry
        const log = await InventoryLog.create(
            [
                {
                    product: productId,
                    actionType: 'RELEASE',
                    quantity,
                    previousStockTotal,
                    previousStockReserved,
                    newStockTotal: product.stockTotal,
                    newStockReserved: product.stockReserved,
                    performedBy,
                    order: orderId,
                    reason,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            product,
            log: log[0],
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Deduct stock from reserved (order confirmed/paid)
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to deduct
 * @param {string} orderId - Related order ID
 * @param {string} performedBy - User ID performing the action
 * @returns {Promise<Object>} Updated product and log entry
 */
const deductStock = async (productId, quantity, orderId, performedBy) => {
    if (quantity <= 0) {
        const error = new Error('Quantity must be positive');
        error.statusCode = 400;
        throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        // Check reserved stock
        if (product.stockReserved < quantity) {
            const error = new Error('Cannot deduct more stock than reserved');
            error.statusCode = 400;
            throw error;
        }

        // Save previous state
        const previousStockTotal = product.stockTotal;
        const previousStockReserved = product.stockReserved;

        // Deduct from both total and reserved
        product.stockTotal -= quantity;
        product.stockReserved -= quantity;
        await product.save({ session });

        // Create log entry
        const log = await InventoryLog.create(
            [
                {
                    product: productId,
                    actionType: 'DEDUCT',
                    quantity,
                    previousStockTotal,
                    previousStockReserved,
                    newStockTotal: product.stockTotal,
                    newStockReserved: product.stockReserved,
                    performedBy,
                    order: orderId,
                    reason: 'Order confirmed - stock deducted',
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            product,
            log: log[0],
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Mark stock as damaged/expired
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {number} quantity - Quantity to mark as damaged
 * @param {string} performedBy - User ID performing the action
 * @param {string} reason - Required reason for marking as damaged
 * @returns {Promise<Object>} Updated product and log entry
 */
const markDamaged = async (productId, quantity, performedBy, reason) => {
    if (quantity <= 0) {
        const error = new Error('Quantity must be positive');
        error.statusCode = 400;
        throw error;
    }

    if (!reason || reason.trim().length === 0) {
        const error = new Error('Reason is required for damaged stock');
        error.statusCode = 400;
        throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        // Check available stock (can only damage available, not reserved)
        const availableStock = product.stockTotal - product.stockReserved;
        if (availableStock < quantity) {
            const error = new Error(
                `Cannot mark ${quantity} as damaged. Only ${availableStock} ${product.unit} available (not reserved)`
            );
            error.statusCode = 400;
            throw error;
        }

        // Save previous state
        const previousStockTotal = product.stockTotal;
        const previousStockReserved = product.stockReserved;

        // Reduce total stock
        product.stockTotal -= quantity;
        await product.save({ session });

        // Create log entry
        const log = await InventoryLog.create(
            [
                {
                    product: productId,
                    actionType: 'DAMAGED',
                    quantity: -quantity,
                    previousStockTotal,
                    previousStockReserved,
                    newStockTotal: product.stockTotal,
                    newStockReserved: product.stockReserved,
                    performedBy,
                    reason,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            product,
            log: log[0],
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get inventory logs for a product
 * @param {string} productId - Product's MongoDB ObjectId
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Logs and pagination
 */
const getInventoryLogs = async (productId, options = {}) => {
    return await InventoryLog.getLogsForProduct(productId, options);
};

/**
 * Get all inventory logs with filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Logs and pagination
 */
const getAllInventoryLogs = async (options = {}) => {
    return await InventoryLog.getAllLogs(options);
};

/**
 * Get inventory statistics
 * @returns {Promise<Object>} Inventory statistics
 */
const getInventoryStats = async () => {
    const [productStats, recentLogs, actionBreakdown] = await Promise.all([
        // Product stock statistics
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStockValue: { $sum: { $multiply: ['$stockTotal', '$basePrice'] } },
                    totalStockUnits: { $sum: '$stockTotal' },
                    totalReserved: { $sum: '$stockReserved' },
                    outOfStock: {
                        $sum: {
                            $cond: [{ $lte: [{ $subtract: ['$stockTotal', '$stockReserved'] }, 0] }, 1, 0],
                        },
                    },
                    lowStock: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gt: [{ $subtract: ['$stockTotal', '$stockReserved'] }, 0] },
                                        { $lte: [{ $subtract: ['$stockTotal', '$stockReserved'] }, '$lowStockThreshold'] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]),

        // Recent logs count (last 24 hours)
        InventoryLog.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),

        // Action type breakdown (last 7 days)
        InventoryLog.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            {
                $group: {
                    _id: '$actionType',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                },
            },
        ]),
    ]);

    return {
        products: productStats[0] || {
            totalProducts: 0,
            totalStockValue: 0,
            totalStockUnits: 0,
            totalReserved: 0,
            outOfStock: 0,
            lowStock: 0,
        },
        recentActivityCount: recentLogs,
        actionBreakdown: actionBreakdown.reduce((acc, item) => {
            acc[item._id] = { count: item.count, totalQuantity: item.totalQuantity };
            return acc;
        }, {}),
    };
};

/**
 * Get low stock products
 * @param {number} limit - Maximum products to return
 * @returns {Promise<Array>} Low stock products
 */
const getLowStockProducts = async (limit = 20) => {
    return await Product.aggregate([
        { $match: { isActive: true } },
        {
            $addFields: {
                stockAvailable: { $subtract: ['$stockTotal', '$stockReserved'] },
            },
        },
        {
            $match: {
                $expr: { $lte: ['$stockAvailable', '$lowStockThreshold'] },
            },
        },
        { $sort: { stockAvailable: 1 } },
        { $limit: limit },
        {
            $project: {
                name: 1,
                category: 1,
                stockTotal: 1,
                stockReserved: 1,
                stockAvailable: 1,
                lowStockThreshold: 1,
                unit: 1,
            },
        },
    ]);
};

/**
 * Get out of stock products
 * @param {number} limit - Maximum products to return
 * @returns {Promise<Array>} Out of stock products
 */
const getOutOfStockProducts = async (limit = 20) => {
    return await Product.aggregate([
        { $match: { isActive: true } },
        {
            $addFields: {
                stockAvailable: { $subtract: ['$stockTotal', '$stockReserved'] },
            },
        },
        {
            $match: {
                $expr: { $lte: ['$stockAvailable', 0] },
            },
        },
        { $sort: { name: 1 } },
        { $limit: limit },
        {
            $project: {
                name: 1,
                category: 1,
                stockTotal: 1,
                stockReserved: 1,
                stockAvailable: 1,
                unit: 1,
            },
        },
    ]);
};

module.exports = {
    addStock,
    adjustStock,
    reserveStock,
    releaseStock,
    deductStock,
    markDamaged,
    getInventoryLogs,
    getAllInventoryLogs,
    getInventoryStats,
    getLowStockProducts,
    getOutOfStockProducts,
};
