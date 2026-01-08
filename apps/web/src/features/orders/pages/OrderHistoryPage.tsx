/**
 * Order History Page
 * ===================
 * List of user's past orders
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Package, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import ordersApi from '../ordersapi';
import type { Order } from '../orderstypes';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    pending: { icon: <Clock size={16} />, color: 'text-yellow-600 bg-yellow-50', label: 'Pending' },
    confirmed: { icon: <CheckCircle size={16} />, color: 'text-blue-600 bg-blue-50', label: 'Confirmed' },
    processing: { icon: <Package size={16} />, color: 'text-blue-600 bg-blue-50', label: 'Processing' },
    packed: { icon: <Package size={16} />, color: 'text-purple-600 bg-purple-50', label: 'Packed' },
    shipped: { icon: <Truck size={16} />, color: 'text-indigo-600 bg-indigo-50', label: 'Shipped' },
    out_for_delivery: { icon: <Truck size={16} />, color: 'text-green-600 bg-green-50', label: 'Out for Delivery' },
    delivered: { icon: <CheckCircle size={16} />, color: 'text-green-600 bg-green-50', label: 'Delivered' },
    cancelled: { icon: <XCircle size={16} />, color: 'text-red-600 bg-red-50', label: 'Cancelled' },
    returned: { icon: <XCircle size={16} />, color: 'text-gray-600 bg-gray-50', label: 'Returned' },
};

export function OrderHistoryPage() {
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
                    <Link to="/products">
                        <Button>Start Shopping</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = statusConfig[order.status];
                        return (
                            <Link key={order._id} to={`/orders/${order._id}`}>
                                <Card hover padding="sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Order Number & Date */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-semibold text-gray-900">
                                                    {order.orderNumber}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Date & Items */}
                                            <p className="text-sm text-gray-500">
                                                Placed on {formatDate(order.createdAt)} • {order.items.length} items
                                            </p>

                                            {/* Items Preview */}
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                                                {order.items.map(item => item.productSnapshot.name).join(', ')}
                                            </p>
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
