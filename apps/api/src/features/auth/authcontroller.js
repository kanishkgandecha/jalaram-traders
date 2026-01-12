/**
 * Auth Controller
 * ================
 * Request handlers for authentication endpoints
 * 
 * @module features/auth/authcontroller
 */

const authService = require('./authservice');
const googleAuthService = require('./googleauthservice');
const otpService = require('./otpservice');
const { sendOTPEmail } = require('../../shared/services/emailservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { user, token } = await authService.registerUser(req.body);

        sendSuccess(res, 201, 'Registration successful', {
            user,
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validate input
        if (!identifier || !password) {
            return sendError(res, 400, 'Please provide email/phone and password');
        }

        const { user, token } = await authService.loginUser(identifier, password);

        sendSuccess(res, 200, 'Login successful', {
            user,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Google OAuth login
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return sendError(res, 400, 'Google ID token is required');
        }

        const { user, token } = await googleAuthService.googleLogin(idToken);

        sendSuccess(res, 200, 'Google login successful', {
            user,
            token,
        });
    } catch (error) {
        console.error('Google login error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await authService.getUserProfile(req.user._id);

        sendSuccess(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
        console.error('Get profile error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
const updateMe = async (req, res) => {
    try {
        const user = await authService.updateUserProfile(req.user._id, req.body);

        sendSuccess(res, 200, 'Profile updated successfully', { user });
    } catch (error) {
        console.error('Update profile error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 400, 'Please provide current and new password');
        }

        if (newPassword.length < 6) {
            return sendError(res, 400, 'New password must be at least 6 characters');
        }

        const { user, token } = await authService.changePassword(
            req.user._id,
            currentPassword,
            newPassword
        );

        sendSuccess(res, 200, 'Password changed successfully', {
            user,
            token,
        });
    } catch (error) {
        console.error('Change password error:', error);
        sendError(res, error.statusCode || 500, error.message);
    }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
    // JWT is stateless, so logout is handled client-side by removing the token
    // This endpoint exists for consistency and potential future enhancements
    // (e.g., token blacklisting, refresh token revocation)

    sendSuccess(res, 200, 'Logged out successfully');
};

/**
 * @desc    Request password reset OTP
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return sendError(res, 400, 'Please provide email or username');
        }

        console.log(`[OTP] Password reset requested for: ${identifier}`);
        const result = await otpService.requestPasswordReset(identifier);

        if (!result.success) {
            console.log(`[OTP] Request blocked: ${result.message}`);
            return sendError(res, 400, result.message);
        }

        // Send OTP via email if user was found
        if (result.otp && result.email) {
            // Log OTP in development for easy testing
            console.log(`\n========================================`);
            console.log(`[OTP] For: ${identifier}`);
            console.log(`[OTP] Code: ${result.otp}`);
            console.log(`[OTP] Email: ${result.email}`);
            console.log(`========================================\n`);

            // Send email
            const emailResult = await sendOTPEmail(result.email, result.otp, result.expiryMinutes);
            if (emailResult.success) {
                console.log(`[OTP] Email sent successfully to ${result.email}`);
            } else {
                console.log(`[OTP] Email failed: ${emailResult.error} (OTP logged above)`);
            }
        } else {
            console.log(`[OTP] User not found (showing generic response for security)`);
        }

        // Always return same message (security - don't reveal if user exists)
        sendSuccess(res, 200, result.message);
    } catch (error) {
        console.error('Forgot password error:', error);
        sendError(res, 500, 'An error occurred. Please try again.');
    }
};

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return sendError(res, 400, 'Please provide email/username and OTP');
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return sendError(res, 400, 'Invalid OTP format');
        }

        const result = await otpService.verifyPasswordResetOTP(identifier, otp);

        if (!result.success) {
            return sendError(res, 400, result.message);
        }

        sendSuccess(res, 200, result.message, {
            verified: true
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        sendError(res, 500, 'An error occurred. Please try again.');
    }
};

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    try {
        const { identifier, newPassword } = req.body;

        if (!identifier || !newPassword) {
            return sendError(res, 400, 'Please provide email/username and new password');
        }

        if (newPassword.length < 6) {
            return sendError(res, 400, 'Password must be at least 6 characters');
        }

        const result = await otpService.resetPassword(identifier, newPassword);

        if (!result.success) {
            return sendError(res, 400, result.message);
        }

        sendSuccess(res, 200, result.message);
    } catch (error) {
        console.error('Reset password error:', error);
        sendError(res, 500, 'An error occurred. Please try again.');
    }
};

module.exports = {
    register,
    login,
    googleLogin,
    getMe,
    updateMe,
    changePassword,
    logout,
    forgotPassword,
    verifyOTP,
    resetPassword,
};
