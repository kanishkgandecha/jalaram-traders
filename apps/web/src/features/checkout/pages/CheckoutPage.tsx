/**
 * Checkout Page
 * ==============
 * Complete checkout flow with payment information display
 * For Retailers only
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShoppingBag,
    CreditCard,
    QrCode,
    Building2,
    Copy,
    Check,
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { useCartStore } from '../../cart/cartstore';
import { useAuthStore } from '../../auth/authstore';
import ordersApi from '../../orders/ordersapi';
import profileApi from '../../profile/profileapi';
import type { CreateOrderRequest, Address } from '../../orders/orderstypes';

// Dummy payment information (replace with actual values)
const PAYMENT_INFO = {
    upiId: 'jalaramtraders@upi',
    accountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    accountHolderName: 'Jalaram Traders',
};

type CheckoutStep = 'address' | 'payment' | 'confirmation';

export function CheckoutPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;
    const { cart, fetchCart, isLoading: cartLoading } = useCartStore();

    const [step, setStep] = useState<CheckoutStep>('address');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank_transfer'>('upi');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
    const [saveAddress, setSaveAddress] = useState(true);

    const [shippingAddress, setShippingAddress] = useState<Address>({
        name: user?.name || '',
        phone: user?.phone || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        district: user?.address?.district || '',
        state: user?.address?.state || 'Maharashtra',
        pincode: user?.address?.pincode || '',
    });

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        if (user) {
            setShippingAddress(prev => ({
                ...prev,
                name: user.name || prev.name,
                phone: user.phone || prev.phone,
                street: user.address?.street || prev.street,
                city: user.address?.city || prev.city,
                district: user.address?.district || prev.district,
                state: user.address?.state || prev.state,
                pincode: user.address?.pincode || prev.pincode,
            }));
        }
    }, [user]);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({ ...prev, [name]: value }));
    };

    const validateAddress = (): boolean => {
        if (!shippingAddress.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!shippingAddress.phone.trim() || shippingAddress.phone.length < 10) {
            setError('Valid phone number is required');
            return false;
        }
        if (!shippingAddress.street.trim()) {
            setError('Street address is required');
            return false;
        }
        if (!shippingAddress.city.trim()) {
            setError('City is required');
            return false;
        }
        if (!shippingAddress.district?.trim()) {
            setError('District is required');
            return false;
        }
        if (!shippingAddress.state.trim()) {
            setError('State is required');
            return false;
        }
        if (!shippingAddress.pincode.trim() || shippingAddress.pincode.length !== 6) {
            setError('Valid 6-digit pincode is required');
            return false;
        }
        return true;
    };


    const handleCreateOrder = async () => {
        setError(null);

        if (!validateAddress()) return;

        setLoading(true);
        try {
            // Save address to profile if checkbox is checked
            if (saveAddress) {
                await profileApi.updateProfile({
                    phone: shippingAddress.phone,
                    address: {
                        street: shippingAddress.street,
                        city: shippingAddress.city,
                        district: shippingAddress.district,
                        state: shippingAddress.state,
                        pincode: shippingAddress.pincode,
                    },
                });
            }

            const orderData: CreateOrderRequest = {
                shippingAddress,
                paymentMethod,
            };

            const response = await ordersApi.createOrder(orderData);
            setOrderId(response.data.order._id);
            setStep('payment');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!orderId) return;

        setLoading(true);
        try {
            await ordersApi.markPaymentSubmitted(orderId, {
                paymentMethod,
                reference: paymentReference,
            });
            setPaymentSubmitted(true);
            setStep('confirmation');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit payment');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Generate UPI deep link
    const upiDeepLink = `upi://pay?pa=${PAYMENT_INFO.upiId}&pn=Jalaram%20Traders&am=${cart?.estimatedTotal || 0}&cu=INR`;

    if (cartLoading && !cart) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-green-600" size={40} />
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="px-4 py-8 text-center">
                <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6">Add some products to proceed with checkout</p>
                <Link to={`${basePath}/products`}>
                    <Button>Browse Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <button
                onClick={() => step === 'address' ? navigate(`${basePath}/cart`) : setStep('address')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} />
                <span>{step === 'address' ? 'Back to Cart' : 'Back to Address'}</span>
            </button>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {['address', 'payment', 'confirmation'].map((s, idx) => (
                    <div key={s} className="flex items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                ? 'bg-green-600 text-white'
                                : ['address', 'payment', 'confirmation'].indexOf(step) > idx
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            {idx + 1}
                        </div>
                        {idx < 2 && (
                            <div
                                className={`w-16 h-1 mx-2 ${['address', 'payment', 'confirmation'].indexOf(step) > idx
                                    ? 'bg-green-600'
                                    : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {step === 'address' && (
                        <Card>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Shipping Address
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    name="name"
                                    value={shippingAddress.name}
                                    onChange={handleAddressChange}
                                    required
                                />
                                <Input
                                    label="Phone Number"
                                    name="phone"
                                    value={shippingAddress.phone}
                                    onChange={handleAddressChange}
                                    placeholder="10-digit mobile number"
                                    required
                                />
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Street Address"
                                        name="street"
                                        value={shippingAddress.street}
                                        onChange={handleAddressChange}
                                        placeholder="House/Building, Street, Area"
                                        required
                                    />
                                </div>
                                <Input
                                    label="City"
                                    name="city"
                                    value={shippingAddress.city}
                                    onChange={handleAddressChange}
                                    required
                                />
                                <Input
                                    label="District"
                                    name="district"
                                    value={shippingAddress.district}
                                    onChange={handleAddressChange}
                                    placeholder="Enter district"
                                    required
                                />
                                <Input
                                    label="State"
                                    name="state"
                                    value={shippingAddress.state}
                                    onChange={handleAddressChange}
                                    placeholder="Enter state"
                                    required
                                />
                                <Input
                                    label="Pincode"
                                    name="pincode"
                                    value={shippingAddress.pincode}
                                    onChange={handleAddressChange}
                                    placeholder="6-digit pincode"
                                    required
                                />
                            </div>

                            {/* Save Address Checkbox */}
                            <div className="mt-4 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="saveAddress"
                                    checked={saveAddress}
                                    onChange={(e) => setSaveAddress(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="saveAddress" className="text-sm text-gray-600">
                                    Save this address to my profile for future orders
                                </label>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mt-8">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                    Select Payment Method
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('upi')}
                                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'upi'
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <QrCode
                                            size={32}
                                            className={paymentMethod === 'upi' ? 'text-green-600' : 'text-gray-400'}
                                        />
                                        <span className={paymentMethod === 'upi' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                            UPI Payment
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'bank_transfer'
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Building2
                                            size={32}
                                            className={paymentMethod === 'bank_transfer' ? 'text-green-600' : 'text-gray-400'}
                                        />
                                        <span className={paymentMethod === 'bank_transfer' ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                            Bank Transfer
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <Button
                                fullWidth
                                size="lg"
                                className="mt-8"
                                onClick={handleCreateOrder}
                                isLoading={loading}
                            >
                                Proceed to Payment
                            </Button>
                        </Card>
                    )}

                    {step === 'payment' && (
                        <Card>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <CreditCard size={24} />
                                Complete Payment
                            </h2>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800 text-sm">
                                    Please transfer <strong>₹{cart.estimatedTotal.toFixed(2)}</strong> using the details below.
                                    After payment, enter your transaction reference and click "I've Made the Payment".
                                </p>
                            </div>

                            {paymentMethod === 'upi' ? (
                                <div className="text-center">
                                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl mb-4">
                                        {/* QR Code placeholder - in production use a QR library */}
                                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                                            <div className="text-center">
                                                <QrCode size={64} className="text-gray-400 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500">Scan to Pay</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="text-gray-600">UPI ID:</span>
                                        <code className="bg-gray-100 px-3 py-1 rounded font-mono">
                                            {PAYMENT_INFO.upiId}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(PAYMENT_INFO.upiId, 'upi')}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            {copiedField === 'upi' ? (
                                                <Check size={16} className="text-green-600" />
                                            ) : (
                                                <Copy size={16} className="text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    <a
                                        href={upiDeepLink}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <QrCode size={20} />
                                        Open UPI App
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                        <Building2 size={20} />
                                        Bank Account Details
                                    </h3>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        {[
                                            { label: 'Account Holder', value: PAYMENT_INFO.accountHolderName, field: 'holder' },
                                            { label: 'Account Number', value: PAYMENT_INFO.accountNumber, field: 'account' },
                                            { label: 'IFSC Code', value: PAYMENT_INFO.ifscCode, field: 'ifsc' },
                                            { label: 'Bank Name', value: PAYMENT_INFO.bankName, field: 'bank' },
                                        ].map(({ label, value, field }) => (
                                            <div key={field} className="flex items-center justify-between">
                                                <span className="text-gray-600">{label}:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{value}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(value, field)}
                                                        className="p-1 hover:bg-gray-200 rounded"
                                                    >
                                                        {copiedField === field ? (
                                                            <Check size={16} className="text-green-600" />
                                                        ) : (
                                                            <Copy size={16} className="text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <Input
                                    label="Transaction Reference / UTR Number (Optional)"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="Enter your payment reference number"
                                />

                                <Button
                                    fullWidth
                                    size="lg"
                                    className="mt-6"
                                    onClick={handlePaymentSubmit}
                                    isLoading={loading}
                                >
                                    I've Made the Payment
                                </Button>
                            </div>
                        </Card>
                    )}

                    {step === 'confirmation' && (
                        <Card className="text-center py-8">
                            <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Order Placed Successfully!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Your payment is being verified. We'll confirm your order shortly.
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 inline-block">
                                <p className="text-green-800 text-sm">
                                    Order ID: <strong>{orderId?.slice(-8).toUpperCase()}</strong>
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to={`${basePath}/orders`}>
                                    <Button variant="outline">View My Orders</Button>
                                </Link>
                                <Link to={`${basePath}/products`}>
                                    <Button>Continue Shopping</Button>
                                </Link>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

                        {/* Items */}
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                            {cart.items.map((item) => (
                                <div key={item._id} className="flex justify-between text-sm">
                                    <div>
                                        <p className="font-medium text-gray-900 line-clamp-1">
                                            {item.product.name}
                                        </p>
                                        <p className="text-gray-500">
                                            {item.quantity} × ₹{item.appliedPrice}
                                        </p>
                                    </div>
                                    <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{cart.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">GST</span>
                                <span>₹{cart.estimatedGst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span className="text-green-600">₹{cart.estimatedTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
