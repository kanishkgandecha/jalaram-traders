/**
 * Brand Management Page (Admin)
 * ==============================
 * Manage company/brand logos for better product browsing
 */

import { useState, useEffect, useRef } from 'react';
import {
    Building2,
    Upload,
    Search,
    Package,
    Image,
    Loader2,
    Check,
    X,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import brandsApi from '../brandsapi';
import type { Brand } from '../brandsapi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function BrandManagementPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const data = await brandsApi.getAllBrands();
            setBrands(data);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            setMessage({ type: 'error', text: 'Failed to load brands' });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = (brandName: string) => {
        setSelectedBrand(brandName);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBrand) return;

        setUploading(selectedBrand);
        setMessage(null);

        try {
            await brandsApi.uploadLogo(selectedBrand, file);
            setMessage({ type: 'success', text: `Logo uploaded for ${selectedBrand}` });
            fetchBrands();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to upload logo',
            });
        } finally {
            setUploading(null);
            setSelectedBrand(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLogoUrl = (brand: Brand) => {
        if (brand.logo?.url) {
            return brand.logo.url.startsWith('http')
                ? brand.logo.url
                : `${API_BASE_URL}${brand.logo.url}`;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
                <p className="text-gray-600 mt-1">Upload logos for companies to display on product pages</p>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg flex items-center justify-between ${message.type === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
                        {message.text}
                    </span>
                    <button onClick={() => setMessage(null)}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Brands Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                            <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-3" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
                        </div>
                    ))}
                </div>
            ) : filteredBrands.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Building2 className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="font-medium">No brands found</p>
                    <p className="text-sm mt-1">Brands appear automatically when you add products</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredBrands.map((brand) => {
                        const logoUrl = getLogoUrl(brand);
                        const isUploading = uploading === brand.name;

                        return (
                            <Card key={brand.name} className="text-center relative group">
                                {/* Logo or Placeholder */}
                                <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt={brand.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                                            {brand.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Brand Name */}
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                    {brand.name}
                                </h3>

                                {/* Product Count */}
                                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                                    <Package size={12} />
                                    {brand.productCount} products
                                </p>

                                {/* Upload Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={() => handleUploadClick(brand.name)}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={14} className="mr-1 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : logoUrl ? (
                                        <>
                                            <Image size={14} className="mr-1" />
                                            Change Logo
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={14} className="mr-1" />
                                            Add Logo
                                        </>
                                    )}
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Stats Footer */}
            <div className="text-center text-sm text-gray-500">
                {brands.length} total brands • {brands.filter((b) => b.logo?.url).length} with logos
            </div>
        </div>
    );
}

export default BrandManagementPage;
