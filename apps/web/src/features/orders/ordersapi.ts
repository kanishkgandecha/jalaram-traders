/**
 * Orders API
 * ===========
 * API calls for orders
 */

import apiClient from '../../shared/apiClient';
import type { OrdersResponse, OrderResponse, CreateOrderRequest, Order } from './orderstypes';

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
     * Mark payment as submitted
     */
    markPaymentSubmitted: async (
        orderId: string,
        data: { paymentMethod?: string; reference?: string }
    ): Promise<OrderResponse> => {
        const response = await apiClient.post<OrderResponse>(
            `/orders/${orderId}/payment-submitted`,
            data
        );
        return response.data;
    },

    /**
     * Confirm payment received (Admin/Employee)
     */
    confirmPayment: async (orderId: string): Promise<OrderResponse> => {
        const response = await apiClient.post<OrderResponse>(
            `/orders/${orderId}/confirm-payment`
        );
        return response.data;
    },

    /**
     * Assign employee to order (Admin/Employee)
     */
    assignEmployee: async (orderId: string, employeeId: string): Promise<OrderResponse> => {
        const response = await apiClient.post<OrderResponse>(
            `/orders/${orderId}/assign-employee`,
            { employeeId }
        );
        return response.data;
    },

    /**
     * Update order status (Admin/Employee)
     */
    updateStatus: async (
        orderId: string,
        status: string,
        note?: string
    ): Promise<OrderResponse> => {
        const response = await apiClient.patch<OrderResponse>(
            `/orders/${orderId}/status`,
            { status, note }
        );
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
     * Get all orders (Admin/Employee)
     */
    getAllOrders: async (params: {
        page?: number;
        limit?: number;
        status?: string;
        paymentStatus?: string;
        assignedEmployee?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<OrdersResponse> => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const response = await apiClient.get<OrdersResponse>(`/orders/admin/all?${searchParams}`);
        return response.data;
    },

    /**
     * Get pending payment orders (Admin/Employee)
     */
    getPendingPaymentOrders: async (page = 1, limit = 10): Promise<OrdersResponse> => {
        const response = await apiClient.get<OrdersResponse>(
            `/orders/admin/pending-payment?page=${page}&limit=${limit}`
        );
        return response.data;
    },

    /**
     * Get orders assigned to current employee
     */
    getEmployeeOrders: async (page = 1, limit = 10, status?: string): Promise<OrdersResponse> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) params.append('status', status);
        const response = await apiClient.get<OrdersResponse>(`/orders/employee/assigned?${params}`);
        return response.data;
    },

    /**
     * Get order statistics (Admin/Employee)
     */
    getStats: async (startDate?: string, endDate?: string): Promise<{ data: { stats: any } }> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await apiClient.get(`/orders/admin/stats?${params}`);
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
