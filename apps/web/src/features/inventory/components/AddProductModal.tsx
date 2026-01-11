/**
 * Add Product Modal
 * ==================
 * Modal form for creating new products
 * Used by both Admin and Employee (with role-based restrictions)
 */

import { useState, useRef } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Textarea } from '../../../shared/ui/Textarea';
import { Button } from '../../../shared/ui/Button';
import { Package, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import productsApi from '../../products/productsapi';
import type { CreateProductPayload } from '../inventory.types';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isEmployee?: boolean;
}

const categoryOptions = [
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'others', label: 'Others' },
];

const companyOptions = [
    { value: '', label: 'Select Company' },
    { value: 'company_1', label: 'Company 1' },
    { value: 'company_2', label: 'Company 2' },
    { value: 'company_3', label: 'Company 3' },
    { value: 'company_4', label: 'Company 4' },
    { value: 'company_5', label: 'Company 5' },
    { value: 'company_6', label: 'Company 6' },
    { value: 'company_7', label: 'Company 7' },
    { value: 'company_8', label: 'Company 8' },
    { value: 'company_9', label: 'Company 9' },
];

const unitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'l', label: 'Litre (l)' },
    { value: 'ml', label: 'Millilitre (ml)' },
    { value: 'piece', label: 'Piece' },
    { value: 'packet', label: 'Packet' },
    { value: 'bag', label: 'Bag' },
    { value: 'box', label: 'Box' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
];

const gstOptions = [
    { value: '0', label: '0%' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' },
];

interface ImagePreview {
    file: File;
    preview: string;
}

export function AddProductModal({
    isOpen,
    onClose,
    onSuccess,
    isEmployee = false,
}: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<ImagePreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<CreateProductPayload> & { company?: string }>({
        name: '',
        category: 'seeds',
        description: '',
        brand: '',
        company: '',
        basePrice: 0,
        unit: 'kg',
        packSize: '',
        minOrderQuantity: 1,
        stockTotal: 0,
        lowStockThreshold: 10,
        gstRate: 18,
        isActive: true,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        let processedValue: string | number | boolean = value;

        if (type === 'number') {
            processedValue = value === '' ? 0 : parseFloat(value);
        } else if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
        }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ImagePreview[] = [];

        Array.from(files).forEach((file) => {
            if (file.type.startsWith('image/')) {
                const preview = URL.createObjectURL(file);
                newImages.push({ file, preview });
            }
        });

        setImages((prev) => [...prev, ...newImages].slice(0, 5)); // Max 5 images

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.name?.trim()) {
            setError('Product name is required');
            return;
        }
        if (!formData.basePrice || formData.basePrice <= 0) {
            setError('Please enter a valid price');
            return;
        }

        setLoading(true);
        try {
            // Prepare image URLs (in a real app, you'd upload to cloud storage first)
            const imageUrls = images.map((img, idx) => ({
                url: img.preview, // In production, this would be the uploaded URL
                alt: formData.name || 'Product image',
                isPrimary: idx === 0,
            }));

            await productsApi.createProduct({
                ...formData,
                gstRate: Number(formData.gstRate),
                manufacturer: formData.company, // Map company to manufacturer field
                images: imageUrls.length > 0 ? imageUrls : undefined,
            } as any);

            // Clean up previews
            images.forEach((img) => URL.revokeObjectURL(img.preview));

            // Reset form
            setFormData({
                name: '',
                category: 'seeds',
                description: '',
                brand: '',
                company: '',
                basePrice: 0,
                unit: 'kg',
                packSize: '',
                minOrderQuantity: 1,
                stockTotal: 0,
                lowStockThreshold: 10,
                gstRate: 18,
                isActive: true,
            });
            setImages([]);

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        // Clean up image previews
        images.forEach((img) => URL.revokeObjectURL(img.preview));
        setImages([]);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add New Product"
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle size={18} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <Package size={16} />
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Input
                                label="Product Name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                placeholder="e.g. Hybrid Tomato Seeds"
                                required
                            />
                        </div>

                        <Select
                            label="Category"
                            name="category"
                            value={formData.category || 'seeds'}
                            onChange={handleChange}
                            options={categoryOptions}
                            required
                        />

                        <Select
                            label="Company"
                            name="company"
                            value={formData.company || ''}
                            onChange={handleChange}
                            options={companyOptions}
                        />

                        <Input
                            label="Brand"
                            name="brand"
                            value={formData.brand || ''}
                            onChange={handleChange}
                            placeholder="e.g. Syngenta"
                        />
                    </div>

                    <Textarea
                        label="Description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Enter product description..."
                        rows={3}
                    />
                </div>

                {/* Product Images - Admin only */}
                {!isEmployee && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <ImageIcon size={16} />
                            Product Images
                        </h3>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group"
                                    >
                                        <img
                                            src={img.preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {index === 0 && (
                                            <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs text-center py-0.5">
                                                Primary
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {images.length < 5 && (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="product-images"
                                />
                                <label
                                    htmlFor="product-images"
                                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                                >
                                    <Upload size={20} className="text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        Click to upload images ({images.length}/5)
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* Pricing & Units */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Pricing & Units
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="Base Price (₹)"
                            name="basePrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.basePrice || ''}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                        />

                        <Select
                            label="Unit"
                            name="unit"
                            value={formData.unit || 'kg'}
                            onChange={handleChange}
                            options={unitOptions}
                            required
                        />

                        <Input
                            label="Pack Size"
                            name="packSize"
                            value={formData.packSize || ''}
                            onChange={handleChange}
                            placeholder="e.g. 5kg, 1L"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="GST Rate"
                            name="gstRate"
                            value={String(formData.gstRate || 18)}
                            onChange={handleChange}
                            options={gstOptions}
                        />

                        <Input
                            label="Min Order Quantity"
                            name="minOrderQuantity"
                            type="number"
                            min="1"
                            value={formData.minOrderQuantity || 1}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Stock Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Initial Stock"
                            name="stockTotal"
                            type="number"
                            min="0"
                            value={formData.stockTotal || 0}
                            onChange={handleChange}
                            helperText="Units available for sale"
                        />

                        <Input
                            label="Low Stock Threshold"
                            name="lowStockThreshold"
                            type="number"
                            min="0"
                            value={formData.lowStockThreshold || 10}
                            onChange={handleChange}
                            helperText="Alert when stock falls below"
                        />
                    </div>
                </div>

                {/* Status - Admin only */}
                {!isEmployee && (
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive ?? true}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isActive: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-700">
                            Product is active and visible to customers
                        </label>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className="flex-1"
                    >
                        Add Product
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default AddProductModal;
