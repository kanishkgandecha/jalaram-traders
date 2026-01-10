/**
 * Inventory Controller
 * =====================
 * HTTP request handlers for inventory operations
 * 
 * @module features/inventory/inventorycontroller
 */

const inventoryService = require('./inventoryservice');

/**
 * Add stock to a product
 * POST /api/inventory/add
 * Roles: Admin, Employee
 */
const addStock = async (req, res) => {
    try {
        const { productId, quantity, reason } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required',
            });
        }

        const result = await inventoryService.addStock(
            productId,
            parseInt(quantity),
            req.user._id,
            reason
        );

        res.status(200).json({
            success: true,
            message: `Successfully added ${quantity} units to stock`,
            data: result,
        });
    } catch (error) {
        console.error('Add stock error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to add stock',
        });
    }
};

/**
 * Adjust stock (manual correction)
 * POST /api/inventory/adjust
 * Roles: Admin only
 */
const adjustStock = async (req, res) => {
    try {
        const { productId, quantity, reason } = req.body;

        if (!productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required',
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required for stock adjustment',
            });
        }

        const result = await inventoryService.adjustStock(
            productId,
            parseInt(quantity),
            req.user._id,
            reason
        );

        res.status(200).json({
            success: true,
            message: `Successfully adjusted stock by ${quantity} units`,
            data: result,
        });
    } catch (error) {
        console.error('Adjust stock error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to adjust stock',
        });
    }
};

/**
 * Mark stock as damaged/expired
 * POST /api/inventory/damaged
 * Roles: Admin, Employee
 */
const markDamaged = async (req, res) => {
    try {
        const { productId, quantity, reason } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required',
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required for marking stock as damaged',
            });
        }

        const result = await inventoryService.markDamaged(
            productId,
            parseInt(quantity),
            req.user._id,
            reason
        );

        res.status(200).json({
            success: true,
            message: `Successfully marked ${quantity} units as damaged`,
            data: result,
        });
    } catch (error) {
        console.error('Mark damaged error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to mark stock as damaged',
        });
    }
};

/**
 * Get inventory logs for a product
 * GET /api/inventory/logs/:productId
 * Roles: Admin only
 */
const getProductLogs = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page, limit, actionType, startDate, endDate } = req.query;

        const result = await inventoryService.getInventoryLogs(productId, {
            page,
            limit,
            actionType,
            startDate,
            endDate,
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get product logs error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to get inventory logs',
        });
    }
};

/**
 * Get all inventory logs
 * GET /api/inventory/logs
 * Roles: Admin only
 */
const getAllLogs = async (req, res) => {
    try {
        const { page, limit, actionType, productId, performedBy, startDate, endDate } = req.query;

        const result = await inventoryService.getAllInventoryLogs({
            page,
            limit,
            actionType,
            productId,
            performedBy,
            startDate,
            endDate,
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get all logs error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to get inventory logs',
        });
    }
};

/**
 * Get inventory statistics
 * GET /api/inventory/stats
 * Roles: Admin only
 */
const getStats = async (req, res) => {
    try {
        const stats = await inventoryService.getInventoryStats();

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to get inventory statistics',
        });
    }
};

/**
 * Get low stock products
 * GET /api/inventory/low-stock
 * Roles: Admin, Employee
 */
const getLowStock = async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await inventoryService.getLowStockProducts(parseInt(limit) || 20);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to get low stock products',
        });
    }
};

/**
 * Get out of stock products
 * GET /api/inventory/out-of-stock
 * Roles: Admin, Employee
 */
const getOutOfStock = async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await inventoryService.getOutOfStockProducts(parseInt(limit) || 20);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error('Get out of stock error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to get out of stock products',
        });
    }
};

module.exports = {
    addStock,
    adjustStock,
    markDamaged,
    getProductLogs,
    getAllLogs,
    getStats,
    getLowStock,
    getOutOfStock,
};
