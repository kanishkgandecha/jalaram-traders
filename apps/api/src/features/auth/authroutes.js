/**
 * Auth Routes
 * ============
 * Route definitions for authentication endpoints
 * 
 * Routes:
 * - POST /register         - Create new account
 * - POST /login            - Authenticate user
 * - POST /google           - Google OAuth login
 * - POST /forgot-password  - Request password reset OTP
 * - POST /verify-otp       - Verify OTP
 * - POST /reset-password   - Reset password
 * - GET  /me               - Get current user profile
 * - PUT  /me               - Update current user profile
 * - PUT  /change-password  - Change password
 * - POST /logout           - Logout user
 * 
 * @module features/auth/authroutes
 */

const express = require('express');
const router = express.Router();
const authController = require('./authcontroller');
const { protect } = require('../../shared/middleware/authmiddleware');

// ==========================================
// PUBLIC ROUTES
// ==========================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Google OAuth login (retailers only)
 * @access  Public
 */
router.post('/google', authController.googleLogin);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP for password reset
 * @access  Public
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password after OTP verification
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

// ==========================================
// PROTECTED ROUTES
// ==========================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   PUT /api/v1/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', protect, authController.updateMe);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put('/change-password', protect, authController.changePassword);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

module.exports = router;
