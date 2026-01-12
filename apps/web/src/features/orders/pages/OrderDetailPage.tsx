/**
 * Order Detail Page
 * ==================
 * Detailed view of a single order with status timeline
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    CreditCard,
    MapPin,
    Phone,
    Calendar,
    FileText,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../../auth/authstore';
import ordersApi from '../ordersapi';
import type { Order } from '../orderstypes';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../orderstypes';

const statusIcons: Record<string, React.ReactNode> = {
    pending_payment: <Clock size={20} />,
    paid: <CreditCard size={20} />,
    accepted: <Package size={20} />,
    in_transit: <Truck size={20} />,
    delivered: <CheckCircle size={20} />,
    cancelled: <XCircle size={20} />,
};

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const fetchOrder = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const response = await ordersApi.getById(id);
            setOrder(response.data.order);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!id) return;

        setCancelling(true);
        try {
            await ordersApi.cancelOrder(id, cancelReason || 'Cancelled by customer');
            setShowCancelModal(false);
            setCancelReason('');
            await fetchOrder(); // Refresh order data
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-green-600" size={40} />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="px-4 py-8 text-center">
                <AlertCircle className="mx-auto text-red-400 mb-4" size={64} />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
                <p className="text-gray-500 mb-6">{error || 'Unable to load order details'}</p>
                <Button onClick={() => navigate(`${basePath}/orders`)}>Back to Orders</Button>
            </div>
        );
    }

    const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
        label: order.status,
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
    };

    const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
        label: order.paymentStatus,
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
    };

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <button
                onClick={() => navigate(`${basePath}/orders`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} />
                <span>Back to Orders</span>
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Order {order.orderNumber}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Placed on {formatDate(order.createdAt)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusIcons[order.status]}
                        {statusConfig.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                        <CreditCard size={16} />
                        {paymentConfig.label}
                    </span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package size={20} />
                            Order Items
                        </h2>

                        <div className="divide-y divide-gray-100">
                            {order.items.map((item) => (
                                <div key={item._id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {item.productSnapshot.name}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                <p className="text-sm text-gray-500">
                                                    {item.productSnapshot.brand && `${item.productSnapshot.brand} • `}
                                                    {item.productSnapshot.category}
                                                </p>
                                                {item.productSnapshot.hsnCode && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-200">
                                                        HSN/SAC: {item.productSnapshot.hsnCode}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.quantity} {item.productSnapshot.unit} × ₹{item.pricePerUnit.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{item.total.toFixed(2)}</p>
                                            {item.discountPercent > 0 && (
                                                <p className="text-xs text-green-600">
                                                    {item.discountPercent}% off
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{order.subtotal.toFixed(2)}</span>
                            </div>
                            {order.cgst > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">CGST</span>
                                    <span>₹{order.cgst.toFixed(2)}</span>
                                </div>
                            )}
                            {order.sgst > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">SGST</span>
                                    <span>₹{order.sgst.toFixed(2)}</span>
                                </div>
                            )}
                            {order.igst > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">IGST</span>
                                    <span>₹{order.igst.toFixed(2)}</span>
                                </div>
                            )}
                            {order.shippingCharges > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span>₹{order.shippingCharges.toFixed(2)}</span>
                                </div>
                            )}
                            {order.roundOff !== 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Round Off</span>
                                    <span>₹{order.roundOff.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
                                <span>Total Amount</span>
                                <span className="text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Status Timeline */}
                    <Card>
                        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock size={20} />
                            Order Timeline
                        </h2>

                        <div className="relative">
                            {order.statusHistory.map((history, index) => {
                                const config = ORDER_STATUS_CONFIG[history.status] || {
                                    label: history.status,
                                    color: 'text-gray-600',
                                    bgColor: 'bg-gray-50',
                                };
                                const isLast = index === order.statusHistory.length - 1;

                                return (
                                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                                        {/* Timeline line */}
                                        <div className="relative">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center ${isLast ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}
                                            >
                                                {statusIcons[history.status] || <Clock size={16} />}
                                            </div>
                                            {!isLast && (
                                                <div className="absolute top-8 left-1/2 w-0.5 h-full -translate-x-1/2 bg-gray-200" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-1">
                                            <p className="font-medium text-gray-900">{config.label}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(history.timestamp)}
                                            </p>
                                            {history.note && (
                                                <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                                            )}
                                            {history.updatedBy && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    by {typeof history.updatedBy === 'object' ? history.updatedBy.name : 'Staff'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Shipping Address */}
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin size={18} />
                            Shipping Address
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                            <p className="flex items-center gap-1">
                                <Phone size={14} />
                                {order.shippingAddress.phone}
                            </p>
                            <p>{order.shippingAddress.street}</p>
                            <p>
                                {order.shippingAddress.city}
                                {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
                            </p>
                            <p>
                                {order.shippingAddress.state} - {order.shippingAddress.pincode}
                            </p>
                        </div>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard size={18} />
                            Payment Information
                        </h3>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Method</span>
                                <span className="font-medium capitalize">
                                    {order.paymentMethod?.replace('_', ' ') || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`font-medium ${paymentConfig.color}`}>
                                    {paymentConfig.label}
                                </span>
                            </div>
                            {order.paymentReference && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Reference</span>
                                    <span className="font-mono text-xs">{order.paymentReference}</span>
                                </div>
                            )}
                            {order.paymentConfirmedAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Confirmed</span>
                                    <span>{formatDate(order.paymentConfirmedAt)}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Invoice */}
                    {order.invoiceNumber && (
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText size={18} />
                                Invoice
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Invoice #: <span className="font-medium">{order.invoiceNumber}</span>
                            </p>
                            <Button variant="outline" size="sm" fullWidth>
                                Download Invoice
                            </Button>
                        </Card>
                    )}

                    {/* Customer Notes */}
                    {order.customerNotes && (
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
                            <p className="text-sm text-gray-600">{order.customerNotes}</p>
                        </Card>
                    )}

                    {/* Actions */}
                    {order.canBeCancelled && (
                        <Card>
                            <Button
                                variant="outline"
                                fullWidth
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setShowCancelModal(true)}
                            >
                                Cancel Order
                            </Button>
                        </Card>
                    )}
                </div>
            </div>

            {/* Cancel Order Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for cancellation (optional)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                rows={3}
                                placeholder="Enter reason for cancellation..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                }}
                                disabled={cancelling}
                            >
                                Keep Order
                            </Button>
                            <Button
                                variant="primary"
                                fullWidth
                                className="!bg-red-600 hover:!bg-red-700"
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                            >
                                {cancelling ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel Order'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderDetailPage;
