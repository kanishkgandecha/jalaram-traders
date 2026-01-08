/**
 * Cart Types
 * ===========
 * Type definitions for cart
 */

export interface CartItem {
    _id: string;
    product: {
        _id: string;
        name: string;
        category: string;
        brand?: string;
        unit: string;
        basePrice: number;
        stock: number;
        images?: Array<{ url: string; isPrimary: boolean }>;
    };
    quantity: number;
    priceAtAdd: number;
    appliedPrice: number;
    discountPercent: number;
    subtotal: number;
}

export interface Cart {
    _id: string;
    user: string;
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    estimatedGst: number;
    estimatedTotal: number;
}

export interface CartResponse {
    success: boolean;
    message: string;
    data: {
        cart: Cart;
    };
}

export interface CartSummary {
    itemCount: number;
    subtotal: number;
    estimatedGst: number;
    estimatedTotal: number;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
        pricePerUnit: number;
        discountPercent: number;
        subtotal: number;
    }>;
    stockIssues: Array<{
        product: string;
        requestedQuantity: number;
        availableStock: number;
    }>;
    canCheckout: boolean;
}
