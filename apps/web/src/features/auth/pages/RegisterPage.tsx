/**
 * Register Page
 * ==============
 * User registration form
 * Supports Google Sign-In for quick registration
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { useAuthStore } from '../authstore';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, googleLogin, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'retailer' as 'retailer' | 'farmer',
        businessName: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        clearError();
        setValidationError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            setValidationError('Please enter a valid 10-digit mobile number');
            return;
        }

        try {
            const redirectUrl = await register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
                businessName: formData.businessName || undefined,
            });
            navigate(redirectUrl);
        } catch (err) {
            // Error handled by store
        }
    };

    const displayError = validationError || error;

    const handleGoogleSuccess = async (idToken: string) => {
        try {
            const redirectUrl = await googleLogin(idToken);
            navigate(redirectUrl);
        } catch (err) {
            // Error handled by store
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Login</span>
                </Link>

                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg mb-3">
                        <img
                            src="/logo-white.png"
                            alt="Logo"
                            className="w-6 h-6"
                        />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
                </div>

                {/* Register Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Account Type
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="retailer">Retailer (Wholesale)</option>
                                <option value="farmer">Farmer (Individual)</option>
                            </select>
                        </div>

                        {formData.role === 'retailer' && (
                            <Input
                                label="Business Name"
                                name="businessName"
                                placeholder="Your shop/business name"
                                value={formData.businessName}
                                onChange={handleChange}
                            />
                        )}

                        <div className="relative">
                            <Input
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />

                        {displayError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {displayError}
                            </div>
                        )}

                        <Button type="submit" fullWidth isLoading={isLoading}>
                            Create Account
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-500">or sign up with</span>
                        </div>
                    </div>

                    {/* Google Sign-In */}
                    <GoogleSignInButton
                        onSuccess={handleGoogleSuccess}
                        onError={(err) => console.error('Google Sign-In Error:', err)}
                    />

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
