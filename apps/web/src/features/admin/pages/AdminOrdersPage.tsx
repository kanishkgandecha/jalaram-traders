/**
 * Admin Orders Page
 * ==================
 * Order management for Admin and Employee
 * - View all orders
 * - Filter by status, payment, date
 * - Confirm payments
 * - Assign employees
 * - Update order status
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    Search,
    Filter,
    Check,
    ChevronRight,
    Clock,
    CreditCard,
    Truck,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2,
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
    { value: 'cancelled', label: 'Cancelled' },
];

const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'failed', label: 'Failed' },
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

export function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusNote, setStatusNote] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter, paymentFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await ordersApi.getAllOrders({
                page,
                limit: 15,
                status: statusFilter || undefined,
                paymentStatus: paymentFilter || undefined,
                search: search || undefined,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            setOrders(response.data);
            setTotalPages(response.meta.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchOrders();
    };

    const handleConfirmPayment = async (order: Order) => {
        if (!order.canConfirmPayment) return;

        setActionLoading(order._id);
        try {
            await ordersApi.confirmPayment(order._id);
            fetchOrders();
        } catch (error) {
            console.error('Failed to confirm payment:', error);
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
        } catch (error) {
            console.error('Failed to update status:', error);
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

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-600 mt-1">Manage orders, confirm payments, and update status</p>
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

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        options={statusOptions}
                    />
                    <Select
                        value={paymentFilter}
                        onChange={(e) => {
                            setPaymentFilter(e.target.value);
                            setPage(1);
                        }}
                        options={paymentStatusOptions}
                    />
                    <Button onClick={handleSearch} leftIcon={<Filter size={18} />}>
                        Apply Filters
                    </Button>
                </div>
            </Card>

            {/* Orders Table */}
            <Card padding="none">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-green-600" size={40} />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Order
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Payment
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
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
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <Link
                                                    to={`/orders/${order._id}`}
                                                    className="font-medium text-green-600 hover:text-green-700"
                                                >
                                                    {order.orderNumber}
                                                </Link>
                                                <p className="text-xs text-gray-500">
                                                    {order.items.length} items
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {order.customerSnapshot.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {order.customerSnapshot.phone}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                    {statusIcons[order.status]}
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                                                    {paymentConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-semibold text-gray-900">
                                                    ₹{order.totalAmount.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canConfirmPayment && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
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
                                                            {nextStatus === 'accepted' && 'Accept'}
                                                            {nextStatus === 'in_transit' && 'Ship'}
                                                            {nextStatus === 'delivered' && 'Deliver'}
                                                        </Button>
                                                    )}
                                                    <Link to={`/orders/${order._id}`}>
                                                        <Button size="sm" variant="ghost">
                                                            <ChevronRight size={18} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
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
            </Card>

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

export default AdminOrdersPage;
