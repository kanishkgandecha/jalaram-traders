/**
 * Desktop Sidebar
 * ================
 * Collapsible sidebar navigation for desktop dashboards
 * Updated with order management for admin/employee
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Package,
    ShoppingCart,
    ClipboardList,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Boxes,
    CreditCard,
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { useAuthStore } from '../../features/auth/authstore';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const userRole = user?.role || 'retailer';
    const basePath = `/dashboard/${userRole}`;

    const mainNavItems = [
        { to: basePath, icon: <Home size={20} />, label: 'Dashboard', end: true },
        { to: `${basePath}/products`, icon: <Package size={20} />, label: 'Products' },
    ];

    // Add cart for retailers and farmers only
    if (['retailer', 'farmer'].includes(userRole)) {
        mainNavItems.push({ to: `${basePath}/cart`, icon: <ShoppingCart size={20} />, label: 'Cart' });
    }

    mainNavItems.push({ to: `${basePath}/orders`, icon: <ClipboardList size={20} />, label: 'Orders' });

    // Admin-specific section items
    const adminNavItems = [
        { to: '/dashboard/admin/inventory', icon: <Boxes size={20} />, label: 'Inventory', roles: ['admin'] },
        { to: '/dashboard/employee/stock', icon: <Boxes size={20} />, label: 'Stock', roles: ['employee'] },
        { to: '/dashboard/admin/users', icon: <Users size={20} />, label: 'Users', roles: ['admin'] },
        { to: '/dashboard/admin/reports', icon: <BarChart3 size={20} />, label: 'Reports', roles: ['admin', 'employee'] },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const renderNavItem = (item: any) => {
        if (item.roles && !item.roles.includes(userRole)) {
            return null;
        }

        return (
            <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                    clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive
                            ? 'bg-green-100 text-green-700 font-medium'
                            : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    )
                }
            >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
            </NavLink>
        );
    };

    return (
        <aside
            className={clsx(
                'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                        <img
                            src="/logo-white.png"
                            alt="Logo"
                            className="w-6 h-6"
                        />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="font-bold text-gray-900">Jalaram Traders</h1>
                            <p className="text-xs text-gray-500">Yavatmal</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {/* Main Navigation */}
                <div className="space-y-1">
                    {mainNavItems.map(renderNavItem)}
                </div>

                {/* Admin/Employee Section */}
                {['admin', 'employee'].includes(userRole) && (
                    <>
                        <div className="pt-4 mt-4 border-t border-gray-100">
                            {!collapsed && (
                                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
                                    Management
                                </p>
                            )}
                            <div className="space-y-1">
                                {adminNavItems.map(renderNavItem)}
                            </div>
                        </div>
                    </>
                )}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-gray-100 p-3 space-y-1">
                <NavLink
                    to={`${basePath}/profile`}
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                >
                    <Settings size={20} />
                    {!collapsed && <span>Profile</span>}
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
