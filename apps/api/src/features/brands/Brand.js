/**
 * Brand Model
 * ============
 * Store brand/company information with logos
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Brand name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        logo: {
            url: {
                type: String,
                default: null,
            },
            alt: {
                type: String,
                default: '',
            },
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        productCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index
brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 });

// Pre-save: Generate slug
brandSchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Static: Get all brands with product counts
brandSchema.statics.getWithProductCounts = async function () {
    const Product = mongoose.model('Product');

    // Get unique brands from products
    const productBrands = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
    ]);

    // Get stored brands
    const storedBrands = await this.find({ isActive: true }).lean();
    const storedBrandsMap = new Map(storedBrands.map(b => [b.name, b]));

    // Merge
    const result = [];
    for (const pb of productBrands) {
        const stored = storedBrandsMap.get(pb._id);
        result.push({
            name: pb._id,
            slug: pb._id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            logo: stored?.logo || null,
            description: stored?.description || '',
            productCount: pb.count,
            _id: stored?._id || null,
        });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = mongoose.model('Brand', brandSchema);
