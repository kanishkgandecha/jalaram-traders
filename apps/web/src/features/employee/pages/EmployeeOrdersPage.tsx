/**
 * Employee Orders Page
 * =====================
 * Simplified order management for employees
 * - View all orders (same as admin)
 * - Confirm payments
 * - Update order status (Accept → Ship → Deliver)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    Check,
    ChevronRight,
    Clock,
    CreditCard,
    Truck,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Modal } from '../../../shared/ui/Modal';
import ordersApi from '../../orders/ordersapi';
import type { Order } from '../../orders/orderstypes';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../../orders/orderstypes';

const statusIcons: Record<string, React.ReactNode> = {
    pending_payment: <Clock size={16} />,
    paid: <CreditCard size={16} />,
    accepted: <Package size={16} />,
    in_transit: <Truck size={16} />,
    delivered: <CheckCircle size={16} />,
    cancelled: <XCircle size={16} />,
};

const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending_payment', label: 'Pending Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
];

// Next valid status for each current status
const NEXT_STATUS: Record<string, string | null> = {
    pending_payment: null, // Must confirm payment first
    paid: 'accepted',
    accepted: 'in_transit',
    in_transit: 'delivered',
    delivered: null,
    cancelled: null,
};

export function EmployeeOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusNote, setStatusNote] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            // Employees can see all orders
            const response = await ordersApi.getAllOrders({
                page,
                limit: 15,
                status: statusFilter || undefined,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            setOrders(response.data);
            setTotalPages(response.meta.pagination.totalPages);
        } catch (err: any) {
            console.error('Failed to fetch orders:', err);
            setError(err.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (order: Order) => {
        setActionLoading(order._id);
        try {
            await ordersApi.confirmPayment(order._id);
            fetchOrders();
        } catch (err: any) {
            console.error('Failed to confirm payment:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder) return;

        const nextStatus = NEXT_STATUS[selectedOrder.status];
        if (!nextStatus) return;

        setActionLoading(selectedOrder._id);
        try {
            await ordersApi.updateStatus(selectedOrder._id, nextStatus, statusNote);
            setShowStatusModal(false);
            setStatusNote('');
            setSelectedOrder(null);
            fetchOrders();
        } catch (err: any) {
            console.error('Failed to update status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const openStatusModal = (order: Order) => {
        setSelectedOrder(order);
        setShowStatusModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Count orders by status for quick stats
    const pendingPaymentCount = orders.filter(o => o.status === 'pending_payment' && o.paymentStatus === 'submitted').length;
    const toAcceptCount = orders.filter(o => o.status === 'paid').length;
    const inTransitCount = orders.filter(o => o.status === 'in_transit').length;

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-600 mt-1">Manage orders and update status</p>
                </div>
                <Button
                    variant="outline"
                    leftIcon={<RefreshCw size={18} />}
                    onClick={fetchOrders}
                    isLoading={loading}
                >
                    Refresh
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card
                    padding="sm"
                    className={`cursor-pointer transition-shadow ${statusFilter === 'pending_payment' ? 'ring-2 ring-yellow-500' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'pending_payment' ? '' : 'pending_payment')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingPaymentCount}</p>
                            <p className="text-xs text-gray-500">Awaiting Confirmation</p>
                        </div>
                    </div>
                </Card>

                <Card
                    padding="sm"
                    className={`cursor-pointer transition-shadow ${statusFilter === 'paid' ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'paid' ? '' : 'paid')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Package className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{toAcceptCount}</p>
                            <p className="text-xs text-gray-500">To Accept</p>
                        </div>
                    </div>
                </Card>

                <Card
                    padding="sm"
                    className={`cursor-pointer transition-shadow ${statusFilter === 'in_transit' ? 'ring-2 ring-indigo-500' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'in_transit' ? '' : 'in_transit')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Truck className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{inTransitCount}</p>
                            <p className="text-xs text-gray-500">In Transit</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter */}
            <Card className="mb-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            options={statusOptions}
                        />
                    </div>
                    <Button onClick={fetchOrders} leftIcon={<RefreshCw size={18} />}>
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Orders List - Card view for mobile-friendly */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-green-600" size={40} />
                </div>
            ) : orders.length === 0 ? (
                <Card className="text-center py-12">
                    <Package className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">No orders found</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                            label: order.status,
                            color: 'text-gray-600',
                            bgColor: 'bg-gray-50',
                        };
                        const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
                            label: order.paymentStatus,
                            color: 'text-gray-600',
                            bgColor: 'bg-gray-50',
                        };
                        const nextStatus = NEXT_STATUS[order.status];
                        const canUpdateStatus = nextStatus !== null;
                        const canConfirmPayment = order.paymentStatus === 'submitted' && order.status === 'pending_payment';

                        return (
                            <Card key={order._id} padding="sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Link
                                                to={`/orders/${order._id}`}
                                                className="font-semibold text-green-600 hover:text-green-700"
                                            >
                                                {order.orderNumber}
                                            </Link>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                {statusIcons[order.status]}
                                                {statusConfig.label}
                                            </span>
                                            {order.paymentStatus !== 'confirmed' && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                                                    <CreditCard size={12} />
                                                    {paymentConfig.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                            <span className="font-medium text-gray-900">
                                                {order.customerSnapshot.name}
                                            </span>
                                            <span>•</span>
                                            <span>{order.customerSnapshot.phone}</span>
                                            <span>•</span>
                                            <span className="font-semibold">₹{order.totalAmount.toFixed(2)}</span>
                                        </div>

                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(order.createdAt)} • {order.items.length} items
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {canConfirmPayment && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleConfirmPayment(order)}
                                                isLoading={actionLoading === order._id}
                                                leftIcon={<Check size={14} />}
                                            >
                                                Confirm Payment
                                            </Button>
                                        )}
                                        {canUpdateStatus && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openStatusModal(order)}
                                            >
                                                {nextStatus === 'accepted' && 'Accept Order'}
                                                {nextStatus === 'in_transit' && 'Mark Shipped'}
                                                {nextStatus === 'delivered' && 'Mark Delivered'}
                                            </Button>
                                        )}
                                        <Link to={`/orders/${order._id}`}>
                                            <Button size="sm" variant="ghost">
                                                <ChevronRight size={18} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Update Status Modal */}
            <Modal
                isOpen={showStatusModal}
                onClose={() => {
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                    setStatusNote('');
                }}
                title="Update Order Status"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Update order <strong>{selectedOrder.orderNumber}</strong> status to{' '}
                            <strong className="text-green-600">
                                {ORDER_STATUS_CONFIG[NEXT_STATUS[selectedOrder.status] || '']?.label || 'Next Status'}
                            </strong>
                            ?
                        </p>

                        <Input
                            label="Note (Optional)"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Add a note for this status update"
                        />

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleUpdateStatus}
                                isLoading={actionLoading === selectedOrder._id}
                            >
                                Update Status
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default EmployeeOrdersPage;
