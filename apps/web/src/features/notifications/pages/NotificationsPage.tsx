/**
 * Notifications Page
 * ===================
 * Full page view of all user notifications with filtering and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Package,
    ShoppingCart,
    CreditCard,
    AlertTriangle,
    FileText,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../../auth/authstore';
import notificationsApi, { type Notification } from '../notificationsapi';

type FilterType = 'all' | 'unread' | 'order' | 'product' | 'payment' | 'system';

export function NotificationsPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const basePath = `/dashboard/${user?.role || 'retailer'}`;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationsApi.getNotifications({
                page,
                limit: 20,
                unreadOnly: filter === 'unread',
            });
            setNotifications(response.data.notifications);
            setTotalPages(response.data.pagination.totalPages);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
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

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationsApi.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await handleMarkAsRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order':
                return <ShoppingCart size={20} className="text-blue-600" />;
            case 'product':
                return <Package size={20} className="text-orange-600" />;
            case 'payment':
                return <CreditCard size={20} className="text-green-600" />;
            case 'alert':
                return <AlertTriangle size={20} className="text-red-600" />;
            default:
                return <FileText size={20} className="text-gray-600" />;
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
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const filterOptions: { value: FilterType; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'unread', label: 'Unread' },
        { value: 'order', label: 'Orders' },
        { value: 'product', label: 'Products' },
        { value: 'payment', label: 'Payments' },
        { value: 'system', label: 'System' },
    ];

    const filteredNotifications = filter === 'all' || filter === 'unread'
        ? notifications
        : notifications.filter(n => n.type === filter);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell size={28} className="text-green-600" />
                        Notifications
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchNotifications}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2"
                        >
                            <CheckCheck size={16} />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {filterOptions.map(option => (
                    <button
                        key={option.value}
                        onClick={() => { setFilter(option.value); setPage(1); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === option.value
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <Card className="divide-y divide-gray-100">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
                        <p className="text-gray-500">Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                        <p className="text-gray-500">
                            {filter === 'unread' ? 'All notifications have been read' : 'No notifications to show'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-green-50/30' : ''}`}
                        >
                            <div className="flex gap-4">
                                {/* Icon */}
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-gray-900 ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {notification.message}
                                    </p>
                                    {notification.link && (
                                        <p className="text-xs text-green-600 mt-2 hover:underline">
                                            Click to view details →
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {!notification.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification._id)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

export default NotificationsPage;
