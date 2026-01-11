/**
 * Employee Stock Management Page
 * ================================
 * Simplified, mobile-friendly stock management for employees
 * 
 * Features:
 * - Add new products
 * - Add stock (from supplier)
 * - Mark damaged/expired
 * - View product stock levels with status indicators
 * - NO access to adjustment or logs (admin only)
 */

import { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    AlertTriangle,
    Minus,
    Search,
    RefreshCw,
    X,
    Boxes,
    TrendingUp,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Textarea } from '../../../shared/ui/Textarea';
import { StockStatusBadge } from '../../../shared/ui/Badge';
import AddProductModal from '../../inventory/components/AddProductModal';
import inventoryApi from '../../inventory/inventory.api';
import productsApi from '../../products/productsapi';
import type { Product } from '../../products/productstypes';
import type { LowStockProduct } from '../../inventory/inventory.types';

type StockModalType = 'add' | 'damaged' | null;

const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'others', label: 'Others' },
];

export function StockManagement() {
    // Data state
    const [products, setProducts] = useState<Product[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [outOfStockProducts, setOutOfStockProducts] = useState<LowStockProduct[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // Modal state
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | LowStockProduct | null>(null);
    const [stockModalType, setStockModalType] = useState<StockModalType>(null);

    // Form state
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, lowStockRes, outOfStockRes] = await Promise.all([
                productsApi.getProducts({ limit: 200 }),
                inventoryApi.getLowStock(50),
                inventoryApi.getOutOfStock(50),
            ]);

            setProducts(productsRes.data || []);
            setLowStockProducts(lowStockRes.data || []);
            setOutOfStockProducts(outOfStockRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setMessage({ type: 'error', text: 'Failed to load products' });
        } finally {
            setLoading(false);
        }
    };

    const getDisplayProducts = () => {
        let list: (Product | LowStockProduct)[] = showLowStockOnly
            ? [...lowStockProducts, ...outOfStockProducts]
            : products;

        // Apply category filter
        if (categoryFilter) {
            list = list.filter((p) => p.category === categoryFilter);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(term));
        }

        return list;
    };

    const openStockModal = (product: Product | LowStockProduct, type: StockModalType) => {
        setSelectedProduct(product);
        setStockModalType(type);
        setQuantity('');
        setReason('');
        setMessage(null);
    };

    const closeStockModal = () => {
        setSelectedProduct(null);
        setStockModalType(null);
        setQuantity('');
        setReason('');
    };

    const handleStockAction = async () => {
        if (!selectedProduct || !stockModalType) return;

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid quantity' });
            return;
        }

        if (stockModalType === 'damaged' && !reason.trim()) {
            setMessage({ type: 'error', text: 'Reason is required for damaged stock' });
            return;
        }

        setActionLoading(true);
        try {
            if (stockModalType === 'add') {
                await inventoryApi.addStock({
                    productId: selectedProduct._id,
                    quantity: qty,
                    reason: reason || 'Stock received from supplier',
                });
                setMessage({ type: 'success', text: `Successfully added ${qty} units` });
            } else if (stockModalType === 'damaged') {
                await inventoryApi.markDamaged({
                    productId: selectedProduct._id,
                    quantity: qty,
                    reason,
                });
                setMessage({ type: 'success', text: `Marked ${qty} units as damaged` });
            }

            closeStockModal();
            fetchData();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Operation failed',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickAdd = async (product: Product | LowStockProduct, qty: number) => {
        try {
            await inventoryApi.addStock({
                productId: product._id,
                quantity: qty,
                reason: 'Quick stock add',
            });
            setMessage({ type: 'success', text: `Added ${qty} units to ${product.name}` });
            fetchData();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to add stock',
            });
        }
    };

    const getStockValues = (product: Product | LowStockProduct) => {
        const stockTotal = 'stockTotal' in product ? product.stockTotal : 0;
        const stockReserved = 'stockReserved' in product ? product.stockReserved : 0;
        const stockAvailable =
            'stockAvailable' in product && product.stockAvailable !== undefined
                ? product.stockAvailable
                : stockTotal - stockReserved;
        const lowStockThreshold = 'lowStockThreshold' in product ? product.lowStockThreshold : 10;

        return { stockTotal, stockReserved, stockAvailable, lowStockThreshold };
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const displayProducts = getDisplayProducts();
    const alertCount = lowStockProducts.length + outOfStockProducts.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
                    <p className="text-gray-600">Add stock and manage inventory</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowAddProduct(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-200 text-green-700 rounded-xl">
                            <Boxes size={24} />
                        </div>
                        <div>
                            <p className="text-green-700 text-sm font-medium">Total Products</p>
                            <p className="text-2xl font-bold text-green-800">{products.length}</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className={`cursor-pointer transition-all ${alertCount > 0 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : ''
                        }`}
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    hover
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-200 text-yellow-700 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-yellow-700 text-sm font-medium">Needs Restock</p>
                            <p className="text-2xl font-bold text-yellow-800">{alertCount}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hidden sm:block">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-200 text-blue-700 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-blue-700 text-sm font-medium">In Stock</p>
                            <p className="text-2xl font-bold text-blue-800">
                                {products.length - outOfStockProducts.length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {alertCount > 0 && showLowStockOnly && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-yellow-600" size={24} />
                        <div>
                            <p className="font-medium text-yellow-800">
                                Showing {alertCount} products that need attention
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLowStockOnly(false)}
                        className="text-yellow-700 hover:text-yellow-800"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg flex items-center justify-between ${message.type === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}
                >
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Search & Filters */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={categoryOptions}
                        />
                    </div>
                </div>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayProducts.map((product) => {
                    const { stockTotal, stockReserved, stockAvailable, lowStockThreshold } =
                        getStockValues(product);

                    return (
                        <Card key={product._id} hover className="flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Package size={24} className="text-green-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                                    </div>
                                </div>
                                <StockStatusBadge available={stockAvailable} threshold={lowStockThreshold} />
                            </div>

                            {/* Stock Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="p-3 bg-gray-50 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 mb-1">Total</p>
                                    <p className="text-lg font-bold text-gray-900">{stockTotal}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 mb-1">Reserved</p>
                                    <p className="text-lg font-bold text-blue-600">{stockReserved}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 mb-1">Available</p>
                                    <p className="text-lg font-bold text-green-600">{stockAvailable}</p>
                                </div>
                            </div>

                            {/* Quick Add Buttons */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => handleQuickAdd(product, 1)}
                                    className="flex-1 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                    +1
                                </button>
                                <button
                                    onClick={() => handleQuickAdd(product, 5)}
                                    className="flex-1 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                    +5
                                </button>
                                <button
                                    onClick={() => handleQuickAdd(product, 10)}
                                    className="flex-1 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                    +10
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto">
                                <Button
                                    size="sm"
                                    onClick={() => openStockModal(product, 'add')}
                                    className="flex-1"
                                >
                                    <Plus size={16} className="mr-1" />
                                    Add Stock
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openStockModal(product, 'damaged')}
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <Minus size={16} className="mr-1" />
                                    Damaged
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {displayProducts.length === 0 && (
                <Card className="text-center py-12">
                    <Package className="mx-auto mb-4 text-gray-300" size={48} />
                    <p className="text-gray-500 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                </Card>
            )}

            {/* Add Product Modal */}
            <AddProductModal
                isOpen={showAddProduct}
                onClose={() => setShowAddProduct(false)}
                onSuccess={fetchData}
                isEmployee={true}
            />

            {/* Stock Operation Modal */}
            {stockModalType && selectedProduct && (
                <Modal
                    isOpen={true}
                    onClose={closeStockModal}
                    title={stockModalType === 'add' ? 'Add Stock' : 'Mark Damaged'}
                    size="sm"
                >
                    <div className="space-y-4">
                        {/* Product Info */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{selectedProduct.category}</p>
                            <div className="mt-2 text-sm">
                                <span className="text-gray-600">
                                    Current: <strong>{getStockValues(selectedProduct).stockTotal}</strong>
                                </span>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="text-gray-600">
                                    Available: <strong>{getStockValues(selectedProduct).stockAvailable}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Quantity Input */}
                        <Input
                            label="Quantity"
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            required
                        />

                        {/* Reason */}
                        <Textarea
                            label="Reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={
                                stockModalType === 'add'
                                    ? 'e.g. Received from supplier'
                                    : 'e.g. Damaged during transport, expired'
                            }
                            rows={3}
                            required={stockModalType === 'damaged'}
                        />

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={closeStockModal} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStockAction}
                                isLoading={actionLoading}
                                className="flex-1"
                                variant={stockModalType === 'damaged' ? 'danger' : 'primary'}
                            >
                                {stockModalType === 'add' ? 'Add Stock' : 'Mark Damaged'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default StockManagement;
