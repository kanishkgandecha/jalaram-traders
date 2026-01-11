/**
 * Products Types
 * ===============
 * Type definitions for products
 */

export interface BulkPricingTier {
    minQuantity: number;
    maxQuantity: number | null;
    pricePerUnit: number;
    discountPercent: number;
}

export type PricingMode = 'WHOLESALE_ONLY' | 'WHOLESALE_AND_RETAIL';

export interface Product {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    category: 'seeds' | 'fertilizers' | 'pesticides' | 'tools' | 'equipment' | 'others';
    subCategory?: string;
    brand?: string;
    manufacturer?: string;

    // Pricing System
    wholesalePrice: number;
    wholesaleMOQ: number;
    retailMRP?: number | null;
    retailMaxQuantity?: number;
    pricingMode: PricingMode;
    basePrice: number; // Legacy compatibility
    bulkPricing: BulkPricingTier[];

    // GST
    hsnCode?: string;
    gstRate: number;

    // Units
    unit: string;
    packSize?: string;
    minOrderQuantity: number;
    maxOrderQuantity: number | null;

    // Inventory
    stock?: number; // Deprecated - use stockTotal/stockReserved
    stockTotal: number;
    stockReserved: number;
    stockAvailable?: number; // Computed virtual
    lowStockThreshold: number;

    // Media
    images: Array<{
        url: string;
        alt?: string;
        isPrimary: boolean;
    }>;

    // Status
    isActive: boolean;
    isFeatured: boolean;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductsResponse {
    success: boolean;
    message: string;
    data: Product[];
    meta: {
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
}

export interface ProductResponse {
    success: boolean;
    message: string;
    data: {
        product: Product;
    };
}

export interface PriceCalculation {
    pricePerUnit: number;
    quantity: number;
    subtotal: number;
    gstRate: number;
    gstAmount: number;
    total: number;
    discountPercent: number;
    tierApplied: string;
    savings: number;
}

export interface ProductFilters {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
