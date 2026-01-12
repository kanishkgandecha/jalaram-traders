
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Truck, TrendingUp, Users, MapPin, Phone, Mail, ArrowRight, Sprout, Package } from 'lucide-react';
import { Button } from '../../shared/ui/Button';

const features = [
    {
        icon: <Package size={28} />,
        title: 'Quality Products',
        description: 'Premium seeds, fertilizers, and pesticides from trusted brands',
    },
    {
        icon: <TrendingUp size={28} />,
        title: 'Bulk Pricing',
        description: 'Special wholesale rates for retailers with volume discounts',
    },
    {
        icon: <Truck size={28} />,
        title: 'Fast Delivery',
        description: 'Quick and reliable delivery across Yavatmal and nearby districts',
    },
    {
        icon: <ShieldCheck size={28} />,
        title: 'Trusted Quality',
        description: 'Guaranteed genuine products with proper certifications',
    },
];

const categories = [
    { name: 'Seeds', emoji: '🌱', description: 'High-yield crop seeds' },
    { name: 'Fertilizers', emoji: '🧪', description: 'Organic & chemical fertilizers' },
    { name: 'Pesticides', emoji: '🛡️', description: 'Crop protection solutions' },

];

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                                <img
                                    src="/logo-white.png"
                                    alt="Logo"
                                    className="w-6 h-6"
                                />

                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Jalaram Traders</h1>
                                <p className="text-xs text-gray-500">Seeds • Fertilizers • Pesticides</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <a href="#about" className="text-gray-600 hover:text-green-600">About</a>
                            <a href="#products" className="text-gray-600 hover:text-green-600">Products</a>
                            <a href="#contact" className="text-gray-600 hover:text-green-600">Contact</a>
                        </nav>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-3">
                            <Link to="/login">
                                <Button variant="ghost" size="sm">Login</Button>
                            </Link>
                            <Link to="/register">
                                <Button size="sm">Register</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                <Sprout size={18} />
                                Trusted by 500+ Retailers
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
                                Your Partner in
                                <span className="text-green-600"> Agricultural Growth</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8">
                                Jalaram Traders is Yavatmal's trusted wholesaler of premium agricultural products.
                                We provide quality seeds, fertilizers, and pesticides to retailers across Maharashtra
                                at competitive wholesale prices.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/login">
                                    <Button size="lg" rightIcon={<ArrowRight size={20} />}>
                                        Login to Order
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="outline" size="lg">
                                        Register as Retailer
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-4 p-8">
                                    {categories.map((cat) => (
                                        <div key={cat.name} className="bg-white rounded-2xl p-6 shadow-lg text-center">
                                            <span className="text-4xl">{cat.emoji}</span>
                                            <h3 className="font-semibold text-gray-900 mt-3">{cat.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-16 sm:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Choose Jalaram Traders?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            We've been serving agricultural retailers in Yavatmal and surrounding districts
                            with quality products and reliable service for years.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <div key={idx} className="bg-green-50 rounded-2xl p-6 text-center hover:bg-green-100 transition-colors">
                                <div className="w-14 h-14 bg-green-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="py-16 sm:py-24 bg-green-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Our Product Categories
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            We stock a wide range of agricultural products from leading brands
                            to meet all your farming needs.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                            <span className="text-5xl">🌱</span>
                            <h3 className="font-bold text-xl text-gray-900 mt-4 mb-2">Seeds</h3>
                            <p className="text-gray-600 text-sm">Cotton, Soybean, Wheat, Vegetables & more</p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                            <span className="text-5xl">🧪</span>
                            <h3 className="font-bold text-xl text-gray-900 mt-4 mb-2">Fertilizers</h3>
                            <p className="text-gray-600 text-sm">NPK, Urea, DAP, Organic fertilizers</p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                            <span className="text-5xl">🛡️</span>
                            <h3 className="font-bold text-xl text-gray-900 mt-4 mb-2">Pesticides</h3>
                            <p className="text-gray-600 text-sm">Insecticides, Fungicides, Herbicides</p>
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <Link to="/login">
                            <Button size="lg">
                                Login to View Full Catalog
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-24 bg-gradient-to-br from-green-600 to-green-700 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Users className="mx-auto mb-6" size={48} />
                    <h2 className="text-3xl font-bold mb-4">
                        Join 500+ Retailers Across Maharashtra
                    </h2>
                    <p className="text-green-100 text-lg mb-8">
                        Register today and start ordering quality agricultural products at wholesale prices.
                        Get access to bulk discounts, easy ordering, and fast delivery.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register">
                            <Button variant="secondary" size="lg">
                                Register as Retailer
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                                Already Registered? Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-16 sm:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
                        <p className="text-gray-600">
                            Visit our store or get in touch for bulk orders and inquiries
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <MapPin size={24} />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                            <p className="text-gray-600 text-sm">
                                Yavatmal, Maharashtra<br />India - 445001
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Phone size={24} />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                            <p className="text-gray-600 text-sm">
                                +91 XXXXX XXXXX<br />Mon-Sat, 9AM-7PM
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Mail size={24} />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                            <p className="text-gray-600 text-sm">
                                info@jalaramtraders.com
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                                <Leaf className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Jalaram Traders</h3>
                                <p className="text-sm">Seeds • Fertilizers • Pesticides</p>
                            </div>
                        </div>
                        <p className="text-sm">
                            © 2026 Jalaram Traders, Yavatmal. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
