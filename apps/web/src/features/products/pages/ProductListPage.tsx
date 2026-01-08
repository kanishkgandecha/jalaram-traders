/**
 * Product List Page
 * ==================
 * Browse products with filtering and search
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Package, ShoppingCart } from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import productsApi from '../productsapi';
import type { Product, ProductFilters } from '../productstypes';

const categories = [
    { value: '', label: 'All Categories' },
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
];

export function ProductListPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ProductFilters>({
        page: 1,
        limit: 12,
        category: '',
        search: '',
    });
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await productsApi.getProducts(filters);
            setProducts(response.data);
            setTotalPages(response.meta.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setFilters({ ...filters, search: formData.get('search') as string, page: 1 });
    };

    const handleCategoryChange = (category: string) => {
        setFilters({ ...filters, category, page: 1 });
    };

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600 mt-1">Browse our agricultural products</p>
            </div>

            {/* Search & Filters */}
            <div className="mb-6 space-y-4">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        name="search"
                        type="text"
                        placeholder="Search products..."
                        defaultValue={filters.search}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </form>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filters.category === cat.value
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                            <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <Link key={product._id} to={`/products/${product._id}`}>
                            <Card hover padding="sm" className="h-full">
                                {/* Product Image */}
                                <div className="aspect-square bg-green-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="text-green-300" size={48} />
                                    )}
                                </div>

                                {/* Product Info */}
                                <div>
                                    <span className="text-xs text-green-600 font-medium uppercase">
                                        {product.category}
                                    </span>
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mt-1">
                                        {product.name}
                                    </h3>
                                    {product.brand && (
                                        <p className="text-sm text-gray-500 mt-0.5">{product.brand}</p>
                                    )}
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-lg font-bold text-green-600">
                                            ₹{product.basePrice}
                                        </span>
                                        <span className="text-sm text-gray-500">/{product.unit}</span>
                                    </div>
                                    {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                                        <span className="text-xs text-orange-600 font-medium">Low Stock</span>
                                    )}
                                    {product.stock === 0 && (
                                        <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page === 1}
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-gray-600">
                        Page {filters.page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page === totalPages}
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

export default ProductListPage;
