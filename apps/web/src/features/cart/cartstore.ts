/**
 * Cart Store
 * ===========
 * Zustand store for cart state
 */

import { create } from 'zustand';
import type { Cart } from './carttypes';
import cartApi from './cartapi';

interface CartState {
    cart: Cart | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchCart: () => Promise<void>;
    addToCart: (productId: string, quantity: number) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    clearError: () => void;
}

export const useCartStore = create<CartState>((set) => ({
    cart: null,
    isLoading: false,
    error: null,

    fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await cartApi.getCart();
            set({ cart: response.data.cart, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch cart',
                isLoading: false,
            });
        }
    },

    addToCart: async (productId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await cartApi.addToCart(productId, quantity);
            set({ cart: response.data.cart, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to add to cart';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    updateQuantity: async (productId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await cartApi.updateItem(productId, quantity);
            set({ cart: response.data.cart, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update cart';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    removeItem: async (productId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await cartApi.removeItem(productId);
            set({ cart: response.data.cart, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to remove item',
                isLoading: false,
            });
        }
    },

    clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await cartApi.clearCart();
            set({ cart: response.data.cart, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to clear cart',
                isLoading: false,
            });
        }
    },

    clearError: () => set({ error: null }),
}));

export default useCartStore;
