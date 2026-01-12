/**
 * OTP Service
 * ============
 * Secure OTP generation and validation for password reset
 * 
 * Features:
 * - 6-digit numeric OTP generation
 * - OTP hashing with bcrypt
 * - OTP verification with expiry check
 * - Rate limiting support
 * - Brute-force prevention
 * 
 * @module features/auth/otpservice
 */

const bcrypt = require('bcryptjs');
const User = require('./User');

// Configuration from environment variables with defaults
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_RATE_LIMIT_MINUTES = parseInt(process.env.OTP_RATE_LIMIT_MINUTES) || 15;
const OTP_SALT_ROUNDS = 10;

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    // Generate random 6-digit number (100000 to 999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};

/**
 * Hash OTP before storing in database
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
const hashOTP = async (otp) => {
    const salt = await bcrypt.genSalt(OTP_SALT_ROUNDS);
    return bcrypt.hash(otp, salt);
};

/**
 * Verify plain OTP against hashed OTP
 * @param {string} plainOTP - User-provided OTP
 * @param {string} hashedOTP - Stored hashed OTP
 * @returns {Promise<boolean>} True if OTP matches
 */
const verifyOTP = async (plainOTP, hashedOTP) => {
    if (!plainOTP || !hashedOTP) return false;
    return bcrypt.compare(plainOTP, hashedOTP);
};

/**
 * Check if OTP has expired
 * @param {Date} expiryDate - OTP expiry timestamp
 * @returns {boolean} True if expired
 */
const isOTPExpired = (expiryDate) => {
    if (!expiryDate) return true;
    return new Date() > new Date(expiryDate);
};

/**
 * Calculate OTP expiry timestamp from now
 * @returns {Date} Expiry timestamp
 */
const getOTPExpiry = () => {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

/**
 * Progressive rate limiting delays (in minutes)
 * 1st request: immediate
 * 2nd request: 2 minutes
 * 3rd request: 5 minutes
 * 4th request: 10 minutes
 * 5th+ request: 120 minutes (2 hours)
 */
const RATE_LIMIT_DELAYS = [0, 2, 5, 10, 120];

/**
 * Get rate limit delay based on request count
 * @param {number} requestCount - Number of previous OTP requests
 * @returns {number} Delay in minutes before next request allowed
 */
const getRateLimitDelay = (requestCount) => {
    if (requestCount <= 0) return 0;
    if (requestCount >= RATE_LIMIT_DELAYS.length) {
        return RATE_LIMIT_DELAYS[RATE_LIMIT_DELAYS.length - 1];
    }
    return RATE_LIMIT_DELAYS[requestCount];
};

/**
 * Check if user can request a new OTP (progressive rate limiting)
 * @param {Date} lastOTPRequest - Timestamp of last OTP request
 * @param {number} requestCount - Number of previous OTP requests
 * @returns {Object} { allowed: boolean, waitTime: number (in minutes) }
 */
const canRequestOTP = (lastOTPRequest, requestCount = 0) => {
    // First request is always allowed
    if (!lastOTPRequest || requestCount === 0) {
        return { allowed: true, waitTime: 0 };
    }

    const delayMinutes = getRateLimitDelay(requestCount);
    const delayMs = delayMinutes * 60 * 1000;
    const timeSinceLastRequest = Date.now() - new Date(lastOTPRequest).getTime();

    if (timeSinceLastRequest < delayMs) {
        const waitTime = Math.ceil((delayMs - timeSinceLastRequest) / 60000);
        return { allowed: false, waitTime };
    }

    return { allowed: true, waitTime: 0 };
};

/**
 * Check if user has exceeded OTP verification attempts
 * @param {number} attempts - Current attempt count
 * @returns {boolean} True if exceeded
 */
const hasExceededAttempts = (attempts) => {
    return attempts >= OTP_MAX_ATTEMPTS;
};

/**
 * Request password reset OTP for a user
 * @param {string} identifier - Email or username
 * @returns {Promise<Object>} { success, otp (for email sending), message }
 */
const requestPasswordReset = async (identifier) => {
    // Find user by email or username
    const user = await User.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    });

    // Generic response to prevent user enumeration
    if (!user) {
        // Return success even if user not found (security)
        return {
            success: true,
            message: 'If an account exists with this email/username, you will receive an OTP.',
            userFound: false
        };
    }

    // Check if Google-only user (no password set)
    if (user.authProvider === 'google' && !user.password) {
        return {
            success: false,
            message: 'This account uses Google Sign-In. Please use Google to access your account.',
            userFound: true
        };
    }

    // Check progressive rate limiting
    const rateCheck = canRequestOTP(user.lastOTPRequest, user.otpRequestCount || 0);
    if (!rateCheck.allowed) {
        return {
            success: false,
            message: `Please wait ${rateCheck.waitTime} minute(s) before requesting another OTP.`,
            userFound: true
        };
    }

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    // Update user with OTP data and increment request count
    user.resetOTP = hashedOTP;
    user.resetOTPExpiry = getOTPExpiry();
    user.resetOTPAttempts = 0; // Reset attempts on new OTP request
    user.lastOTPRequest = new Date();
    user.otpRequestCount = (user.otpRequestCount || 0) + 1; // Increment for progressive rate limiting
    await user.save({ validateBeforeSave: false });

    return {
        success: true,
        message: 'If an account exists with this email/username, you will receive an OTP.',
        userFound: true,
        otp, // Plain OTP - for email sending only, NEVER log or store this
        email: user.email,
        userId: user._id,
        expiryMinutes: OTP_EXPIRY_MINUTES
    };
};

