/**
 * Cart Page
 * ==========
 * Shopping cart with quantity controls
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package } from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { useCartStore } from '../cartstore';
import { useAuthStore } from '../../auth/authstore';

export function CartPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;
    const { cart, isLoading, fetchCart, updateQuantity, removeItem, clearCart } = useCartStore();

    useEffect(() => {
        fetchCart();
    }, []);

    const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            await removeItem(productId);
        } else {
            await updateQuantity(productId, newQuantity);
        }
    };

    if (isLoading && !cart) {
        return (
            <div className="px-4 py-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
                            <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const isEmpty = !cart?.items || cart.items.length === 0;

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                    <p className="text-gray-600 mt-1">
                        {cart?.itemCount || 0} items in your cart
                    </p>
                </div>
                {!isEmpty && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                        Clear All
                    </Button>
                )}
            </div>

            {isEmpty ? (
                <div className="text-center py-12">
                    <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                    <p className="text-gray-500 mt-1 mb-6">
                        Add some products to get started
                    </p>
                    <Link to={`${basePath}/products`}>
                        <Button>Browse Products</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart?.items.map((item) => (
                            <Card key={item._id} padding="sm">
                                <div className="flex gap-4">
                                    {/* Product Image */}
                                    <Link
                                        to={`${basePath}/products/${item.product._id}`}
                                        className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                                    >
                                        {item.product.images?.[0] ? (
                                            <img
                                                src={item.product.images[0].url}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="text-green-300" size={32} />
                                        )}
                                    </Link>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`${basePath}/products/${item.product._id}`}
                                            className="font-medium text-gray-900 hover:text-green-600 line-clamp-2"
                                        >
                                            {item.product.name}
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {item.product.brand}
                                        </p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="font-semibold text-green-600">
                                                ₹{item.appliedPrice}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                /{item.product.unit}
                                            </span>
                                            {item.discountPercent > 0 && (
                                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                    {item.discountPercent}% off
                                                </span>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-12 text-center font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">
                                                    ₹{item.subtotal.toFixed(2)}
                                                </span>
                                                <button
                                                    onClick={() => removeItem(item.product._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">₹{cart?.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estimated GST</span>
                                    <span className="font-medium">₹{cart?.estimatedGst.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between">
                                    <span className="font-semibold">Estimated Total</span>
                                    <span className="font-bold text-lg text-green-600">
                                        ₹{cart?.estimatedTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                fullWidth
                                size="lg"
                                className="mt-6"
                                onClick={() => navigate(`${basePath}/checkout`)}
                                rightIcon={<ArrowRight size={20} />}
                            >
                                Proceed to Checkout
                            </Button>

                            <Link
                                to={`${basePath}/products`}
                                className="block text-center text-green-600 hover:text-green-700 mt-4 text-sm"
                            >
                                Continue Shopping
                            </Link>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;
