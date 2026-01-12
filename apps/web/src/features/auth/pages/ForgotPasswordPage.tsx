/**
 * Forgot Password Page
 * =====================
 * 3-step password reset flow:
 * 1. Enter email/username
 * 2. Enter OTP
 * 3. Set new password
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Key, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import authApi from '../authapi';

type Step = 'request' | 'verify' | 'reset' | 'success';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('request');
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Step 1: Request OTP
    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authApi.forgotPassword(identifier);
            setMessage(response.message);
            setStep('verify');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!/^\d{6}$/.test(otp)) {
            setError('Please enter a valid 6-digit OTP');
            setLoading(false);
            return;
        }

        try {
            await authApi.verifyOTP(identifier, otp);
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await authApi.resetPassword(identifier, newPassword);
            setStep('success');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    to="/login"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Login</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            {step === 'success' ? (
                                <CheckCircle className="text-green-600" size={32} />
                            ) : step === 'reset' ? (
                                <Lock className="text-green-600" size={32} />
                            ) : step === 'verify' ? (
                                <Key className="text-green-600" size={32} />
                            ) : (
                                <Mail className="text-green-600" size={32} />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {step === 'success' ? 'Password Reset!' :
                                step === 'reset' ? 'Set New Password' :
                                    step === 'verify' ? 'Enter OTP' :
                                        'Forgot Password'}
                        </h1>
                        <p className="text-gray-500 mt-2">
                            {step === 'success' ? 'You can now login with your new password' :
                                step === 'reset' ? 'Create a strong new password' :
                                    step === 'verify' ? 'Check your email for the OTP' :
                                        "Enter your email or username to receive an OTP"}
                        </p>
                    </div>

                    {/* Step Progress */}
                    {step !== 'success' && (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {['request', 'verify', 'reset'].map((s, i) => (
                                <div
                                    key={s}
                                    className={`h-2 w-12 rounded-full transition-colors ${['request', 'verify', 'reset'].indexOf(step) >= i
                                            ? 'bg-green-500'
                                            : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {message && step === 'verify' && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                            {message}
                        </div>
                    )}

                    {/* Step 1: Request OTP */}
                    {step === 'request' && (
                        <form onSubmit={handleRequestOTP} className="space-y-5">
                            <Input
                                label="Email or Username"
                                type="text"
                                placeholder="Enter your email or username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                            <Button type="submit" fullWidth isLoading={loading}>
                                Send OTP
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <Input
                                label="Enter 6-digit OTP"
                                type="text"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                required
                            />
                            <Button type="submit" fullWidth isLoading={loading}>
                                Verify OTP
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep('request'); setError(''); }}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                Didn't receive OTP? Try again
                            </button>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" fullWidth isLoading={loading}>
                                Reset Password
                            </Button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="text-center">
                            <Button fullWidth onClick={() => navigate('/login')}>
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
