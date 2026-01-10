/**
 * Profile Routes
 * ================
 * API routes for user profile operations
 * 
 * All routes require authentication
 * 
 * @module features/profile/profileroutes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const profileController = require('./profilecontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { handleProfileUpload } = require('../../shared/middleware/uploadmiddleware');

// ==========================================
// VALIDATION RULES
// ==========================================

const updateProfileValidation = [
    body('name')
        .optional({ values: 'falsy' })
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),

    body('phone')
        .optional({ values: 'falsy' })
        .trim()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian mobile number'),

    body('businessName')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 200 })
        .withMessage('Business name cannot exceed 200 characters'),

    body('gstin')
        .optional({ values: 'falsy' })
        .trim()
        .toUpperCase()
        .custom((value) => {
            // Skip validation if empty or not provided
            if (!value || value === '') {
                return true;
            }
            // GSTIN must be exactly 15 characters
            if (value.length !== 15) {
                throw new Error('GSTIN must be exactly 15 characters');
            }
            // Validate GSTIN format
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(value)) {
                throw new Error('Please enter a valid GSTIN (e.g., 27AABCU9603R1ZM)');
            }
            return true;
        }),

    body('address.street')
        .optional({ values: 'falsy' })
        .trim(),

    body('address.city')
        .optional({ values: 'falsy' })
        .trim(),

    body('address.district')
        .optional({ values: 'falsy' })
        .trim(),

    body('address.state')
        .optional({ values: 'falsy' })
        .trim(),

    body('address.pincode')
        .optional({ values: 'falsy' })
        .trim()
        .matches(/^[1-9][0-9]{5}$/)
        .withMessage('Please enter a valid 6-digit pincode'),
];

// Validation middleware
const validate = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    next();
};

// ==========================================
// ROUTES
// ==========================================

// All routes require authentication
router.use(protect);

// GET /api/v1/profile - Get current user's profile
router.get('/', profileController.getProfile);

// PUT /api/v1/profile - Update current user's profile
router.put('/', updateProfileValidation, validate, profileController.updateProfile);

// POST /api/v1/profile/image - Upload profile image
router.post('/image', handleProfileUpload, profileController.uploadProfileImage);

// DELETE /api/v1/profile/image - Remove profile image
router.delete('/image', profileController.removeProfileImage);

module.exports = router;