/**
 * Verify OTP and return temp token for password reset
 * @param {string} identifier - Email or username
 * @param {string} otp - User-provided OTP
 * @returns {Promise<Object>} { success, resetToken, message }
 */
const verifyPasswordResetOTP = async (identifier, otp) => {
    // Find user by email or username
    const user = await User.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    });

    // Generic error for security
    if (!user || !user.resetOTP) {
        return { success: false, message: 'Invalid or expired OTP' };
    }

    // Check if exceeded attempts
    if (hasExceededAttempts(user.resetOTPAttempts)) {
        // Clear OTP after too many failed attempts
        user.resetOTP = null;
        user.resetOTPExpiry = null;
        user.resetOTPAttempts = 0;
        await user.save({ validateBeforeSave: false });

        return {
            success: false,
            message: 'Too many failed attempts. Please request a new OTP.'
        };
    }

    // Check if OTP expired
    if (isOTPExpired(user.resetOTPExpiry)) {
        return { success: false, message: 'Invalid or expired OTP' };
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, user.resetOTP);

    if (!isValid) {
        // Increment failed attempts
        user.resetOTPAttempts += 1;
        await user.save({ validateBeforeSave: false });

        const remainingAttempts = OTP_MAX_ATTEMPTS - user.resetOTPAttempts;
        return {
            success: false,
            message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
        };
    }

    // OTP is valid - generate temp reset token
    // We don't clear OTP yet - it will be cleared after password reset
    // Mark OTP as verified by setting resetOTPAttempts to -1 (special flag)
    user.resetOTPAttempts = -1; // Indicates OTP verified
    await user.save({ validateBeforeSave: false });

    return {
        success: true,
        message: 'OTP verified successfully',
        userId: user._id,
        email: user.email
    };
};

/**
 * Reset password after OTP verification
 * @param {string} identifier - Email or username
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} { success, message }
 */
const resetPassword = async (identifier, newPassword) => {
    // Find user by email or username
    const user = await User.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    });

    if (!user) {
        return { success: false, message: 'Invalid request' };
    }

    // Check if OTP was verified (resetOTPAttempts should be -1)
    if (user.resetOTPAttempts !== -1) {
        return { success: false, message: 'Please verify OTP first' };
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;

    // Clear all OTP fields and reset request count
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    user.resetOTPAttempts = 0;
    user.otpRequestCount = 0; // Reset for fresh progressive rate limiting

    // Update passwordChangedAt for JWT invalidation
    user.passwordChangedAt = new Date();

    await user.save();

    return {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.'
    };
};

module.exports = {
    generateOTP,
    hashOTP,
    verifyOTP,
    isOTPExpired,
    getOTPExpiry,
    canRequestOTP,
    hasExceededAttempts,
    requestPasswordReset,
    verifyPasswordResetOTP,
    resetPassword,
    // Export config for testing
    config: {
        OTP_EXPIRY_MINUTES,
        OTP_MAX_ATTEMPTS,
        OTP_RATE_LIMIT_MINUTES
    }
};
