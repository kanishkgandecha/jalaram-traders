/**
 * Order Model
 * ============
 * MongoDB schema for orders with GST-ready invoice data
 * 
 * Order Status Flow:
 * PENDING_PAYMENT -> PAID -> ACCEPTED -> IN_TRANSIT -> DELIVERED
 * 
 * @module features/orders/Order
 */

const mongoose = require('mongoose');

/**
 * Order Item Schema
 * Snapshot of product details at time of order for invoice generation
 */
const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        // Snapshot of product details (for invoice generation)
        productSnapshot: {
            name: { type: String, required: true },
            category: { type: String },
            brand: { type: String },
            unit: { type: String, required: true },
            hsnCode: { type: String },
            gstRate: { type: Number, required: true },
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        pricePerUnit: {
            type: Number,
            required: true,
        },

        discountPercent: {
            type: Number,
            default: 0,
        },

        subtotal: {
            type: Number,
            required: true,
        },

        gstAmount: {
            type: Number,
            required: true,
        },

        total: {
            type: Number,
            required: true,
        },
    },
    { _id: true }
);

/**
 * Address Schema (for shipping and billing)
 */
const addressSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String },
        state: { type: String, required: true, default: 'Maharashtra' },
        pincode: { type: String, required: true },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        // Order identification (auto-generated or assigned by employee)
        orderNumber: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values
        },

        // Customer reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Customer snapshot for invoice
        customerSnapshot: {
            name: { type: String, required: true },
            email: { type: String },
            phone: { type: String, required: true },
            businessName: { type: String },
            gstin: { type: String },
        },

        // Order items
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items && items.length > 0;
                },
                message: 'Order must have at least one item',
            },
        },

        // Pricing breakdown
        subtotal: {
            type: Number,
            required: true,
        },

        totalDiscount: {
            type: Number,
            default: 0,
        },

        // GST breakdown
        cgst: {
            type: Number,
            default: 0,
        },

        sgst: {
            type: Number,
            default: 0,
        },

        igst: {
            type: Number,
            default: 0,
        },

        totalGst: {
            type: Number,
            required: true,
        },

        // Shipping and charges
        shippingCharges: {
            type: Number,
            default: 0,
        },

        roundOff: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        // Addresses
        shippingAddress: {
            type: addressSchema,
            required: true,
        },

        billingAddress: {
            type: addressSchema,
        },

        // Order status - Strict workflow sequence
        status: {
            type: String,
            enum: {
                values: [
                    'pending_payment',
                    'paid',
                    'accepted',
                    'in_transit',
                    'delivered',
                    'cancelled',
                ],
                message: 'Invalid order status',
            },
            default: 'pending_payment',
        },

        // Assigned employee for order processing
        assignedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        // Status history
        statusHistory: [
            {
                status: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                note: { type: String },
                updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],

        // Payment details
        paymentStatus: {
            type: String,
            enum: {
                values: ['pending', 'submitted', 'confirmed', 'failed'],
                message: 'Invalid payment status',
            },
            default: 'pending',
        },

        paymentMethod: {
            type: String,
            enum: {
                values: ['upi', 'bank_transfer'],
                message: 'Invalid payment method',
            },
        },

        // Payment tracking
        paymentSubmittedAt: {
            type: Date,
        },

        paymentConfirmedAt: {
            type: Date,
        },

        paymentConfirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        paymentProofUrl: {
            type: String,
        },

        paymentReference: {
            type: String, // Transaction ID or reference number provided by customer
        },

        // Invoice
        invoiceNumber: {
            type: String,
        },

        invoiceDate: {
            type: Date,
        },

        // Order notes
        customerNotes: {
            type: String,
            maxlength: 500,
        },

        internalNotes: {
            type: String,
            maxlength: 1000,
        },

        // Delivery details
        expectedDeliveryDate: {
            type: Date,
        },

        actualDeliveryDate: {
            type: Date,
        },

        // Cancellation
        cancellationReason: {
            type: String,
        },

        cancelledAt: {
            type: Date,
        },

        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ==========================================
// INDEXES
// ==========================================

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ assignedEmployee: 1 });
orderSchema.index({ createdAt: -1 });

// ==========================================
// PRE-SAVE MIDDLEWARE (Mongoose 9+ compatible)
// ==========================================

/**
 * Generate order number before saving
 */
orderSchema.pre('save', async function () {
    if (this.isNew && !this.orderNumber) {
        // Format: JT-YYYYMMDD-XXXXX
        const date = new Date();
        const dateStr =
            date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');

        // Get count of orders today
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const count = await this.constructor.countDocuments({
            createdAt: { $gte: startOfDay },
        });

        const sequence = String(count + 1).padStart(5, '0');
        this.orderNumber = `JT-${dateStr}-${sequence}`;
    }

    // Set billing address to shipping address if not provided
    if (!this.billingAddress) {
        this.billingAddress = this.shippingAddress;
    }

    // Add initial status to history
    if (this.isNew) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: 'Order created',
        });
    }
});

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Valid status transitions
 */
