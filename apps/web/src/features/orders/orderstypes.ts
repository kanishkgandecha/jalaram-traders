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

export interface StatusHistoryItem {
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: {
        _id: string;
        name: string;
    };
}

export interface Order {
    _id: string;
    orderNumber: string;
    user: string | { _id: string; name: string; email: string; phone: string };
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

    // Order Status - New workflow
    status: 'pending_payment' | 'paid' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
    statusHistory: StatusHistoryItem[];

    // Assigned employee
    assignedEmployee?: {
        _id: string;
        name: string;
    };

    // Payment
    paymentStatus: 'pending' | 'submitted' | 'confirmed' | 'failed';
    paymentMethod?: 'upi' | 'bank_transfer';
    paymentSubmittedAt?: string;
    paymentConfirmedAt?: string;
    paymentConfirmedBy?: {
        _id: string;
        name: string;
    };
    paymentReference?: string;
    paymentProofUrl?: string;

    // Invoice
    invoiceNumber?: string;
    invoiceDate?: string;

    // Notes
    customerNotes?: string;
    internalNotes?: string;

    // Delivery
    expectedDeliveryDate?: string;
    actualDeliveryDate?: string;

    // Cancellation
    cancellationReason?: string;
    cancelledAt?: string;
    cancelledBy?: {
        _id: string;
        name: string;
    };

    // Computed
    totalItems?: number;
    canBeCancelled?: boolean;
    canConfirmPayment?: boolean;

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
    paymentMethod: 'upi' | 'bank_transfer';
}

// Status display configuration
export const ORDER_STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    description: string;
}> = {
    pending_payment: {
        label: 'Pending Payment',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        description: 'Waiting for payment',
    },
    paid: {
        label: 'Paid',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        description: 'Payment confirmed',
    },
    accepted: {
        label: 'Accepted',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        description: 'Order accepted for processing',
    },
    in_transit: {
        label: 'In Transit',
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50',
        description: 'Order is on the way',
    },
    delivered: {
        label: 'Delivered',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        description: 'Order delivered successfully',
    },
    cancelled: {
        label: 'Cancelled',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        description: 'Order was cancelled',
    },
};

export const PAYMENT_STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    pending: {
        label: 'Pending',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
    },
    submitted: {
        label: 'Submitted',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
    },
    confirmed: {
        label: 'Confirmed',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
    },
    failed: {
        label: 'Failed',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
    },
};
