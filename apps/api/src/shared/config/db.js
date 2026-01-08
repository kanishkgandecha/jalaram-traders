/**
 * Database Configuration
 * =======================
 * MongoDB Atlas connection using Mongoose
 *
 * Cluster  : Medilink
 * Database : jalaram_traders
 *
 * @module shared/config/db
 */

const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas unreachable
      socketTimeoutMS: 45000,         // Close inactive sockets
    });

    console.log(`✅ MongoDB Connected`);
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log(`🌍 Host: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
