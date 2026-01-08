/**
 * Auth Controller
 * ================
 * Request handlers for authentication endpoints
 * 
 * @module features/auth/authcontroller
 */

const authService = require('./authservice');
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

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    changePassword,
    logout,
};
