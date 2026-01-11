/**
 * Checkout Types
 * ===============
 * TypeScript types for checkout operations
 */

export interface PaymentInfo {
    upiId: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
}

export interface CheckoutItem {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    discountPercent: number;
    subtotal: number;
    gstRate: number;
    gstAmount: number;
    total: number;
}

export interface ShippingAddress {
    name: string;
    phone: string;
    street: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
}

export interface CheckoutSummary {
    items: CheckoutItem[];
    subtotal: number;
    totalGst: number;
    totalAmount: number;
    itemCount: number;
}

export interface CreateOrderPayload {
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress;
    customerNotes?: string;
    paymentMethod: 'upi' | 'bank_transfer';
}

export interface PaymentSubmitPayload {
    paymentMethod: 'upi' | 'bank_transfer';
    reference?: string;
}
