/**
 * Profile Page
 * =============
 * User profile viewing and editing page
 * Supports profile image upload with preview
 * 
 * Light green and white agricultural theme
 */

import { useState, useRef, useEffect } from 'react';
import {
    User as UserIcon,
    Camera,
    Save,
    X,
    Edit2,
    Mail,
    Phone,
    MapPin,
    Building2,
    FileText,
    Shield,
    Check,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { useAuthStore } from '../auth/authstore';
import profileApi from './profileapi';
import type { UpdateProfilePayload } from './profiletypes';

// API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ProfilePage() {
    const { user, updateUser, logout } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<UpdateProfilePayload>({
        name: '',
        phone: '',
        businessName: '',
        gstin: '',
        address: {
            street: '',
            city: '',
            district: '',
            state: 'Maharashtra',
            pincode: '',
        },
    });

    // Initialize form data from user
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                businessName: user.businessName || '',
                gstin: user.gstin || '',
                address: {
                    street: user.address?.street || '',
                    city: user.address?.city || '',
                    district: user.address?.district || '',
                    state: user.address?.state || 'Maharashtra',
                    pincode: user.address?.pincode || '',
                },
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setFormData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    [field]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload JPG, PNG, or WEBP.');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            setError('File too large. Maximum size is 2MB.');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload immediately
        setImageLoading(true);
        setError(null);

        try {
            const response = await profileApi.uploadProfileImage(file);
            updateUser(response.data.user);
            setSuccess('Profile image updated successfully!');
            setImagePreview(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload image');
            setImagePreview(null);
        } finally {
            setImageLoading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Basic validation
        if (!formData.name?.trim()) {
            setError('Name is required');
            setLoading(false);
            return;
        }

        if (formData.phone && formData.phone.trim() && !/^[6-9]\d{9}$/.test(formData.phone)) {
            setError('Please enter a valid 10-digit Indian mobile number');
            setLoading(false);
            return;
        }

        try {
            // Clean form data - only send fields with actual values
            const cleanedData: UpdateProfilePayload = {};

            // Name is required, always send it
            if (formData.name?.trim()) {
                cleanedData.name = formData.name.trim();
            }

            // Optional fields - only send if they have values
            if (formData.phone?.trim()) {
                cleanedData.phone = formData.phone.trim();
            }
            if (formData.businessName?.trim()) {
                cleanedData.businessName = formData.businessName.trim();
            }
            if (formData.gstin?.trim()) {
                cleanedData.gstin = formData.gstin.trim().toUpperCase();
            }

            // Clean address - only include non-empty fields
            const addressFields = formData.address || {};
            const cleanedAddress: Record<string, string> = {};
            if (addressFields.street?.trim()) cleanedAddress.street = addressFields.street.trim();
            if (addressFields.city?.trim()) cleanedAddress.city = addressFields.city.trim();
            if (addressFields.district?.trim()) cleanedAddress.district = addressFields.district.trim();
            if (addressFields.state?.trim()) cleanedAddress.state = addressFields.state.trim();
            if (addressFields.pincode?.trim()) cleanedAddress.pincode = addressFields.pincode.trim();

            if (Object.keys(cleanedAddress).length > 0) {
                cleanedData.address = cleanedAddress;
            }

            const response = await profileApi.updateProfile(cleanedData);
            updateUser(response.data.user);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            // Handle validation errors with field details
            const errorData = err.response?.data;
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                const fieldErrors = errorData.errors.map((e: { field: string; message: string }) => e.message).join(', ');
                setError(fieldErrors || errorData.message);
            } else {
                setError(errorData?.message || 'Failed to update profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form to user data
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                businessName: user.businessName || '',
                gstin: user.gstin || '',
                address: {
                    street: user.address?.street || '',
                    city: user.address?.city || '',
                    district: user.address?.district || '',
                    state: user.address?.state || 'Maharashtra',
                    pincode: user.address?.pincode || '',
                },
            });
        }
        setIsEditing(false);
        setError(null);
    };

    // Get profile image URL
    const getProfileImageUrl = () => {
        if (imagePreview) return imagePreview;
        if (user?.profileImage) {
            return `${API_BASE_URL}${user.profileImage}`;
        }
        return null;
    };

    const profileImageUrl = getProfileImageUrl();

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                    <Check size={20} />
                    <span>{success}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto p-1 hover:bg-red-100 rounded"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Profile Image Section */}
                <Card className="mb-6 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={handleImageClick}
                                disabled={imageLoading}
                                className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg hover:shadow-xl transition-shadow bg-green-100 flex items-center justify-center group"
                            >
                                {imageLoading ? (
                                    <Loader2 size={40} className="text-green-600 animate-spin" />
                                ) : profileImageUrl ? (
                                    <>
                                        <img
                                            src={profileImageUrl}
                                            alt={user?.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="text-white" size={28} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <UserIcon size={48} className="text-green-600" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="text-white" size={28} />
                                        </div>
                                    </>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>

                        {/* User Info Summary */}
                        <div className="text-center sm:text-left flex-1">
                            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                            <p className="text-gray-500">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${user?.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : user?.role === 'employee'
                                            ? 'bg-blue-100 text-blue-700'
                                            : user?.role === 'retailer'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                >
                                    {user?.role}
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${user?.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {user?.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Click on the avatar to upload a new photo
                            </p>
                        </div>

                        {/* Edit Button */}
                        {!isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2"
                            >
                                <Edit2 size={16} />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Profile Details */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <UserIcon size={20} className="text-green-600" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name - Editable */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <UserIcon size={14} />
                                Full Name
                            </label>
                            {isEditing ? (
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your name"
                                    required
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.name}</p>
                            )}
                        </div>

                        {/* Email - Read Only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Mail size={14} />
                                Email
                                <span className="text-xs text-gray-400">(Read-only)</span>
                            </label>
                            <p className="text-gray-900 py-2 bg-gray-50 px-3 rounded-lg">{user?.email}</p>
                        </div>

                        {/* Phone - Editable */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Phone size={14} />
                                Phone Number
                            </label>
                            {isEditing ? (
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="10-digit mobile number"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.phone || '-'}</p>
                            )}
                        </div>

                        {/* Role - Read Only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Shield size={14} />
                                Role
                                <span className="text-xs text-gray-400">(Read-only)</span>
                            </label>
                            <p className="text-gray-900 py-2 bg-gray-50 px-3 rounded-lg capitalize">
                                {user?.role}
                            </p>
                        </div>
                    </div>

                    {/* Business Information (for retailers) */}
                    {(user?.role === 'retailer' || user?.businessName || user?.gstin) && (
                        <>
                            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-6 flex items-center gap-2">
                                <Building2 size={20} className="text-green-600" />
                                Business Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Business Name - Editable */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Building2 size={14} />
                                        Business Name
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleInputChange}
                                            placeholder="Your business name"
                                        />
                                    ) : (
                                        <p className="text-gray-900 py-2">{user?.businessName || '-'}</p>
                                    )}
                                </div>

                                {/* GSTIN - Editable */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FileText size={14} />
                                        GSTIN
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            name="gstin"
                                            value={formData.gstin}
                                            onChange={handleInputChange}
                                            placeholder="15-digit GSTIN"
                                        />
                                    ) : (
                                        <p className="text-gray-900 py-2">{user?.gstin || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Address Section */}
                    <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-6 flex items-center gap-2">
                        <MapPin size={20} className="text-green-600" />
                        Address
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address
                            </label>
                            {isEditing ? (
                                <Input
                                    name="address.street"
                                    value={formData.address?.street}
                                    onChange={handleInputChange}
                                    placeholder="House/Building, Street, Area"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.address?.street || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            {isEditing ? (
                                <Input
                                    name="address.city"
                                    value={formData.address?.city}
                                    onChange={handleInputChange}
                                    placeholder="City"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.address?.city || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                            {isEditing ? (
                                <Input
                                    name="address.district"
                                    value={formData.address?.district}
                                    onChange={handleInputChange}
                                    placeholder="District"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.address?.district || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            {isEditing ? (
                                <Input
                                    name="address.state"
                                    value={formData.address?.state}
                                    onChange={handleInputChange}
                                    placeholder="State"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.address?.state || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                            {isEditing ? (
                                <Input
                                    name="address.pincode"
                                    value={formData.address?.pincode}
                                    onChange={handleInputChange}
                                    placeholder="6-digit pincode"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{user?.address?.pincode || '-'}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                            <Button type="submit" isLoading={loading} className="flex items-center gap-2">
                                <Save size={16} />
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Logout Button */}
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProfilePage;
