/**
 * Notifications API
 * ==================
 * API client for notifications
 */

import apiClient from '../../shared/apiClient';

export interface Notification {
    _id: string;
    user: string;
    type: 'order' | 'product' | 'payment' | 'system' | 'alert';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    readAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationsResponse {
    success: boolean;
    message: string;
    data: {
        notifications: Notification[];
        unreadCount: number;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export const notificationsApi = {
    /**
     * Get notifications
     */
    getNotifications: async (options?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> => {
        const params = new URLSearchParams();
        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.unreadOnly) params.append('unreadOnly', 'true');

        const response = await apiClient.get(`/notifications?${params.toString()}`);
        return response.data;
    },

    /**
     * Get unread count
     */
    getUnreadCount: async (): Promise<{ success: boolean; data: { unreadCount: number } }> => {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (id: string): Promise<{ success: boolean }> => {
        const response = await apiClient.put(`/notifications/${id}/read`);
        return response.data;
    },

    /**
     * Mark all as read
     */
    markAllAsRead: async (): Promise<{ success: boolean; data: { modifiedCount: number } }> => {
        const response = await apiClient.put('/notifications/read-all');
        return response.data;
    },

    /**
     * Delete notification
     */
    deleteNotification: async (id: string): Promise<{ success: boolean }> => {
        const response = await apiClient.delete(`/notifications/${id}`);
        return response.data;
    },
};

export default notificationsApi;
