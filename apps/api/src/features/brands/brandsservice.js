/**
 * Brands Service
 * ===============
 * Business logic for brand management
 */

const Brand = require('./Brand');
const mongoose = require('mongoose');

/**
 * Get all brands with product counts
 */
const getAllBrands = async () => {
    return await Brand.getWithProductCounts();
};

/**
 * Get brand by slug or name
 */
const getBrand = async (identifier) => {
    return await Brand.findOne({
        $or: [{ slug: identifier }, { name: identifier }],
    });
};

/**
 * Create or update brand (upsert)
 */
const upsertBrand = async (brandData) => {
    const { name, logo, description } = brandData;

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const brand = await Brand.findOneAndUpdate(
        { name },
        { name, slug, logo, description, isActive: true },
        { upsert: true, new: true, runValidators: true }
    );

    return brand;
};

/**
 * Update brand logo
 */
const updateLogo = async (brandName, logoUrl) => {
    // Try to find existing brand
    let brand = await Brand.findOne({ name: brandName });

    if (!brand) {
        // Create new brand entry
        const slug = brandName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        brand = new Brand({
            name: brandName,
            slug,
            logo: { url: logoUrl, alt: brandName },
        });
    } else {
        brand.logo = { url: logoUrl, alt: brandName };
    }

    await brand.save();
    return brand;
};

/**
 * Delete brand
 */
const deleteBrand = async (brandId) => {
    return await Brand.findByIdAndDelete(brandId);
};

module.exports = {
    getAllBrands,
    getBrand,
    upsertBrand,
    updateLogo,
    deleteBrand,
};
