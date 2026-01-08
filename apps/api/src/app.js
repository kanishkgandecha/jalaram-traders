/**
 * Express Application Configuration
 * ==================================
 * Main Express app setup with middleware and route mounting
 * 
 * @module app
 */

const express = require('express');
const cors = require('cors');

// ==========================================
// IMPORT FEATURE ROUTES
// ==========================================
const authRoutes = require('./features/auth/authroutes');
const usersRoutes = require('./features/users/usersroutes');
const productsRoutes = require('./features/products/productsroutes');
const cartRoutes = require('./features/cart/cartroutes');
const ordersRoutes = require('./features/orders/ordersroutes');
const paymentsRoutes = require('./features/payments/paymentsroutes');
const adminRoutes = require('./features/admin/adminroutes');

// Initialize Express app
const app = express();

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

// CORS Configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// Body Parser - JSON (with increased limit for product images)
app.use(express.json({ limit: '10mb' }));

// Body Parser - URL Encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// API ROUTES
// ==========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Jalaram Traders API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// API v1 Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/products`, productsRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, ordersRoutes);
app.use(`${API_PREFIX}/payments`, paymentsRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 Handler - Route not found
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors,
        });
    }

    // Mongoose CastError (Invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for field: ${field}`,
        });
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
        });
    }

    // Default Error Response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

module.exports = app;
