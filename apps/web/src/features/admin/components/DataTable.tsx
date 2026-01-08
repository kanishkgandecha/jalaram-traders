/**
 * Data Table Component
 * =====================
 * Reusable table with sorting and pagination
 */

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField?: string;
    loading?: boolean;
    emptyMessage?: string;
    pagination?: {
        page: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    keyField = '_id',
    loading = false,
    emptyMessage = 'No data found',
    pagination,
    onSort,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (!onSort) return;

        const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortKey(key);
        setSortDirection(newDirection);
        onSort(key, newDirection);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={clsx(
                                        'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                                        col.sortable && 'cursor-pointer hover:bg-gray-100',
                                        col.width
                                    )}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sortKey === col.key && (
                                            sortDirection === 'asc'
                                                ? <ChevronUp size={14} />
                                                : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={item[keyField]}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                                            {col.render ? col.render(item) : item[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
