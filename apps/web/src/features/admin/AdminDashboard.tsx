/**
 * Admin Dashboard
 * ================
 * Admin overview with stats, charts, and quick actions
 * Includes order management shortcuts and pending payment alerts
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    Package,
    ShoppingCart,
    IndianRupee,
    AlertTriangle,
    CreditCard,
    Boxes,
} from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import adminApi, { type DashboardStats } from './adminapi';
import ordersApi from '../orders/ordersapi';
import { ORDER_STATUS_CONFIG } from '../orders/orderstypes';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
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

export function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchPendingPayments();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminApi.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPayments = async () => {
        try {
            const response = await ordersApi.getPendingPaymentOrders(1, 1);
            setPendingPaymentCount(response.meta.pagination.total);
        } catch (error) {
            console.error('Failed to fetch pending payments:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                            <div className="h-8 bg-gray-200 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Pending Payment Alert */}
            {pendingPaymentCount > 0 && (
                <Link to="/dashboard/admin/orders?paymentStatus=submitted" className="block mb-2">
                    <Card className="bg-yellow-50 border border-yellow-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <p className="font-semibold text-yellow-800">
                                        {pendingPaymentCount} Payment{pendingPaymentCount > 1 ? 's' : ''} Awaiting Confirmation
                                    </p>
                                    <p className="text-sm text-yellow-600">
                                        Click to review and confirm pending payments
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="primary">
                                Review Now
                            </Button>
                        </div>
                    </Card>
                </Link>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
                            <p className="text-2xl font-bold mt-1">
                                {formatCurrency(stats?.revenue.today || 0)}
                            </p>
                            <p className="text-green-100 text-sm mt-2">
                                Month: {formatCurrency(stats?.revenue.thisMonth || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <IndianRupee size={24} />
                        </div>
                    </div>
                </Card>

                {/* Orders */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Today's Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats?.orders.today || 0}
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                Pending: {stats?.orders.pending || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                </Card>

                {/* Users */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats?.users.total || 0}
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                Retailers: {stats?.users.retailers || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                    </div>
                </Card>

                {/* Products */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Products</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats?.products.total || 0}
                            </p>
                            {(stats?.products.lowStock || 0) > 0 && (
                                <p className="text-orange-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertTriangle size={14} />
                                    {stats?.products.lowStock} low stock
                                </p>
                            )}
                        </div>
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <Package size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                <Link
                    to="/dashboard/admin/orders"
                    className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <ShoppingCart size={20} />
                    </div>
                    <span className="font-medium text-gray-900">Manage Orders</span>
                </Link>
                <Link
                    to="/dashboard/admin/inventory"
                    className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <Boxes size={20} />
                    </div>
                    <span className="font-medium text-gray-900">Inventory</span>
                </Link>
                <Link
                    to="/dashboard/admin/products"
                    className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Package size={20} />
                    </div>
                    <span className="font-medium text-gray-900">Products</span>
                </Link>
                <Link
                    to="/dashboard/admin/users"
                    className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Users size={20} />
                    </div>
                    <span className="font-medium text-gray-900">Users</span>
                </Link>
                <Link
                    to="/dashboard/admin/reports"
                    className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <span className="font-medium text-gray-900">Reports</span>
                </Link>
            </div>

            {/* Recent Orders */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                    <Link
                        to="/dashboard/admin/orders"
                        className="text-green-600 text-sm font-medium hover:text-green-700"
                    >
                        View All
                    </Link>
                </div>

                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <th className="pb-3 font-medium">Order</th>
                                    <th className="pb-3 font-medium">Customer</th>
                                    <th className="pb-3 font-medium">Amount</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="py-3">
                                            <Link
                                                to={`/orders/${order._id}`}
                                                className="font-medium text-green-600 hover:text-green-700"
                                            >
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {order.user?.name || 'N/A'}
                                        </td>
                                        <td className="py-3 font-medium text-gray-900">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-500 text-sm">
                                            {formatDate(order.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No recent orders</p>
                )}
            </Card>
        </div>
    );
}

export default AdminDashboard;
