/**
 * Product List Page
 * ==================
 * Browse products by category first, then by brand within categories
 * Search by product name or brand/company name
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Search,
    Package,
    Sprout,
    FlaskConical,
    Bug,
    Wrench,
    Cog,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Building2,
    Tag
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { useAuthStore } from '../../auth/authstore';
import productsApi from '../productsapi';
import type { Product, ProductFilters } from '../productstypes';

// Category definitions with icons
const categoryConfig = [
    { value: 'seeds', label: 'Seeds', icon: Sprout, color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-600' },
    { value: 'fertilizers', label: 'Fertilizers', icon: FlaskConical, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { value: 'pesticides', label: 'Pesticides', icon: Bug, color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-600' },
    { value: 'tools', label: 'Tools', icon: Wrench, color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { value: 'equipment', label: 'Equipment', icon: Cog, color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-600' },
];

export function ProductListPage() {
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
    const [allBrands, setAllBrands] = useState<string[]>([]);

    const selectedCategory = searchParams.get('category') || '';
    const searchQuery = searchParams.get('search') || '';
    const selectedBrand = searchParams.get('brand') || '';

    // Fetch all products for category counts and brands
    useEffect(() => {
        fetchAllProducts();
    }, []);

    // Fetch filtered products when category/search/brand changes
    useEffect(() => {
        if (selectedCategory || searchQuery || selectedBrand) {
            fetchProducts();
        }
    }, [selectedCategory, searchQuery, selectedBrand]);

    const fetchAllProducts = async () => {
        try {
            const response = await productsApi.getProducts({ limit: 1000 });
            setAllProducts(response.data);

            // Calculate category counts
            const counts: Record<string, number> = {};
            const brands = new Set<string>();
            response.data.forEach((p: Product) => {
                counts[p.category] = (counts[p.category] || 0) + 1;
                if (p.brand) brands.add(p.brand);
            });
            setCategoryCounts(counts);
            setAllBrands(Array.from(brands).sort());
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const filters: ProductFilters = { limit: 1000 };
            if (selectedCategory) filters.category = selectedCategory;
            if (searchQuery) filters.search = searchQuery;

            const response = await productsApi.getProducts(filters);

            // Filter by brand (client-side since API may not support brand filter)
            let filteredProducts = response.data;
            if (selectedBrand) {
                filteredProducts = filteredProducts.filter(
                    (p: Product) => p.brand?.toLowerCase() === selectedBrand.toLowerCase()
                );
            }

            setProducts(filteredProducts);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group products by brand
    const productsByBrand = useMemo(() => {
        const grouped: Record<string, Product[]> = {};
        products.forEach(product => {
            const brand = product.brand || 'Other';
            if (!grouped[brand]) grouped[brand] = [];
            grouped[brand].push(product);
        });
        return Object.fromEntries(
            Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
        );
    }, [products]);

    // Get brands filtered by current category
    const brandsInCategory = useMemo(() => {
        if (!selectedCategory) return allBrands;
        const brands = new Set<string>();
        allProducts
            .filter(p => p.category === selectedCategory)
            .forEach(p => { if (p.brand) brands.add(p.brand); });
        return Array.from(brands).sort();
    }, [allProducts, selectedCategory, allBrands]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        setSearchParams(prev => {
            if (search) prev.set('search', search);
            else prev.delete('search');
            return prev;
        });
    };

    const handleCategorySelect = (category: string) => {
        setSearchParams({ category });
        setExpandedBrands(new Set());
    };

    const handleBrandSelect = (brand: string) => {
        setSearchParams(prev => {
            if (brand) {
                prev.set('brand', brand);
                if (!prev.get('category')) prev.delete('category');
            } else {
                prev.delete('brand');
            }
            return prev;
        });
    };

    const handleBack = () => {
        if (selectedBrand && selectedCategory) {
            // Go back to category view
            setSearchParams({ category: selectedCategory });
        } else {
            // Go back to landing
            setSearchParams({});
            setProducts([]);
        }
    };

    const toggleBrand = (brand: string) => {
        setExpandedBrands(prev => {
            const next = new Set(prev);
            if (next.has(brand)) next.delete(brand);
            else next.add(brand);
            return next;
        });
    };

    // Category Landing View (no category/search/brand selected)
    if (!selectedCategory && !searchQuery && !selectedBrand) {
        return (
            <div className="px-4 py-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-600 mt-1">Browse by category or search by product/company name</p>
                </div>

                {/* Search Bar with suggestions */}
                <form onSubmit={handleSearch} className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        name="search"
                        type="text"
                        placeholder="Search products or company name..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </form>

                {/* Brand Quick Filter */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 size={20} className="text-green-600" />
                        Browse by Company
                    </h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                        {allBrands.slice(0, 15).map((brand) => (
                            <button
                                key={brand}
                                onClick={() => handleBrandSelect(brand)}
                                className="px-4 py-2 bg-white rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                            >
                                {brand}
                            </button>
                        ))}
                        {allBrands.length > 15 && (
                            <button className="px-4 py-2 text-green-600 text-sm font-medium whitespace-nowrap">
                                +{allBrands.length - 15} more
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Cards Grid */}
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Browse by Category</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categoryConfig.map((cat) => {
                        const Icon = cat.icon;
                        const count = categoryCounts[cat.value] || 0;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => handleCategorySelect(cat.value)}
                                className={`${cat.lightColor} rounded-2xl p-6 text-center transition-all hover:scale-105 hover:shadow-lg border border-transparent hover:border-green-200`}
                            >
                                <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                    <Icon className="text-white" size={32} />
                                </div>
                                <h3 className={`font-semibold ${cat.textColor} text-lg`}>{cat.label}</h3>
                                <p className="text-gray-500 text-sm mt-1">{count} items</p>
                            </button>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="mt-8 text-center text-gray-500">
                    <p>{allProducts.length} products • {allBrands.length} companies</p>
                </div>
            </div>
        );
    }

    // Category/Brand View with Grouping
    const currentCategoryConfig = categoryConfig.find(c => c.value === selectedCategory);
    const pageTitle = selectedBrand
        ? selectedBrand
        : (currentCategoryConfig?.label || 'Search Results');

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Header with Back Button */}
            <div className="mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-3"
                >
                    <ArrowLeft size={20} />
                    <span>{selectedBrand && selectedCategory ? 'Back to Category' : 'Back to Categories'}</span>
                </button>
                <div className="flex items-center gap-3">
                    {currentCategoryConfig && !selectedBrand && (
                        <div className={`w-12 h-12 ${currentCategoryConfig.color} rounded-xl flex items-center justify-center`}>
                            <currentCategoryConfig.icon className="text-white" size={24} />
                        </div>
                    )}
                    {selectedBrand && (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                            <Building2 className="text-white" size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                        <p className="text-gray-600">
                            {searchQuery ? `Search: "${searchQuery}"` : `${products.length} products`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    name="search"
                    type="text"
                    placeholder={`Search in ${pageTitle}...`}
                    defaultValue={searchQuery}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </form>

            {/* Brand Filter Pills (when in category view) */}
            {selectedCategory && !selectedBrand && brandsInCategory.length > 0 && (
                <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">Filter by company:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                        {brandsInCategory.map((brand) => (
                            <button
                                key={brand}
                                onClick={() => {
                                    setSearchParams({ category: selectedCategory, brand });
                                }}
                                className="px-3 py-1.5 bg-white rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-xl p-4">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="h-24 bg-gray-100 rounded-lg" />
                                ))}
                            </div>
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
                /* Brand Sections */
                <div className="space-y-4">
                    {Object.entries(productsByBrand).map(([brand, brandProducts]) => {
                        const isExpanded = expandedBrands.has(brand);
                        const displayProducts = isExpanded ? brandProducts : brandProducts.slice(0, 6);
                        const hasMore = brandProducts.length > 6;

                        return (
                            <div key={brand} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                {/* Brand Header */}
                                <button
                                    onClick={() => toggleBrand(brand)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                                            {brand.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900">{brand}</h3>
                                            <p className="text-sm text-gray-500">{brandProducts.length} products</p>
                                        </div>
                                    </div>
                                    {hasMore && (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <span className="text-sm font-medium">
                                                {isExpanded ? 'Show less' : `View all ${brandProducts.length}`}
                                            </span>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    )}
                                </button>

                                {/* Products Grid - Compact without images */}
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {displayProducts.map((product) => (
                                            <Link key={product._id} to={`${basePath}/products/${product._id}`}>
                                                <Card hover padding="sm" className="h-full">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                                                {product.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                {product.hsnCode && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
                                                                        HSN: {product.hsnCode}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-500">{product.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-lg font-bold text-green-600">
                                                                ₹{product.basePrice || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ProductListPage;
