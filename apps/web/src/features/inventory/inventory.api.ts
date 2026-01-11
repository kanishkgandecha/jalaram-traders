/**
 * Inventory API
 * ==============
 * API calls for inventory management
 * 
 * @module features/inventory/inventory.api
 */

import apiClient from '../../shared/apiClient';
import type {
    AddStockPayload,
    AdjustStockPayload,
    MarkDamagedPayload,
    StockUpdateResponse,
    InventoryLogsResponse,
    InventoryLogsQuery,
    InventoryStatsResponse,
    LowStockResponse,
} from './inventory.types';

export const inventoryApi = {
    // ==========================================
    // ADMIN + EMPLOYEE OPERATIONS
    // ==========================================

    /**
     * Add stock to a product (Admin, Employee)
     */
    addStock: async (payload: AddStockPayload): Promise<StockUpdateResponse> => {
        const response = await apiClient.post<StockUpdateResponse>('/inventory/add', payload);
        return response.data;
    },

    /**
     * Mark stock as damaged/expired (Admin, Employee)
     */
    markDamaged: async (payload: MarkDamagedPayload): Promise<StockUpdateResponse> => {
        const response = await apiClient.post<StockUpdateResponse>('/inventory/damaged', payload);
        return response.data;
    },

    /**
     * Get low stock products (Admin, Employee)
     */
    getLowStock: async (limit = 20): Promise<LowStockResponse> => {
        const response = await apiClient.get<LowStockResponse>(`/inventory/low-stock?limit=${limit}`);
        return response.data;
    },

    /**
     * Get out of stock products (Admin, Employee)
     */
    getOutOfStock: async (limit = 20): Promise<LowStockResponse> => {
        const response = await apiClient.get<LowStockResponse>(`/inventory/out-of-stock?limit=${limit}`);
        return response.data;
    },

    // ==========================================
    // ADMIN ONLY OPERATIONS
    // ==========================================

    /**
     * Adjust stock (manual correction) - Admin only
     */
    adjustStock: async (payload: AdjustStockPayload): Promise<StockUpdateResponse> => {
        const response = await apiClient.post<StockUpdateResponse>('/inventory/adjust', payload);
        return response.data;
    },

    /**
     * Get inventory statistics - Admin only
     */
    getStats: async (): Promise<InventoryStatsResponse> => {
        const response = await apiClient.get<InventoryStatsResponse>('/inventory/stats');
        return response.data;
    },

    /**
     * Get all inventory logs - Admin only
     */
    getAllLogs: async (query: InventoryLogsQuery = {}): Promise<InventoryLogsResponse> => {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await apiClient.get<InventoryLogsResponse>(`/inventory/logs?${params}`);
        return response.data;
    },

    /**
     * Get inventory logs for a specific product - Admin only
     */
    getProductLogs: async (productId: string, query: InventoryLogsQuery = {}): Promise<InventoryLogsResponse> => {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await apiClient.get<InventoryLogsResponse>(
            `/inventory/logs/${productId}?${params}`
        );
        return response.data;
    },
};

export default inventoryApi;
