/**
 * Mobile Layout
 * ==============
 * Layout wrapper for mobile devices with header and bottom nav
 */

import { Outlet, Link } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';
import BottomNav from './BottomNav';

export function MobileLayout() {
    return (
        <div className="min-h-screen bg-green-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-4 h-14">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <img
                                src="/logo-white.png"
                                alt="Logo"
                                className="w-6 h-6"
                            />
                        </div>
                        <span className="font-semibold text-gray-900">
                            Jalaram
                        </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Bell size={20} />
                        </button>
                        <Link
                            to="/cart"
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors relative"
                        >
                            <ShoppingCart size={20} />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                                0
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 pt-4 pb-24">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

export default MobileLayout;