orderSchema.statics.STATUS_FLOW = {
    pending_payment: ['paid', 'cancelled'],
    paid: ['accepted', 'cancelled'],
    accepted: ['in_transit', 'cancelled'],
    in_transit: ['delivered'],
    delivered: [],
    cancelled: [],
};

/**
 * Check if status transition is valid
 */
orderSchema.statics.isValidTransition = function (currentStatus, newStatus) {
    const validNext = this.STATUS_FLOW[currentStatus] || [];
    return validNext.includes(newStatus);
};

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Update order status with history tracking
 * @param {string} newStatus - New status
 * @param {string} note - Optional note
 * @param {string} updatedBy - User ID who updated
 */
orderSchema.methods.updateStatus = function (newStatus, note, updatedBy) {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note,
        updatedBy,
    });

    // Special handling for certain statuses
    if (newStatus === 'cancelled') {
        this.cancelledAt = new Date();
        this.cancelledBy = updatedBy;
    }

    if (newStatus === 'delivered') {
        this.actualDeliveryDate = new Date();
    }
};

/**
 * Mark payment as submitted by customer
 * @param {string} paymentMethod - Payment method used
 * @param {string} reference - Payment reference/transaction ID
 */
orderSchema.methods.markPaymentSubmitted = function (paymentMethod, reference) {
    this.paymentStatus = 'submitted';
    this.paymentMethod = paymentMethod;
    this.paymentSubmittedAt = new Date();
    if (reference) {
        this.paymentReference = reference;
    }
};

/**
 * Confirm payment received
 * @param {string} confirmedBy - User ID who confirmed
 */
orderSchema.methods.confirmPayment = function (confirmedBy) {
    this.paymentStatus = 'confirmed';
    this.paymentConfirmedAt = new Date();
    this.paymentConfirmedBy = confirmedBy;

    // Also update order status to paid
    this.updateStatus('paid', 'Payment confirmed', confirmedBy);
};

/**
 * Generate invoice number
 */
orderSchema.methods.generateInvoiceNumber = async function () {
    if (!this.invoiceNumber) {
        // Format: JTI-YYYYMMDD-XXXXX (JT Invoice)
        const date = new Date();
        const dateStr =
            date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');

        // Use order number sequence
        const sequence = this.orderNumber.split('-')[2];
        this.invoiceNumber = `JTI-${dateStr}-${sequence}`;
        this.invoiceDate = new Date();
    }
    return this.invoiceNumber;
};

/**
 * Get invoice data for PDF generation
 */
orderSchema.methods.getInvoiceData = function () {
    return {
        invoiceNumber: this.invoiceNumber,
        invoiceDate: this.invoiceDate,
        orderNumber: this.orderNumber,
        orderDate: this.createdAt,

        seller: {
            name: process.env.BUSINESS_NAME || 'Jalaram Traders',
            gstin: process.env.BUSINESS_GSTIN,
            address: process.env.BUSINESS_ADDRESS,
            phone: process.env.BUSINESS_PHONE,
        },

        buyer: {
            name: this.customerSnapshot.businessName || this.customerSnapshot.name,
            gstin: this.customerSnapshot.gstin,
            address: this.billingAddress,
            phone: this.customerSnapshot.phone,
        },

        shippingAddress: this.shippingAddress,

        items: this.items.map((item) => ({
            name: item.productSnapshot.name,
            hsnCode: item.productSnapshot.hsnCode,
            quantity: item.quantity,
            unit: item.productSnapshot.unit,
            rate: item.pricePerUnit,
            gstRate: item.productSnapshot.gstRate,
            gstAmount: item.gstAmount,
            amount: item.total,
        })),

        subtotal: this.subtotal,
        cgst: this.cgst,
        sgst: this.sgst,
        igst: this.igst,
        totalGst: this.totalGst,
        shippingCharges: this.shippingCharges,
        roundOff: this.roundOff,
        totalAmount: this.totalAmount,

        paymentStatus: this.paymentStatus,
        paymentMethod: this.paymentMethod,
    };
};

// ==========================================
// VIRTUALS
// ==========================================

/**
 * Total items count
 */
orderSchema.virtual('totalItems').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Check if order can be cancelled
 */
orderSchema.virtual('canBeCancelled').get(function () {
    const nonCancellableStatuses = ['in_transit', 'delivered', 'cancelled'];
    return !nonCancellableStatuses.includes(this.status);
});

/**
 * Check if payment can be confirmed
 */
orderSchema.virtual('canConfirmPayment').get(function () {
    return this.paymentStatus === 'submitted' && this.status === 'pending_payment';
});

module.exports = mongoose.model('Order', orderSchema);
