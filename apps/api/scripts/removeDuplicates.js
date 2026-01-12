/**
 * Remove Duplicate Products Script
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/features/products/Product');

const removeDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find duplicates by slug
        const duplicates = await Product.aggregate([
            { $group: { _id: '$slug', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        let deleted = 0;
        for (const doc of duplicates) {
            // Keep first, delete rest
            const idsToDelete = doc.ids.slice(1);
            await Product.deleteMany({ _id: { $in: idsToDelete } });
            deleted += idsToDelete.length;
            console.log(`Removed ${idsToDelete.length} duplicate(s) of: ${doc._id}`);
        }

        console.log(`\n✅ Deleted ${deleted} duplicate products`);

        const total = await Product.countDocuments();
        console.log(`📦 Total products now: ${total}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

removeDuplicates();
