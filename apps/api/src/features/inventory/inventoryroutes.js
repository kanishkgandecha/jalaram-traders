/**
 * Inventory Routes
 * =================
 * API endpoints for inventory management
 * 
 * All routes require authentication.
 * Role-based access control is enforced via middleware.
 * 
 * @module features/inventory/inventoryroutes
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('./inventorycontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');

// All routes require authentication
router.use(protect);

// ==========================================
// ADMIN + EMPLOYEE ROUTES (Stock Management)
// ==========================================

/**
 * @route   POST /api/inventory/add
 * @desc    Add stock to a product
 * @access  Admin, Employee
 */
router.post('/add', authorize('admin', 'employee'), inventoryController.addStock);

/**
 * @route   POST /api/inventory/damaged
 * @desc    Mark stock as damaged/expired
 * @access  Admin, Employee
 */
router.post('/damaged', authorize('admin', 'employee'), inventoryController.markDamaged);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get products with low stock
 * @access  Admin, Employee
 */
router.get('/low-stock', authorize('admin', 'employee'), inventoryController.getLowStock);

/**
 * @route   GET /api/inventory/out-of-stock
 * @desc    Get products that are out of stock
 * @access  Admin, Employee
 */
router.get('/out-of-stock', authorize('admin', 'employee'), inventoryController.getOutOfStock);

// ==========================================
// ADMIN ONLY ROUTES (Full Control)
// ==========================================

/**
 * @route   POST /api/inventory/adjust
 * @desc    Adjust stock (manual correction)
 * @access  Admin only
 */
router.post('/adjust', authorize('admin'), inventoryController.adjustStock);

/**
 * @route   GET /api/inventory/stats
 * @desc    Get inventory statistics
 * @access  Admin only
 */
router.get('/stats', authorize('admin'), inventoryController.getStats);

/**
 * @route   GET /api/inventory/logs
 * @desc    Get all inventory logs
 * @access  Admin only
 */
router.get('/logs', authorize('admin'), inventoryController.getAllLogs);

/**
 * @route   GET /api/inventory/logs/:productId
 * @desc    Get inventory logs for a specific product
 * @access  Admin only
 */
router.get('/logs/:productId', authorize('admin'), inventoryController.getProductLogs);

module.exports = router;
