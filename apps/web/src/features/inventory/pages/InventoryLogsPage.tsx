/**
 * Inventory Logs Page
 * =====================
 * View inventory movement history with filters
 * Admin only
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Filter,
    Calendar,
    RefreshCw,
    Package,
    Plus,
    Minus,
    RotateCcw,
    AlertTriangle,
    ArrowUpDown,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { Input } from '../../../shared/ui/Input';
import { Badge } from '../../../shared/ui/Badge';
import inventoryApi from '../inventory.api';
import type { InventoryLog, InventoryActionType, InventoryLogsQuery } from '../inventory.types';

const actionTypeOptions = [
    { value: '', label: 'All Actions' },
    { value: 'ADD', label: 'Stock Added' },
    { value: 'ADJUST', label: 'Stock Adjusted' },
    { value: 'RESERVE', label: 'Stock Reserved' },
    { value: 'RELEASE', label: 'Stock Released' },
    { value: 'DEDUCT', label: 'Stock Deducted' },
    { value: 'DAMAGED', label: 'Marked Damaged' },
];

const getActionIcon = (action: InventoryActionType) => {
    switch (action) {
        case 'ADD':
            return <Plus size={14} className="text-green-600" />;
        case 'ADJUST':
            return <ArrowUpDown size={14} className="text-blue-600" />;
        case 'RESERVE':
            return <Package size={14} className="text-purple-600" />;
        case 'RELEASE':
            return <RotateCcw size={14} className="text-indigo-600" />;
        case 'DEDUCT':
            return <Minus size={14} className="text-orange-600" />;
        case 'DAMAGED':
            return <AlertTriangle size={14} className="text-red-600" />;
        default:
            return <Package size={14} className="text-gray-600" />;
    }
};

const getActionBadge = (action: InventoryActionType) => {
    const variants: Record<InventoryActionType, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
        ADD: 'success',
        ADJUST: 'info',
        RESERVE: 'default',
        RELEASE: 'info',
        DEDUCT: 'warning',
        DAMAGED: 'danger',
    };

    return (
        <Badge variant={variants[action] || 'default'} className="gap-1">
            {getActionIcon(action)}
            {action}
        </Badge>
    );
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function InventoryLogsPage() {
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    });
    const [filters, setFilters] = useState<InventoryLogsQuery>({
        page: 1,
        limit: 20,
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.getAllLogs(filters);
            setLogs(response.data.logs);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value || undefined,
            page: 1, // Reset to page 1 on filter change
        }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const clearFilters = () => {
        setFilters({ page: 1, limit: 20 });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/dashboard/admin/inventory"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Logs</h1>
                        <p className="text-gray-600">View all inventory movement history</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} className="mr-2" />
                        Filters
                    </Button>
                    <Button variant="outline" onClick={fetchLogs}>
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Filter size={18} />
                            Filter Logs
                        </h3>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-green-600 hover:text-green-700"
                        >
                            Clear all
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select
                            label="Action Type"
                            name="actionType"
                            value={filters.actionType || ''}
                            onChange={handleFilterChange}
                            options={actionTypeOptions}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Start Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate || ''}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                End Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate || ''}
                                    onChange={handleFilterChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Logs Table */}
            <Card padding="none">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-gray-500">Loading logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-500 font-medium">No logs found</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Inventory movements will appear here
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                            Date & Time
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                            Product
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                            Action
                                        </th>
                                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">
                                            Quantity
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                            Stock Change
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                            Performed By
                                        </th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                            Reason
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {log.product?.name || 'Unknown Product'}
                                                </div>
                                                {log.product?.category && (
                                                    <div className="text-xs text-gray-500 capitalize">
                                                        {log.product.category}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getActionBadge(log.actionType)}
                                            </td>
                                            <td className="text-center px-4 py-3">
                                                <span
                                                    className={`font-semibold ${log.quantity > 0
                                                            ? 'text-green-600'
                                                            : log.quantity < 0
                                                                ? 'text-red-600'
                                                                : 'text-gray-600'
                                                        }`}
                                                >
                                                    {log.quantity > 0 ? '+' : ''}
                                                    {log.quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-gray-500">
                                                    {log.previousStockTotal} → {log.newStockTotal}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Available: {log.previousStockAvailable ?? log.previousStockTotal - log.previousStockReserved} → {log.newStockAvailable ?? log.newStockTotal - log.newStockReserved}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {log.performedBy?.name || 'System'}
                                                </div>
                                                {log.performedBy?.role && (
                                                    <div className="text-xs text-gray-500 capitalize">
                                                        {log.performedBy.role}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-600 max-w-48 truncate" title={log.reason || log.notes}>
                                                    {log.reason || log.notes || log.actionDescription || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                                <div className="text-sm text-gray-600">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    {pagination.total} results
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="px-3 py-1.5 text-sm text-gray-700">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}

export default InventoryLogsPage;
