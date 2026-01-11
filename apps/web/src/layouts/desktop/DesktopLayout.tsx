
import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Bell, Search, Package, ShoppingCart, FileText, Check, AlertTriangle, CreditCard } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../features/auth/authstore';
import notificationsApi, { type Notification } from '../../features/notifications/notificationsapi';

// API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function DesktopLayout() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Get base path for role-based navigation
    const basePath = `/dashboard/${user?.role || 'retailer'}`;

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingNotifications(true);
            const response = await notificationsApi.getNotifications({ limit: 10 });
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    }, [user]);

    // Fetch notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`${basePath}/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(e as unknown as React.FormEvent);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getProfileImageUrl = () => {
        if (!user?.profileImage) return null;
        if (user.profileImage.startsWith('http')) return user.profileImage;
        return `${API_BASE_URL}${user.profileImage}`;
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
            setShowNotifications(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order':
                return <ShoppingCart size={16} className="text-blue-600" />;
            case 'product':
                return <Package size={16} className="text-orange-600" />;
            case 'payment':
                return <CreditCard size={16} className="text-green-600" />;
            case 'alert':
                return <AlertTriangle size={16} className="text-red-600" />;
            default:
                return <FileText size={16} className="text-gray-600" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-green-50">
            <Sidebar />

            <div className="ml-64 min-h-screen">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 h-16">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search products, orders..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </form>

                        {/* Actions */}
                        <div className="flex items-center gap-3 ml-4">
                            {/* Notifications */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors relative"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                                >
                                                    <Check size={12} />
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                            {loadingNotifications ? (
                                                <div className="p-6 text-center text-gray-500">
                                                    <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2" />
                                                    Loading...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-6 text-center text-gray-500">
                                                    <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification._id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-green-50/50' : ''
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm text-gray-900 ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-1">
                                                                    {formatTime(notification.createdAt)}
                                                                </p>
                                                            </div>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="p-3 bg-gray-50 border-t border-gray-100">
                                            <Link
                                                to={`${basePath}/notifications`}
                                                onClick={() => setShowNotifications(false)}
                                                className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                                            >
                                                View All Notifications
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                </div>
                                <Link to={`${basePath}/profile`}>
                                    {getProfileImageUrl() ? (
                                        <img
                                            src={getProfileImageUrl()!}
                                            alt={user?.name || 'User'}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-green-200 hover:border-green-400 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium hover:bg-green-200 transition-colors">
                                            {getInitials(user?.name)}
                                        </div>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DesktopLayout;
