/**
 * Home/Dashboard Page
 * ====================
 * Landing page with featured products and quick actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, ClipboardList, Leaf, ArrowRight } from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/authstore';
import productsApi from '../products/productsapi';
import type { Product } from '../products/productstypes';

const categories = [
    { name: 'Seeds', icon: '🌱', slug: 'seeds', color: 'bg-green-100 text-green-700' },
    { name: 'Fertilizers', icon: '🧪', slug: 'fertilizers', color: 'bg-blue-100 text-blue-700' },
    { name: 'Pesticides', icon: '🛡️', slug: 'pesticides', color: 'bg-orange-100 text-orange-700' },
    { name: 'Tools', icon: '🔧', slug: 'tools', color: 'bg-purple-100 text-purple-700' },
];

export function HomePage() {
    const { user, isAuthenticated } = useAuthStore();
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedProducts();
    }, []);

    const fetchFeaturedProducts = async () => {
        try {
            const response = await productsApi.getFeatured(4);
            setFeaturedProducts(response.data.products);
        } catch (error) {
            console.error('Failed to fetch featured products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Leaf size={28} />
                    <span className="text-green-200 text-sm font-medium">Jalaram Traders</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                    {isAuthenticated ? `Welcome back, ${user?.name?.split(' ')[0]}!` : 'Welcome!'}
                </h1>
                <p className="text-green-100 mb-4">
                    Your trusted partner for quality seeds, fertilizers & pesticides
                </p>
                {!isAuthenticated && (
                    <Link to="/login">
                        <Button variant="secondary" size="sm">
                            Sign In to Order
                        </Button>
                    </Link>
                )}
            </div>

            {/* Quick Actions */}
            {isAuthenticated && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <Link to="/products">
                        <Card hover padding="sm" className="text-center">
                            <Package className="mx-auto text-green-600 mb-2" size={24} />
                            <span className="text-sm font-medium text-gray-700">Products</span>
                        </Card>
                    </Link>
                    <Link to="/cart">
                        <Card hover padding="sm" className="text-center">
                            <ShoppingCart className="mx-auto text-green-600 mb-2" size={24} />
                            <span className="text-sm font-medium text-gray-700">Cart</span>
                        </Card>
                    </Link>
                    <Link to="/orders">
                        <Card hover padding="sm" className="text-center">
                            <ClipboardList className="mx-auto text-green-600 mb-2" size={24} />
                            <span className="text-sm font-medium text-gray-700">Orders</span>
                        </Card>
                    </Link>
                </div>
            )}

            {/* Categories */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                    <Link to="/products" className="text-green-600 text-sm font-medium">
                        View All
                    </Link>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                        <Link
                            key={cat.slug}
                            to={`/products?category=${cat.slug}`}
                            className="text-center"
                        >
                            <div className={`${cat.color} w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2`}>
                                {cat.icon}
                            </div>
                            <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Featured Products */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Featured Products</h2>
                    <Link to="/products" className="text-green-600 text-sm font-medium flex items-center gap-1">
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
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {featuredProducts.map((product) => (
                            <Link key={product._id} to={`/products/${product._id}`}>
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
                )}
            </div>
        </div>
    );
}

export default HomePage;
