/**
 * Retailer Dashboard
 * ====================
 * Order-focused dashboard for retailers
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    ShoppingCart,
    ClipboardList,
    ArrowRight,
} from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/authstore';
import productsApi from '../products/productsapi';
import type { Product } from '../products/productstypes';

export function RetailerDashboard() {
    const { user } = useAuthStore();
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedProducts();
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

    const basePath = `/dashboard/${user?.role || 'retailer'}`;

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

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                <Link to={`${basePath}/products`}>
                    <Card hover className="text-center py-4">
                        <Package className="mx-auto text-green-600 mb-2" size={28} />
                        <span className="text-sm font-medium text-gray-700">Products</span>
                    </Card>
                </Link>
                <Link to={`${basePath}/cart`}>
                    <Card hover className="text-center py-4">
                        <ShoppingCart className="mx-auto text-green-600 mb-2" size={28} />
                        <span className="text-sm font-medium text-gray-700">Cart</span>
                    </Card>
                </Link>
                <Link to={`${basePath}/orders`}>
                    <Card hover className="text-center py-4">
                        <ClipboardList className="mx-auto text-green-600 mb-2" size={28} />
                        <span className="text-sm font-medium text-gray-700">Orders</span>
                    </Card>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <p className="text-gray-500 text-sm">This Month's Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </Card>
                <Card>
                    <p className="text-gray-500 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹0</p>
                </Card>
            </div>

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
