/**
 * Bottom Navigation
 * ==================
 * Touch-friendly bottom navigation for mobile dashboards
 */

import { NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, ClipboardList, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../features/auth/authstore';

export function BottomNav() {
    const { user } = useAuthStore();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;

    const navItems = [
        { to: basePath, icon: <Home size={24} />, label: 'Home' },
        { to: `${basePath}/products`, icon: <Package size={24} />, label: 'Products' },
        { to: `${basePath}/cart`, icon: <ShoppingCart size={24} />, label: 'Cart' },
        { to: `${basePath}/orders`, icon: <ClipboardList size={24} />, label: 'Orders' },
        { to: `${basePath}/profile`, icon: <User size={24} />, label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === basePath}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center justify-center w-full h-full px-2 transition-colors',
                                isActive
                                    ? 'text-green-600'
                                    : 'text-gray-500 hover:text-green-500'
                            )
                        }
                    >
                        {item.icon}
                        <span className="text-xs mt-1 font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
