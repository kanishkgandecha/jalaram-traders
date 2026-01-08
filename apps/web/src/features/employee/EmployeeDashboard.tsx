/**
 * Employee Dashboard
 * ===================
 * Task-focused dashboard for employees
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    ClipboardList,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
} from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { useAuthStore } from '../auth/authstore';

export function EmployeeDashboard() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-600">Here's your work summary for today.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
                        </div>
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Low Stock Items</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Needs restock
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <Package size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Completed Today</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} />
                                Orders processed
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link to="/dashboard/employee/stock">
                        <Card hover className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Manage Stock</h3>
                                <p className="text-sm text-gray-500">Update product stock levels</p>
                            </div>
                        </Card>
                    </Link>

                    <Link to="/dashboard/employee/orders">
                        <Card hover className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">View Orders</h3>
                                <p className="text-sm text-gray-500">Process and update orders</p>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Tasks</h3>
                <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>No pending tasks</p>
                    <p className="text-sm">All caught up!</p>
                </div>
            </Card>
        </div>
    );
}

export default EmployeeDashboard;
