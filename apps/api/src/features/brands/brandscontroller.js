/**
 * Brands Controller
 * ==================
 * HTTP handlers for brand endpoints
 */

const brandsService = require('./brandsservice');
const { sendSuccess, sendError } = require('../../shared/utils/responsehelper');
const path = require('path');
const fs = require('fs');

/**
 * Get all brands
 */
const getAllBrands = async (req, res, next) => {
    try {
        const brands = await brandsService.getAllBrands();
        return sendSuccess(res, 200, 'Brands fetched successfully', brands);
    } catch (err) {
        next(err);
    }
};

/**
 * Get brand by slug
 */
const getBrand = async (req, res, next) => {
    try {
        const brand = await brandsService.getBrand(req.params.slug);
        if (!brand) {
            return sendError(res, 404, 'Brand not found');
        }
        return sendSuccess(res, 200, 'Brand fetched successfully', brand);
    } catch (err) {
        next(err);
    }
};

/**
 * Create or update brand
 */
const upsertBrand = async (req, res, next) => {
    try {
        const brand = await brandsService.upsertBrand(req.body);
        return sendSuccess(res, 201, 'Brand saved successfully', brand);
    } catch (err) {
        next(err);
    }
};

/**
 * Upload brand logo
 */
const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 400, 'No file uploaded');
        }

        const { brandName } = req.body;
        if (!brandName) {
            return sendError(res, 400, 'Brand name is required');
        }

        // Construct logo URL
        const logoUrl = `/uploads/brands/${req.file.filename}`;

        const brand = await brandsService.updateLogo(brandName, logoUrl);

        return sendSuccess(res, 200, 'Logo uploaded successfully', brand);
    } catch (err) {
        next(err);
    }
};

/**
 * Delete brand
 */
const deleteBrand = async (req, res, next) => {
    try {
        await brandsService.deleteBrand(req.params.id);
        return sendSuccess(res, 200, 'Brand deleted successfully', null);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllBrands,
    getBrand,
    upsertBrand,
    uploadLogo,
    deleteBrand,
};
