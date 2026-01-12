/**
 * User Model
 * ===========
 * MongoDB schema for users with role-based access
 * 
 * Roles:
 * - admin: Full system access (owner/manager)
 * - employee: Staff with limited admin capabilities
 * - retailer: B2B wholesale customers
 * - farmer: Individual customers (future-ready)
 * 
 * @module features/auth/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        // Basic Information
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },

        // Username - auto-generated, editable only once
        username: {
            type: String,
            unique: true,
            sparse: true, // Allow null for migration of existing users
            lowercase: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
            match: [
                /^[a-z0-9_]+$/,
                'Username can only contain lowercase letters, numbers, and underscores',
            ],
        },

        // Track if username has been changed (allowed only once)
        usernameChanged: {
            type: Boolean,
            default: false,
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email',
            ],
        },

        phone: {
            type: String,
            // Phone is optional for Google auth users, required for local auth
            required: [
                function () { return this.authProvider === 'local'; },
                'Phone number is required'
            ],
            sparse: true, // Allow null/undefined for Google users
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
        },

        password: {
            type: String,
            // Password is optional for Google auth users, required for local auth
            required: [
                function () { return this.authProvider === 'local'; },
                'Password is required'
            ],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password in queries by default
        },

        // Google OAuth
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Allow null values while maintaining uniqueness
        },

        // Role & Access
        role: {
            type: String,
            enum: {
                values: ['admin', 'employee', 'retailer', 'farmer'],
                message: 'Role must be admin, employee, retailer, or farmer',
            },
            default: 'farmer',
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // Profile Image
        profileImage: {
            type: String,
            default: null,
        },

        // Authentication Provider
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },

        // Business Information (for retailers)
        businessName: {
            type: String,
            trim: true,
            maxlength: [200, 'Business name cannot exceed 200 characters'],
        },

        gstin: {
            type: String,
            trim: true,
            uppercase: true,
            match: [
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                'Please enter a valid GSTIN',
            ],
        },

        // Address
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            district: { type: String, trim: true },
            state: { type: String, trim: true, default: 'Maharashtra' },
            pincode: {
                type: String,
                trim: true,
                match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode'],
            },
        },

        // Retailer-specific fields
        creditLimit: {
            type: Number,
            default: 0,
            min: [0, 'Credit limit cannot be negative'],
        },

        outstandingBalance: {
            type: Number,
            default: 0,
        },

        // Metadata
        lastLogin: {
            type: Date,
        },

        passwordChangedAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ==========================================
// INDEXES
// ==========================================

// Compound indexes for common queries
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'address.district': 1 });

// ==========================================
// PRE-SAVE MIDDLEWARE
// ==========================================

/**
 * Hash password before saving
 */
userSchema.pre('save', async function () {
    // Only hash if password is modified and exists
    if (!this.isModified('password') || !this.password) {
        return;
    }

    // Hash password with cost factor 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Set passwordChangedAt
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
    }
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Check if password was changed after token was issued
 * @param {number} tokenTimestamp - JWT iat timestamp
 * @returns {boolean} - True if password was changed after token
 */
userSchema.methods.passwordChangedAfter = function (tokenTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return tokenTimestamp < changedTimestamp;
    }
    return false;
};

// ==========================================
// VIRTUALS
// ==========================================

/**
 * Full address as a single string
 */
userSchema.virtual('fullAddress').get(function () {
    const parts = [];
    if (this.address?.street) parts.push(this.address.street);
    if (this.address?.city) parts.push(this.address.city);
    if (this.address?.district) parts.push(this.address.district);
    if (this.address?.state) parts.push(this.address.state);
    if (this.address?.pincode) parts.push(this.address.pincode);
    return parts.join(', ');
});

module.exports = mongoose.model('User', userSchema);
