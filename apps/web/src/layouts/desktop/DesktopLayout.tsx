
import { Outlet } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../features/auth/authstore';

export function DesktopLayout() {
    const { user } = useAuthStore();

    return (
        <div className="min-h-screen bg-green-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="ml-64 min-h-screen">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 h-16">
                        {/* Search */}
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    placeholder="Search products, orders..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 ml-4">
                            <button className="p-2.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors relative">
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            </button>

                            {/* User Menu */}
                            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                </div>
                                <button className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                    <User size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DesktopLayout;
