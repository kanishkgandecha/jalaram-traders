/**
 * Admin Reports Page
 * ====================
 * Sales reports with date range selection and export
 */

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Download,
    DollarSign,
    ShoppingCart,
    Package,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import adminApi, { type SalesReport } from '../adminapi';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export function AdminReportsPage() {
    const [report, setReport] = useState<SalesReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [groupBy, setGroupBy] = useState('day');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getSalesReport(startDate, endDate, groupBy);
            setReport(response.data);
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'json' | 'csv') => {
        try {
            const data = await adminApi.exportReport(startDate, endDate, format);

            if (format === 'csv') {
                const blob = new Blob([data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sales-report-${startDate}-${endDate}.csv`;
                a.click();
            } else {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sales-report-${startDate}-${endDate}.json`;
                a.click();
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
                    <p className="text-gray-600">Analyze sales data and export reports</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        leftIcon={<Download size={18} />}
                        onClick={() => handleExport('csv')}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        leftIcon={<Download size={18} />}
                        onClick={() => handleExport('json')}
                    >
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Date Range Selector */}
            <Card padding="sm">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                        </select>
                    </div>
                    <Button onClick={fetchReport} isLoading={loading}>
                        Generate Report
                    </Button>
                </div>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatCurrency(report?.summary.totalRevenue || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {report?.summary.totalOrders || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Items Sold</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {report?.summary.totalItems || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <Package size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Avg Order Value</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {formatCurrency(report?.summary.avgOrderValue || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales Data Table */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Period</h3>
                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-8 bg-gray-200 rounded" />
                            ))}
                        </div>
                    ) : report?.salesData && report.salesData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                                        <th className="pb-3">Date</th>
                                        <th className="pb-3 text-right">Orders</th>
                                        <th className="pb-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {report.salesData.slice(0, 10).map((row) => (
                                        <tr key={row._id}>
                                            <td className="py-2 font-medium text-gray-900">{row._id}</td>
                                            <td className="py-2 text-right text-gray-600">{row.orders}</td>
                                            <td className="py-2 text-right font-medium text-green-600">
                                                {formatCurrency(row.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No sales data for this period</p>
                    )}
                </Card>

                {/* Top Products */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-8 bg-gray-200 rounded" />
                            ))}
                        </div>
                    ) : report?.topProducts && report.topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {report.topProducts.slice(0, 10).map((product, idx) => (
                                <div key={product._id} className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product._id}</p>
                                        <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                                    </div>
                                    <p className="font-medium text-green-600">
                                        {formatCurrency(product.revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No product data</p>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default AdminReportsPage;
