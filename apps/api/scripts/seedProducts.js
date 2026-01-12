/**
 * Product Seeder Script
 * =====================
 * Seeds products from ../../seeds.js into the database
 * 
 * Usage: node scripts/seedProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/features/products/Product');
const fs = require('fs');
const path = require('path');

// Read and parse seeds.js
const seedsPath = path.join(__dirname, '../../..', 'seeds.js');
let products = [];

try {
    const content = fs.readFileSync(seedsPath, 'utf8');
    // Extract array from "export const products = [...]"
    const match = content.match(/export const products = (\[[\s\S]*\]);/);
    if (match) {
        products = eval(match[1]);
    }
} catch (err) {
    console.error('Failed to read seeds.js:', err.message);
    process.exit(1);
}

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
};

const seedProducts = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        console.log(`📦 Found ${products.length} products in seeds.js\n`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const productData of products) {
            try {
                const slug = generateSlug(productData.name);

                const existing = await Product.findOne({ slug });
                if (existing) {
                    console.log(`⏭️  Skip: ${productData.name}`);
                    skipped++;
                    continue;
                }

                const product = new Product({
                    ...productData,
                    slug,
                    wholesalePrice: productData.wholesalePrice || productData.basePrice,
                    lowStockThreshold: productData.lowStockThreshold || 10,
                    reservedStock: 0,
                });

                await product.save();
                console.log(`✅ ${productData.name}`);
                created++;
            } catch (err) {
                console.error(`❌ ${productData.name}: ${err.message}`);
                errors++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Created: ${created}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors:  ${errors}`);
        console.log(`   📦 Total:   ${products.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected');
    }
};

seedProducts();
