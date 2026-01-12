/**
 * Product Detail Page
 * ====================
 * Single product view with bulk pricing and add to cart
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Minus, Plus, ShoppingCart, Truck, Shield, Tag } from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../../auth/authstore';
import productsApi from '../productsapi';
import { cartApi } from '../../cart/cartapi';
import type { Product, PriceCalculation } from '../productstypes';

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [priceData, setPriceData] = useState<PriceCalculation | null>(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    useEffect(() => {
        if (product && quantity >= (product.minOrderQuantity || 1)) {
            calculatePrice();
        }
    }, [quantity, product]);

    const fetchProduct = async () => {
        try {
            const response = await productsApi.getById(id!);
            setProduct(response.data.product);
            setQuantity(response.data.product.minOrderQuantity || 1);
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePrice = async () => {
        if (!product) return;
        try {
            const response = await productsApi.calculatePrice(product._id, quantity);
            setPriceData(response.data.pricing);
        } catch (error) {
            console.error('Failed to calculate price:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;
        setAddingToCart(true);
        try {
            await cartApi.addToCart(product._id, quantity);
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 3000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setAddingToCart(false);
        }
    };

    const incrementQuantity = () => {
        if (!product) return;
        if (product.maxOrderQuantity && quantity >= product.maxOrderQuantity) return;
        if (quantity >= (product.stockAvailable ?? (product.stockTotal - product.stockReserved))) return;
        setQuantity(quantity + 1);
    };

    const decrementQuantity = () => {
        if (!product) return;
        if (quantity <= (product.minOrderQuantity || 1)) return;
        setQuantity(quantity - 1);
    };

    if (loading) {
        return (
            <div className="px-4 py-4">
                <div className="animate-pulse">
                    <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
                    <div className="aspect-square bg-gray-200 rounded-xl mb-6" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="px-4 py-8 text-center">
                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
                <Link to={`${basePath}/products`} className="text-green-600 hover:underline mt-2 inline-block">
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
                to={`${basePath}/products`}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4"
            >
                <ArrowLeft size={20} />
                <span>Back to Products</span>
            </Link>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="aspect-square bg-green-50 rounded-2xl flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? (
                        <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Package className="text-green-300" size={96} />
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                    <div>
                        <span className="text-sm text-green-600 font-medium uppercase">
                            {product.category}
                        </span>
                        <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {product.brand && (
                                <span className="text-sm text-gray-600">by {product.brand}</span>
                            )}
                            {product.hsnCode && (
                                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                    HSN/SAC: {product.hsnCode}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="py-4 border-y border-gray-100">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-green-600">
                                ₹{priceData?.pricePerUnit || product.basePrice}
                            </span>
                            <span className="text-gray-500">/{product.unit}</span>
                        </div>
                        {priceData && priceData.discountPercent > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500 line-through">
                                    ₹{product.basePrice}
                                </span>
                                <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {priceData.discountPercent}% off
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bulk Pricing Tiers */}
                    {product.bulkPricing?.length > 0 && (
                        <Card padding="sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag size={18} className="text-green-600" />
                                <span className="font-medium text-gray-900">Bulk Pricing</span>
                            </div>
                            <div className="space-y-2">
                                {product.bulkPricing.map((tier, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {tier.minQuantity}+ {product.unit}
                                        </span>
                                        <span className="font-medium text-green-600">
                                            ₹{tier.pricePerUnit}/{product.unit} ({tier.discountPercent}% off)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Quantity Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity (Min: {product.minOrderQuantity || 1} {product.unit})
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={decrementQuantity}
                                disabled={quantity <= (product.minOrderQuantity || 1)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <Minus size={20} />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(product.minOrderQuantity || 1, parseInt(e.target.value) || 1))}
                                className="w-24 text-center py-2 border border-gray-300 rounded-lg"
                            />
                            <button
                                onClick={incrementQuantity}
                                disabled={quantity >= (product.stockAvailable ?? (product.stockTotal - product.stockReserved))}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Total Price */}
                    {priceData && (
                        <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">₹{(priceData.subtotal ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">GST ({priceData.gstRate ?? 0}%)</span>
                                <span className="font-medium">₹{(priceData.gstAmount ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-green-200">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold text-green-600 text-lg">
                                    ₹{(priceData.total ?? 0).toFixed(2)}
                                </span>
                            </div>
                            {(priceData.savings ?? 0) > 0 && (
                                <p className="text-sm text-green-600 mt-2">
                                    You save ₹{(priceData.savings ?? 0).toFixed(2)} with bulk pricing!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Add to Cart */}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleAddToCart}
                        isLoading={addingToCart}
                        disabled={(product.stockAvailable ?? (product.stockTotal - product.stockReserved)) === 0}
                        leftIcon={<ShoppingCart size={20} />}
                    >
                        {addedToCart ? 'Added to Cart!' : (product.stockAvailable ?? (product.stockTotal - product.stockReserved)) === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck size={18} className="text-green-600" />
                            <span>Free delivery on bulk orders</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield size={18} className="text-green-600" />
                            <span>Quality guaranteed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            {product.description && (
                <Card className="mt-6">
                    <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
                    <p className="text-gray-600">{product.description}</p>
                </Card>
            )}
        </div>
    );
}

export default ProductDetailPage;
