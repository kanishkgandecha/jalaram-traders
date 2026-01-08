/**
 * Orders Types
 * =============
 * Type definitions for orders
 */

export interface OrderItem {
    _id: string;
    product: string;
    productSnapshot: {
        name: string;
        category: string;
        brand?: string;
        unit: string;
        hsnCode?: string;
        gstRate: number;
    };
    quantity: number;
    pricePerUnit: number;
    discountPercent: number;
    subtotal: number;
    gstAmount: number;
    total: number;
}

export interface Address {
    name: string;
    phone: string;
    street: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
}

export interface Order {
    _id: string;
    orderNumber: string;
    user: string;
    customerSnapshot: {
        name: string;
        email: string;
        phone: string;
        businessName?: string;
        gstin?: string;
    };
    items: OrderItem[];
    subtotal: number;
    totalDiscount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    shippingCharges: number;
    roundOff: number;
    totalAmount: number;
    shippingAddress: Address;
    billingAddress: Address;
    status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
    paymentMethod?: 'razorpay' | 'cod' | 'credit' | 'bank_transfer';
    paymentDetails?: {
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        paidAt?: string;
    };
    invoiceNumber?: string;
    invoiceDate?: string;
    customerNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrdersResponse {
    success: boolean;
    message: string;
    data: Order[];
    meta: {
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export interface OrderResponse {
    success: boolean;
    message: string;
    data: {
        order: Order;
    };
}

export interface CreateOrderRequest {
    shippingAddress: Address;
    billingAddress?: Address;
    customerNotes?: string;
    paymentMethod?: string;
}
