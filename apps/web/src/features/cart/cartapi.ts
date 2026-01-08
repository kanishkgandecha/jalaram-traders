/**
 * Cart API
 * =========
 * API calls for cart operations
 */

import apiClient from '../../shared/apiClient';
import type { CartResponse, CartSummary } from './carttypes';

export const cartApi = {
    /**
     * Get current user's cart
     */
    getCart: async (): Promise<CartResponse> => {
        const response = await apiClient.get<CartResponse>('/cart');
        return response.data;
    },

    /**
     * Get cart summary for checkout
     */
    getSummary: async (): Promise<{ data: { summary: CartSummary } }> => {
        const response = await apiClient.get('/cart/summary');
        return response.data;
    },

    /**
     * Add item to cart
     */
    addToCart: async (productId: string, quantity: number): Promise<CartResponse> => {
        const response = await apiClient.post<CartResponse>('/cart/add', {
            productId,
            quantity,
        });
        return response.data;
    },

    /**
     * Update item quantity
     */
    updateItem: async (productId: string, quantity: number): Promise<CartResponse> => {
        const response = await apiClient.put<CartResponse>('/cart/update', {
            productId,
            quantity,
        });
        return response.data;
    },

    /**
     * Remove item from cart
     */
    removeItem: async (productId: string): Promise<CartResponse> => {
        const response = await apiClient.delete<CartResponse>(`/cart/remove/${productId}`);
        return response.data;
    },

    /**
     * Clear all items from cart
     */
    clearCart: async (): Promise<CartResponse> => {
        const response = await apiClient.delete<CartResponse>('/cart/clear');
        return response.data;
    },
};

export default cartApi;
