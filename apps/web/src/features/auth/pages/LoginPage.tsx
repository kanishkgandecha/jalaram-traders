/**
 * Login Page
 * ===========
 * User login form with email/phone and password
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { useAuthStore } from '../authstore';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearError();
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const redirectUrl = await login(formData.identifier, formData.password);
            navigate(redirectUrl);
        } catch (err) {
            // Error is handled by store
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg mb-4">
                        <Leaf className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Jalaram Traders</h1>
                    <p className="text-gray-600 mt-1">Seeds • Fertilizers • Pesticides</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Welcome back</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email or Phone"
                            name="identifier"
                            type="text"
                            placeholder="Enter email or phone number"
                            value={formData.identifier}
                            onChange={handleChange}
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
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

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" fullWidth isLoading={isLoading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    © 2024 Jalaram Traders, Yavatmal
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
