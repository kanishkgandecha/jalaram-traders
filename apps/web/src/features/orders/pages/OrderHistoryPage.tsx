/**
 * Order History Page
 * ===================
 * List of user's past orders with new status flow
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ClipboardList,
    Package,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    CreditCard,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../../auth/authstore';
import ordersApi from '../ordersapi';
import type { Order } from '../orderstypes';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../orderstypes';

const statusIcons: Record<string, React.ReactNode> = {
    pending_payment: <Clock size={16} />,
    paid: <CreditCard size={16} />,
    accepted: <Package size={16} />,
    in_transit: <Truck size={16} />,
    delivered: <CheckCircle size={16} />,
    cancelled: <XCircle size={16} />,
};

export function OrderHistoryPage() {
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await ordersApi.getMyOrders(page, 10);
            setOrders(response.data);
            setTotalPages(response.meta.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading && orders.length === 0) {
        return (
            <div className="px-4 py-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4">
                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="text-gray-600 mt-1">Track and manage your orders</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <ClipboardList className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                    <p className="text-gray-500 mt-1 mb-6">
                        Your order history will appear here
                    </p>
                    <Link to={`${basePath}/products`}>
                        <Button>Start Shopping</Button>
                    </Link>
                </div>
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

                        return (
                            <Link key={order._id} to={`${basePath}/orders/${order._id}`}>
                                <Card hover padding="sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Order Number & Status */}
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="font-semibold text-gray-900">
                                                    {order.orderNumber}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                    {statusIcons[order.status]}
                                                    {statusConfig.label}
                                                </span>
                                                {order.paymentStatus !== 'confirmed' && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                                                        <CreditCard size={12} />
                                                        {paymentConfig.label}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Date & Items */}
                                            <p className="text-sm text-gray-500">
                                                Placed on {formatDate(order.createdAt)} • {order.items.length} items
                                            </p>

                                            {/* Items Preview */}
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                                                {order.items.map(item => item.productSnapshot.name).join(', ')}
                                            </p>

                                            {/* Show action hint for pending payment */}
                                            {order.status === 'pending_payment' && order.paymentStatus === 'pending' && (
                                                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Click to complete payment
                                                </p>
                                            )}
                                            {order.status === 'pending_payment' && order.paymentStatus === 'submitted' && (
                                                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Payment verification in progress
                                                </p>
                                            )}
                                        </div>

                                        {/* Total & Arrow */}
                                        <div className="text-right ml-4">
                                            <p className="font-bold text-green-600 text-lg">
                                                ₹{order.totalAmount.toFixed(2)}
                                            </p>
                                            <ChevronRight className="text-gray-400 mt-2 ml-auto" size={20} />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-4 text-gray-600">
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
        </div>
    );
}

export default OrderHistoryPage;
