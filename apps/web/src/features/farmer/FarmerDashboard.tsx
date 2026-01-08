/**
 * Farmer Dashboard
 * ==================
 * Future-ready dashboard for farmers
 */

import { Link } from 'react-router-dom';
import { Leaf, Package, Clock, ArrowRight } from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/authstore';

export function FarmerDashboard() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <Leaf size={20} />
                    <span className="text-green-200 text-sm">Jalaram Traders</span>
                </div>
                <h1 className="text-2xl font-bold mb-1">
                    Namaste, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-green-100">
                    Welcome to Jalaram Traders. Explore our products.
                </p>
            </div>

            {/* Coming Soon Notice */}
            <Card className="border-2 border-dashed border-green-300 bg-green-50">
                <div className="text-center py-6">
                    <Clock className="mx-auto text-green-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Farmer Portal Coming Soon!
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        We're working on a special experience for farmers with small quantity
                        purchases, agricultural tips, and direct support. Stay tuned!
                    </p>
                </div>
            </Card>

            {/* Available Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What you can do now</h2>
                <div className="grid gap-4">
                    <Link to="/dashboard/farmer/products">
                        <Card hover className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <Package size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Browse Products</h3>
                                <p className="text-sm text-gray-500">
                                    View our catalog of seeds, fertilizers, and more
                                </p>
                            </div>
                            <ArrowRight className="text-gray-400" size={20} />
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Contact */}
            <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
                <p className="text-gray-600 text-sm mb-4">
                    For bulk purchases or special requirements, please contact us directly.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                        Call Us
                    </Button>
                    <Button variant="outline" size="sm">
                        WhatsApp
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default FarmerDashboard;
