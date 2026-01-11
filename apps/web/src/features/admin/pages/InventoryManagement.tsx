/**
 * Admin Inventory Management Page
 * =================================
 * Full-featured inventory management dashboard for admin users
 * 
 * Features:
 * - Complete product list with stock status
 * - Add/Edit product modals
 * - Stock operations (add, adjust, mark damaged)
 * - Filters (category, stock status, search)
 * - Low-stock alerts panel
 * - Link to inventory logs
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    Plus,
    Minus,
    AlertTriangle,
    History,
    Search,
    Edit,
    RefreshCw,
    TrendingDown,
    X,
    ArrowUpDown,
    Trash2,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { Badge, StockStatusBadge } from '../../../shared/ui/Badge';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Textarea } from '../../../shared/ui/Textarea';
import AddProductModal from '../../inventory/components/AddProductModal';
import EditProductModal from '../../inventory/components/EditProductModal';
import inventoryApi from '../../inventory/inventory.api';
import productsApi from '../../products/productsapi';
import type { Product } from '../../products/productstypes';
import type { LowStockProduct, InventoryStats } from '../../inventory/inventory.types';

type FilterType = 'all' | 'low-stock' | 'out-of-stock';
type StockModalType = 'add' | 'adjust' | 'damaged' | null;

const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'others', label: 'Others' },
];

export function InventoryManagement() {
    // Data state
    const [products, setProducts] = useState<Product[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [outOfStockProducts, setOutOfStockProducts] = useState<LowStockProduct[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [stockFilter, setStockFilter] = useState<FilterType>('all');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | LowStockProduct | null>(null);
    const [stockModalType, setStockModalType] = useState<StockModalType>(null);

    // Form state for stock operations
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Alert panel
    const [showAlerts, setShowAlerts] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, lowStockRes, outOfStockRes, statsRes] = await Promise.all([
                productsApi.getProducts({ limit: 200 }),
                inventoryApi.getLowStock(50),
                inventoryApi.getOutOfStock(50),
                inventoryApi.getStats(),
            ]);

            setProducts(productsRes.data || []);
            setLowStockProducts(lowStockRes.data || []);
            setOutOfStockProducts(outOfStockRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
            setMessage({ type: 'error', text: 'Failed to load inventory data' });
        } finally {
            setLoading(false);
        }
    };

    const getDisplayProducts = () => {
        let list: (Product | LowStockProduct)[] = [];

        if (stockFilter === 'low-stock') {
            list = lowStockProducts;
        } else if (stockFilter === 'out-of-stock') {
            list = outOfStockProducts;
        } else {
            list = products;
        }

        // Apply category filter
        if (categoryFilter) {
            list = list.filter((p) => p.category === categoryFilter);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    (p as any).brand?.toLowerCase().includes(term)
            );
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
        if (isNaN(qty) || (stockModalType !== 'adjust' && qty <= 0)) {
            setMessage({ type: 'error', text: 'Please enter a valid quantity' });
            return;
        }

        if ((stockModalType === 'adjust' || stockModalType === 'damaged') && !reason.trim()) {
            setMessage({ type: 'error', text: 'Reason is required' });
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
            } else if (stockModalType === 'adjust') {
                await inventoryApi.adjustStock({
                    productId: selectedProduct._id,
                    quantity: qty,
                    reason,
                });
                setMessage({ type: 'success', text: `Stock adjusted by ${qty} units` });
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

    const handleDeleteProduct = async (product: Product) => {
        if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await productsApi.deleteProduct(product._id);
            setMessage({ type: 'success', text: 'Product deleted successfully' });
            fetchData();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to delete product',
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
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
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
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-600">Manage product stock levels and view movement history</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </Button>
                    <Link to="/dashboard/admin/inventory/logs">
                        <Button variant="outline">
                            <History size={16} className="mr-2" />
                            View Logs
                        </Button>
                    </Link>
                    <Button onClick={() => setShowAddProduct(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.products.totalProducts}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <Package size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Stock Units</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.products.totalStockUnits.toLocaleString()}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {stats.products.totalReserved.toLocaleString()} reserved
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <Package size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card className={stats.products.lowStock > 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                    {stats.products.lowStock}
                                </p>
                                <button
                                    onClick={() => setStockFilter('low-stock')}
                                    className="text-xs text-yellow-700 hover:underline mt-1"
                                >
                                    View items →
                                </button>
                            </div>
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card className={stats.products.outOfStock > 0 ? 'border-red-300 bg-red-50/50' : ''}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {stats.products.outOfStock}
                                </p>
                                <button
                                    onClick={() => setStockFilter('out-of-stock')}
                                    className="text-xs text-red-700 hover:underline mt-1"
                                >
                                    View items →
                                </button>
                            </div>
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <TrendingDown size={24} />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Low Stock Alert Banner */}
            {alertCount > 0 && showAlerts && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-yellow-800">
                                    Inventory Alerts
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    {lowStockProducts.length > 0 && (
                                        <span className="mr-4">
                                            <strong>{lowStockProducts.length}</strong> products running low
                                        </span>
                                    )}
                                    {outOfStockProducts.length > 0 && (
                                        <span>
                                            <strong>{outOfStockProducts.length}</strong> products out of stock
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAlerts(false)}
                            className="text-yellow-600 hover:text-yellow-700"
                        >
                            <X size={20} />
                        </button>
                    </div>
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

            {/* Filters */}
            <Card>
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products by name or brand..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="w-full lg:w-48">
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={categoryOptions}
                        />
                    </div>

                    {/* Stock Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStockFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${stockFilter === 'all'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStockFilter('low-stock')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${stockFilter === 'low-stock'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Low Stock
                        </button>
                        <button
                            onClick={() => setStockFilter('out-of-stock')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${stockFilter === 'out-of-stock'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Out of Stock
                        </button>
                    </div>
                </div>
            </Card>

            {/* Products Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Product
                                </th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Category
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                                    Total
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                                    Reserved
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                                    Available
                                </th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                                    Status
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayProducts.map((product) => {
                                const { stockTotal, stockReserved, stockAvailable, lowStockThreshold } =
                                    getStockValues(product);

                                return (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <Package size={20} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {(product as any).brand || (product as any).unit}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="default" className="capitalize">
                                                {product.category}
                                            </Badge>
                                        </td>
                                        <td className="text-center px-4 py-3 font-medium text-gray-900">
                                            {stockTotal}
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <span className="text-blue-600">{stockReserved}</span>
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <span className="font-bold text-gray-900">{stockAvailable}</span>
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <StockStatusBadge available={stockAvailable} threshold={lowStockThreshold} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => openStockModal(product, 'add')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Add Stock"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openStockModal(product, 'adjust')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Adjust Stock"
                                                >
                                                    <ArrowUpDown size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openStockModal(product, 'damaged')}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Mark Damaged"
                                                >
                                                    <Minus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingProduct(product as Product)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product as Product)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {displayProducts.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="mx-auto mb-3 text-gray-300" size={48} />
                            <p className="font-medium">No products found</p>
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add Product Modal */}
            <AddProductModal
                isOpen={showAddProduct}
                onClose={() => setShowAddProduct(false)}
                onSuccess={fetchData}
            />

            {/* Edit Product Modal */}
            <EditProductModal
                isOpen={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                onSuccess={fetchData}
                product={editingProduct}
            />

            {/* Stock Operation Modal */}
            {stockModalType && selectedProduct && (
                <Modal
                    isOpen={true}
                    onClose={closeStockModal}
                    title={
                        stockModalType === 'add'
                            ? 'Add Stock'
                            : stockModalType === 'adjust'
                                ? 'Adjust Stock'
                                : 'Mark Damaged'
                    }
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
                            label={stockModalType === 'adjust' ? 'Quantity (use negative to reduce)' : 'Quantity'}
                            type="number"
                            min={stockModalType === 'adjust' ? undefined : 1}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={stockModalType === 'adjust' ? 'e.g. 10 or -5' : 'Enter quantity'}
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
                                    : stockModalType === 'adjust'
                                        ? 'e.g. Inventory audit correction'
                                        : 'e.g. Damaged during transport, expired'
                            }
                            rows={3}
                            required={stockModalType !== 'add'}
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
                                {stockModalType === 'add' && 'Add Stock'}
                                {stockModalType === 'adjust' && 'Adjust Stock'}
                                {stockModalType === 'damaged' && 'Mark Damaged'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default InventoryManagement;
