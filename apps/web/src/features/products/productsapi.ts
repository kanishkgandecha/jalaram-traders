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
    ): Promise<{ success: boolean; data: { pricing: PriceCalculation } }> => {
        const response = await apiClient.post(`/products/${productId}/calculate-price`, { quantity });
        return response.data;
    },

    /**
     * Create new product (Admin, Employee)
     */
    createProduct: async (payload: Partial<Product>): Promise<ProductResponse> => {
        const response = await apiClient.post<ProductResponse>('/products', payload);
        return response.data;
    },

    /**
     * Update existing product (Admin, Employee)
     */
    updateProduct: async (id: string, payload: Partial<Product>): Promise<ProductResponse> => {
        const response = await apiClient.put<ProductResponse>(`/products/${id}`, payload);
        return response.data;
    },

    /**
     * Delete product - soft delete (Admin only)
     */
    deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    },
};

export default productsApi;
