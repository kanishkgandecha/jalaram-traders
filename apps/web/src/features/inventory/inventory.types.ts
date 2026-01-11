/**
 * Inventory Types
 * =================
 * TypeScript interfaces for inventory data
 *
 * @module features/inventory/inventory.types
 */

/**
 * Action types for inventory log entries
 */
export type InventoryActionType = 'ADD' | 'ADJUST' | 'RESERVE' | 'RELEASE' | 'DEDUCT' | 'DAMAGED';

/**
 * Inventory log entry
 */
export interface InventoryLog {
    _id: string;
    product: {
        _id: string;
        name: string;
        category?: string;
    };
    actionType: InventoryActionType;
    quantity: number;
    previousStockTotal: number;
    previousStockReserved: number;
    newStockTotal: number;
    newStockReserved: number;
    previousStockAvailable?: number;
    newStockAvailable?: number;
    performedBy: {
        _id: string;
        name: string;
        email?: string;
        role?: string;
    };
    order?: {
        _id: string;
        orderNumber: string;
    } | null;
    reason?: string;
    notes?: string;
    actionDescription?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Pagination info
 */
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Inventory logs response
 */
export interface InventoryLogsResponse {
    success: boolean;
    data: {
        logs: InventoryLog[];
        pagination: Pagination;
    };
}

/**
 * Low stock / out of stock product
 */
export interface LowStockProduct {
    _id: string;
    name: string;
    category: string;
    stockTotal: number;
    stockReserved: number;
    stockAvailable: number;
    lowStockThreshold: number;
    unit: string;
}

/**
 * Stock update request payload
 */
export interface AddStockPayload {
    productId: string;
    quantity: number;
    reason?: string;
}

export interface AdjustStockPayload {
    productId: string;
    quantity: number;
    reason: string; // Required for adjustments
}

export interface MarkDamagedPayload {
    productId: string;
    quantity: number;
    reason: string; // Required for damaged
}

/**
 * Stock update response
 */
export interface StockUpdateResponse {
    success: boolean;
    message: string;
    data: {
        product: {
            _id: string;
            name: string;
            stockTotal: number;
            stockReserved: number;
            stockAvailable: number;
        };
        log: InventoryLog;
    };
}

/**
 * Inventory statistics
 */
export interface InventoryStats {
    products: {
        totalProducts: number;
        totalStockValue: number;
        totalStockUnits: number;
        totalReserved: number;
        outOfStock: number;
        lowStock: number;
    };
    recentActivityCount: number;
    actionBreakdown: {
        [key in InventoryActionType]?: {
            count: number;
            totalQuantity: number;
        };
    };
}

/**
 * Inventory stats response
 */
export interface InventoryStatsResponse {
    success: boolean;
    data: InventoryStats;
}

/**
 * Low/out of stock products response
 */
export interface LowStockResponse {
    success: boolean;
    count: number;
    data: LowStockProduct[];
}

/**
 * Query options for fetching logs
 */
export interface InventoryLogsQuery {
    page?: number;
    limit?: number;
    actionType?: InventoryActionType;
    productId?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Product creation payload
 */
export interface CreateProductPayload {
    name: string;
    category: 'seeds' | 'fertilizers' | 'pesticides' | 'tools' | 'equipment' | 'others';
    description?: string;
    brand?: string;
    manufacturer?: string;
    basePrice: number;
    unit: 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'packet' | 'bag' | 'box' | 'bottle' | 'can';
    packSize?: string;
    minOrderQuantity?: number;
    maxOrderQuantity?: number | null;
    stockTotal?: number;
    lowStockThreshold?: number;
    gstRate?: 0 | 5 | 12 | 18 | 28;
    hsnCode?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    specifications?: {
        composition?: string;
        dosage?: string;
        applicationMethod?: string;
        targetCrops?: string[];
        validity?: string;
        storageInstructions?: string;
    };
}

/**
 * Product update payload
 */
export interface UpdateProductPayload extends Partial<CreateProductPayload> {
    // Stock fields should NOT be updated directly via product update
    // Use inventory operations instead
}
