/**
 * Upload Middleware
 * ==================
 * Multer configuration for secure file uploads
 * 
 * @module shared/middleware/uploadmiddleware
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: userId_timestamp.ext
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${req.user._id}_${Date.now()}${ext}`;
        cb(null, filename);
    },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'), false);
    }
};

// Multer configuration for profile images
const uploadProfileImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max
    },
}).single('profileImage');

// Wrapper to handle multer errors
const handleProfileUpload = (req, res, next) => {
    uploadProfileImage(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 2MB.',
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }
        next();
    });
};

module.exports = {
    handleProfileUpload,
    uploadDir,
};
