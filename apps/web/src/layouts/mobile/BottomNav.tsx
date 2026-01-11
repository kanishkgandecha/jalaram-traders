/**
 * Bottom Navigation
 * ==================
 * Touch-friendly bottom navigation for mobile dashboards
 * Role-aware navigation items
 */

import { NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, ClipboardList, User, Boxes } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../features/auth/authstore';
import { useCartStore } from '../../features/cart/cartstore';

export function BottomNav() {
    const { user } = useAuthStore();
    const { cart } = useCartStore();
    const userRole = user?.role || 'retailer';
    const basePath = `/dashboard/${userRole}`;

    // Different nav items based on role
    const getNavItems = () => {
        if (userRole === 'admin') {
            return [
                { to: basePath, icon: <Home size={24} />, label: 'Home', end: true },
                { to: `${basePath}/orders`, icon: <ClipboardList size={24} />, label: 'Orders' },
                { to: `${basePath}/inventory`, icon: <Boxes size={24} />, label: 'Inventory' },
                { to: `${basePath}/products`, icon: <Package size={24} />, label: 'Products' },
                { to: `${basePath}/profile`, icon: <User size={24} />, label: 'Profile' },
            ];
        }

        if (userRole === 'employee') {
            return [
                { to: basePath, icon: <Home size={24} />, label: 'Home', end: true },
                { to: `${basePath}/orders`, icon: <ClipboardList size={24} />, label: 'Orders' },
                { to: `${basePath}/stock`, icon: <Boxes size={24} />, label: 'Stock' },
                { to: `${basePath}/products`, icon: <Package size={24} />, label: 'Products' },
                { to: `${basePath}/profile`, icon: <User size={24} />, label: 'Profile' },
            ];
        }

        // Retailer and Farmer
        return [
            { to: basePath, icon: <Home size={24} />, label: 'Home', end: true },
            { to: `${basePath}/products`, icon: <Package size={24} />, label: 'Products' },
            { to: `${basePath}/cart`, icon: <ShoppingCart size={24} />, label: 'Cart', badge: cart?.items.length || 0 },
            { to: `${basePath}/orders`, icon: <ClipboardList size={24} />, label: 'Orders' },
            { to: `${basePath}/profile`, icon: <User size={24} />, label: 'Profile' },
        ];
    };

    const navItems = getNavItems();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center justify-center w-full h-full px-2 transition-colors relative',
                                isActive
                                    ? 'text-green-600'
                                    : 'text-gray-500 hover:text-green-500'
                            )
                        }
                    >
                        <div className="relative">
                            {item.icon}
                            {'badge' in item && item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-[10px] flex items-center justify-center rounded-full">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </div>
                        <span className="text-xs mt-1 font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
