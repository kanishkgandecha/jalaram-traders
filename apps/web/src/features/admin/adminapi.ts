/**
 * Admin API
 * ==========
 * API calls for admin operations
 */

import apiClient from '../../shared/apiClient';

export interface DashboardStats {
    orders: {
        total: number;
        today: number;
        thisMonth: number;
        pending: number;
    };
    revenue: {
        total: number;
        today: number;
        thisMonth: number;
    };
    users: {
        total: number;
        retailers: number;
    };
    products: {
        total: number;
        lowStock: number;
    };
    recentOrders: Array<{
        _id: string;
        orderNumber: string;
        totalAmount: number;
        status: string;
        createdAt: string;
        user: { name: string; email: string };
    }>;
}

export interface SalesReport {
    period: { start: string; end: string; groupBy: string };
    summary: {
        totalOrders: number;
        totalRevenue: number;
        totalItems: number;
        avgOrderValue: number;
    };
    salesData: Array<{
        _id: string;
        orders: number;
        revenue: number;
        items: number;
    }>;
    topProducts: Array<{
        _id: string;
        quantity: number;
        revenue: number;
    }>;
}

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'employee' | 'retailer' | 'farmer';
    isActive: boolean;
    businessName?: string;
    createdAt: string;
}

export const adminApi = {
    /**
     * Get dashboard statistics
     */
    getDashboardStats: async (): Promise<{ data: DashboardStats }> => {
        const response = await apiClient.get('/admin/dashboard');
        return response.data;
    },

    /**
     * Get sales report
     */
    getSalesReport: async (
        startDate: string,
        endDate: string,
        groupBy = 'day'
    ): Promise<{ data: SalesReport }> => {
        const response = await apiClient.get(
            `/admin/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`
        );
        return response.data;
    },

    /**
     * Export report
     */
    exportReport: async (startDate: string, endDate: string, format = 'json') => {
        const response = await apiClient.get(
            `/admin/reports/export?startDate=${startDate}&endDate=${endDate}&format=${format}`,
            { responseType: format === 'csv' ? 'blob' : 'json' }
        );
        return response.data;
    },

    /**
     * Get all users
     */
    getUsers: async (params: {
        page?: number;
        limit?: number;
        role?: string;
        isActive?: string;
        search?: string;
    } = {}): Promise<{ data: AdminUser[]; meta: { pagination: any } }> => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined) searchParams.append(k, String(v));
        });
        const response = await apiClient.get(`/admin/users?${searchParams}`);
        return response.data;
    },

    /**
     * Create new user
     */
    createUser: async (userData: {
        name: string;
        email: string;
        phone: string;
        password: string;
        role: string;
        businessName?: string;
    }): Promise<{ data: { user: AdminUser } }> => {
        const response = await apiClient.post('/admin/users', userData);
        return response.data;
    },

    /**
     * Update user role
     */
    updateUserRole: async (userId: string, role: string): Promise<{ data: { user: AdminUser } }> => {
        const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
        return response.data;
    },

    /**
     * Toggle user status
     */
    toggleUserStatus: async (userId: string): Promise<{ data: { user: AdminUser } }> => {
        const response = await apiClient.put(`/admin/users/${userId}/toggle-status`);
        return response.data;
    },
};

export default adminApi;
