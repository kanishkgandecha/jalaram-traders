/**
 * Server Entry Point
 * ===================
 * Application entry point - loads environment, connects DB, starts server
 * 
 * @module server
 */

// Load environment variables first
require('dotenv').config();

const app = require('./app');
const connectDB = require('./shared/config/db');

// ==========================================
// CONFIGURATION
// ==========================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log('=========================================');
            console.log(`🌱 Jalaram Traders API Server`);
            console.log('=========================================');
            console.log(`📍 Environment: ${NODE_ENV}`);
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔗 API URL: http://localhost:${PORT}/api/v1`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
            console.log('=========================================');
        });

        // Graceful shutdown handlers
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        // Handle termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
            console.error(err.name, err.message);
            console.error(err.stack);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error('❌ UNHANDLED REJECTION! Shutting down...');
            console.error(err);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
