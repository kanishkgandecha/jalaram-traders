/**
 * Seed Admin Script
 * ==================
 * Creates an admin user for the system
 * 
 * Run with: node src/scripts/seedAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jalaram-traders';

// Admin credentials
const ADMIN_DATA = {
    name: 'Admin',
    email: 'admin@jalaram.com',
    phone: '9999999999',
    password: 'Admin@123',
    role: 'admin',
    authProvider: 'local',
    isActive: true,
};

const seedAdmin = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, salt);

        // Use direct collection access to bypass Mongoose middleware
        const usersCollection = mongoose.connection.collection('users');

        // Upsert admin user
        const result = await usersCollection.updateOne(
            { email: ADMIN_DATA.email },
            {
                $set: {
                    name: ADMIN_DATA.name,
                    email: ADMIN_DATA.email,
                    phone: ADMIN_DATA.phone,
                    password: hashedPassword,
                    role: ADMIN_DATA.role,
                    authProvider: ADMIN_DATA.authProvider,
                    isActive: ADMIN_DATA.isActive,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                }
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log('✅ Admin user created successfully!');
        } else {
            console.log('✅ Admin user updated successfully!');
        }

        console.log('\n========================================');
        console.log('  ADMIN CREDENTIALS');
        console.log('========================================');
        console.log('  Email:    ' + ADMIN_DATA.email);
        console.log('  Password: ' + ADMIN_DATA.password);
        console.log('========================================\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
