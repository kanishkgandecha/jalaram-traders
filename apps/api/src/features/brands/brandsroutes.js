/**
 * Brands Routes
 * ==============
 * API routes for brand management
 */

const express = require('express');
const router = express.Router();
const brandsController = require('./brandscontroller');
const { protect } = require('../../shared/middleware/authmiddleware');
const { authorize } = require('../../shared/middleware/rolemiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../../uploads/brands');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const brandName = req.body.brandName || 'brand';
        const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const ext = path.extname(file.originalname);
        cb(null, `${slug}-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /jpeg|jpg|png|gif|webp|svg/;
        const allowedMimeTypes = /image\/(jpeg|jpg|png|gif|webp|svg\+xml)/;
        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    },
});

// Public routes
router.get('/', brandsController.getAllBrands);
router.get('/:slug', brandsController.getBrand);

// Admin only routes
router.post('/', protect, authorize('admin'), brandsController.upsertBrand);
router.post(
    '/upload-logo',
    protect,
    authorize('admin'),
    upload.single('logo'),
    brandsController.uploadLogo
);
router.delete('/:id', protect, authorize('admin'), brandsController.deleteBrand);

module.exports = router;
