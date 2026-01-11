/**
 * Employee Dashboard
 * ===================
 * Task-focused dashboard for employees
 * Shows order stats and pending actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    ClipboardList,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    CreditCard,
    Truck,
    Boxes,
} from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/authstore';
import ordersApi from '../orders/ordersapi';
import type { Order } from '../orders/orderstypes';
import { ORDER_STATUS_CONFIG } from '../orders/orderstypes';

interface OrderStats {
    pendingPayment: number;
    toAccept: number;
    inTransit: number;
    recentOrders: Order[];
}

export function EmployeeDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<OrderStats>({
        pendingPayment: 0,
        toAccept: 0,
        inTransit: 0,
        recentOrders: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch all orders to calculate stats
            const response = await ordersApi.getAllOrders({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
            const orders = response.data;

            // Calculate counts
            const pendingPayment = orders.filter(
                o => o.status === 'pending_payment' && o.paymentStatus === 'submitted'
            ).length;
            const toAccept = orders.filter(o => o.status === 'paid').length;
            const inTransit = orders.filter(o => o.status === 'in_transit').length;

            setStats({
                pendingPayment,
                toAccept,
                inTransit,
                recentOrders: orders.slice(0, 5),
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusColors: Record<string, string> = {
        pending_payment: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-blue-100 text-blue-700',
        accepted: 'bg-purple-100 text-purple-700',
        in_transit: 'bg-indigo-100 text-indigo-700',
        delivered: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-600">Here's your work summary for today.</p>
            </div>

            {/* Pending Payment Alert */}
            {stats.pendingPayment > 0 && (
                <Link to="/dashboard/employee/orders">
                    <Card className="bg-yellow-50 border border-yellow-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl animate-pulse">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <p className="font-semibold text-yellow-800">
                                        {stats.pendingPayment} Payment{stats.pendingPayment > 1 ? 's' : ''} Need Confirmation
                                    </p>
                                    <p className="text-sm text-yellow-600">
                                        Review and confirm pending payments
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="primary">
                                Review
                            </Button>
                        </div>
                    </Card>
                </Link>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/dashboard/employee/orders">
                    <Card hover className={stats.pendingPayment > 0 ? 'ring-2 ring-yellow-300' : ''}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Awaiting Payment</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {loading ? '...' : stats.pendingPayment}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                    <Clock size={12} />
                                    Needs confirmation
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                                <CreditCard size={24} />
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link to="/dashboard/employee/orders">
                    <Card hover className={stats.toAccept > 0 ? 'ring-2 ring-blue-300' : ''}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">To Accept</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {loading ? '...' : stats.toAccept}
                                </p>
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <Package size={12} />
                                    Paid, need processing
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <Package size={24} />
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link to="/dashboard/employee/orders">
                    <Card hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">In Transit</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {loading ? '...' : stats.inTransit}
                                </p>
                                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                                    <Truck size={12} />
                                    Out for delivery
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                <Truck size={24} />
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link to="/dashboard/employee/orders">
                        <Card hover className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Manage Orders</h3>
                                <p className="text-sm text-gray-500">Confirm payments & update status</p>
                            </div>
                        </Card>
                    </Link>

                    <Link to="/dashboard/employee/stock">
                        <Card hover className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <Boxes size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Manage Stock</h3>
                                <p className="text-sm text-gray-500">Update product stock levels</p>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <Link
                        to="/dashboard/employee/orders"
                        className="text-green-600 text-sm font-medium hover:text-green-700"
                    >
                        View All
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stats.recentOrders.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {stats.recentOrders.map((order) => (
                            <Link
                                key={order._id}
                                to={`/orders/${order._id}`}
                                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                    <p className="text-sm text-gray-500">
                                        {order.customerSnapshot.name} • ₹{order.totalAmount.toFixed(0)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <ClipboardList className="mx-auto mb-3 text-gray-300" size={48} />
                        <p>No recent orders</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default EmployeeDashboard;
