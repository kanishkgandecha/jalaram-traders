/**
 * Products API
 * =============
 * API calls for products
 */

import apiClient from '../../shared/apiClient';
import type {
    Product,
    ProductsResponse,
    ProductResponse,
    ProductFilters,
    PriceCalculation,
} from './productstypes';

export const productsApi = {
    /**
     * Get all products with filtering
     */
    getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await apiClient.get<ProductsResponse>(`/products?${params}`);
        return response.data;
    },

    /**
     * Get featured products
     */
    getFeatured: async (limit = 8): Promise<{ data: { products: Product[] } }> => {
        const response = await apiClient.get(`/products/featured?limit=${limit}`);
        return response.data;
    },

    /**
     * Get products by category
     */
    getByCategory: async (category: string, limit = 10): Promise<{ data: { products: Product[] } }> => {
        const response = await apiClient.get(`/products/category/${category}?limit=${limit}`);
        return response.data;
    },

    /**
     * Get single product by ID
     */
    getById: async (id: string): Promise<ProductResponse> => {
        const response = await apiClient.get<ProductResponse>(`/products/${id}`);
        return response.data;
    },

    /**
     * Get product by slug
     */
    getBySlug: async (slug: string): Promise<ProductResponse> => {
        const response = await apiClient.get<ProductResponse>(`/products/slug/${slug}`);
        return response.data;
    },

    /**
     * Calculate price for quantity
     */
    calculatePrice: async (
        productId: string,
        quantity: number
    ): Promise<{ data: { pricing: PriceCalculation } }> => {
        const response = await apiClient.post(`/products/${productId}/calculate-price`, { quantity });
        return response.data;
    },
};

export default productsApi;
