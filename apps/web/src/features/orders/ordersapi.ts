/**
 * Orders API
 * ===========
 * API calls for orders
 */

import apiClient from '../../shared/apiClient';
import type { OrdersResponse, OrderResponse, CreateOrderRequest } from './orderstypes';

export const ordersApi = {
    /**
     * Get current user's orders
     */
    getMyOrders: async (page = 1, limit = 10, status?: string): Promise<OrdersResponse> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) params.append('status', status);
        const response = await apiClient.get<OrdersResponse>(`/orders?${params}`);
        return response.data;
    },

    /**
     * Get order by ID
     */
    getById: async (id: string): Promise<OrderResponse> => {
        const response = await apiClient.get<OrderResponse>(`/orders/${id}`);
        return response.data;
    },

    /**
     * Create order from cart
     */
    createOrder: async (data: CreateOrderRequest): Promise<OrderResponse> => {
        const response = await apiClient.post<OrderResponse>('/orders', data);
        return response.data;
    },

    /**
     * Cancel order
     */
    cancelOrder: async (id: string, reason?: string): Promise<OrderResponse> => {
        const response = await apiClient.post<OrderResponse>(`/orders/${id}/cancel`, { reason });
        return response.data;
    },

    /**
     * Get invoice data
     */
    getInvoice: async (id: string): Promise<any> => {
        const response = await apiClient.get(`/orders/${id}/invoice`);
        return response.data;
    },
};

export default ordersApi;
