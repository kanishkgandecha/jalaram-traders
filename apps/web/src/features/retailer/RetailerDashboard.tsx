/**
 * Retailer Dashboard
 * ====================
 * Order-focused dashboard for retailers
 * Shows active orders and quick actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    ShoppingCart,
    ClipboardList,
    ArrowRight,
    Clock,
    Truck,
    CheckCircle,
    CreditCard,
} from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/authstore';
import { useCartStore } from '../cart/cartstore';
import productsApi from '../products/productsapi';
import ordersApi from '../orders/ordersapi';
import type { Product } from '../products/productstypes';
import type { Order } from '../orders/orderstypes';
import { ORDER_STATUS_CONFIG } from '../orders/orderstypes';

export function RetailerDashboard() {
    const { user } = useAuthStore();
    const { itemCount, fetchCart } = useCartStore();
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedProducts();
        fetchRecentOrders();
        fetchCart();
    }, []);

    const fetchFeaturedProducts = async () => {
        try {
            const response = await productsApi.getFeatured(4);
            setFeaturedProducts(response.data.products || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            const response = await ordersApi.getMyOrders(1, 3);
            setRecentOrders(response.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const basePath = `/dashboard/${user?.role || 'retailer'}`;

    const statusIcons: Record<string, React.ReactNode> = {
        pending_payment: <Clock size={14} className="text-yellow-600" />,
        paid: <CreditCard size={14} className="text-blue-600" />,
        accepted: <Package size={14} className="text-purple-600" />,
        in_transit: <Truck size={14} className="text-indigo-600" />,
        delivered: <CheckCircle size={14} className="text-green-600" />,
    };

    const statusColors: Record<string, string> = {
        pending_payment: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-blue-100 text-blue-700',
        accepted: 'bg-purple-100 text-purple-700',
        in_transit: 'bg-indigo-100 text-indigo-700',
        delivered: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    // Check if there are any pending payment orders
    const pendingPaymentOrders = recentOrders.filter(
        o => o.status === 'pending_payment' && o.paymentStatus === 'pending'
    );

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <img
                        src="/logo-white.png"
                        alt="Logo"
                        className="w-6 h-6"
                    />
                    <span className="text-green-200 text-sm">Jalaram Traders</span>
                </div>
                <h1 className="text-2xl font-bold mb-1">
                    Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                {user?.businessName && (
                    <p className="text-green-100">{user.businessName}</p>
                )}
                <p className="text-green-100 mt-2">
                    Browse our products and place your bulk orders today.
                </p>
            </div>

            {/* Pending Payment Alert */}
            {pendingPaymentOrders.length > 0 && (
                <Link to={`/orders/${pendingPaymentOrders[0]._id}`}>
                    <Card className="bg-yellow-50 border border-yellow-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg animate-pulse">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-yellow-800">
                                        Complete your payment
                                    </p>
                                    <p className="text-sm text-yellow-600">
                                        Order {pendingPaymentOrders[0].orderNumber} is awaiting payment
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="primary">
                                Pay Now
                            </Button>
                        </div>
                    </Card>
                </Link>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                <Link to={`${basePath}/products`}>
                    <Card hover className="text-center py-4">
                        <Package className="mx-auto text-green-600 mb-2" size={28} />
                        <span className="text-sm font-medium text-gray-700">Products</span>
                    </Card>
                </Link>
                <Link to={`${basePath}/cart`}>
                    <Card hover className="text-center py-4 relative">
                        <ShoppingCart className="mx-auto text-green-600 mb-2" size={28} />
                        <span className="text-sm font-medium text-gray-700">Cart</span>
                        {itemCount > 0 && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-green-600 text-white text-xs flex items-center justify-center rounded-full">
                                {itemCount}
                            </span>
                        )}
                    </Card>
                </Link>
                <Link to={`${basePath}/orders`}>
                    <Card hover className="text-center py-4">
                        <ClipboardList className="mx-auto text-green-600 mb-2" size={28} />
                        <span className="text-sm font-medium text-gray-700">Orders</span>
                    </Card>
                </Link>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                        <Link
                            to={`${basePath}/orders`}
                            className="text-green-600 text-sm font-medium flex items-center gap-1 hover:text-green-700"
                        >
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentOrders.map((order) => (
                            <Link key={order._id} to={`/orders/${order._id}`}>
                                <Card hover padding="sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${statusColors[order.status]?.replace('text-', 'bg-').replace('-700', '-100') || 'bg-gray-100'}`}>
                                                {statusIcons[order.status] || <Package size={14} />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                                <p className="text-xs text-gray-500">
                                                    {order.items.length} items • ₹{order.totalAmount.toFixed(0)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Products */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Featured Products</h2>
                    <Link
                        to={`${basePath}/products`}
                        className="text-green-600 text-sm font-medium flex items-center gap-1 hover:text-green-700"
                    >
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {featuredProducts.map((product) => (
                            <Link key={product._id} to={`${basePath}/products/${product._id}`}>
                                <Card hover padding="sm">
                                    <div className="aspect-square bg-green-50 rounded-lg mb-3 flex items-center justify-center">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <Package className="text-green-300" size={40} />
                                        )}
                                    </div>
                                    <span className="text-xs text-green-600 font-medium uppercase">
                                        {product.category}
                                    </span>
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mt-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="font-bold text-green-600">₹{product.basePrice}</span>
                                        <span className="text-xs text-gray-500">/{product.unit}</span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-8">
                        <Package className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500">No products available</p>
                    </Card>
                )}
            </div>

            {/* CTA */}
            <Card className="bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Ready to order?</h3>
                        <p className="text-sm text-gray-600">
                            Browse our full catalog and get bulk discounts!
                        </p>
                    </div>
                    <Link to={`${basePath}/products`}>
                        <Button size="sm">
                            Browse Products
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default RetailerDashboard;
