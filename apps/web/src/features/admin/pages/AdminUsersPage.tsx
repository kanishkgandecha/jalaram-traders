/**
 * Admin Users Page
 * ==================
 * User management with create, role assignment, and status toggle
 */

import { useState, useEffect } from 'react';
import {
    Search,
    UserPlus,
    X,
    Check,
    Ban,
} from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import DataTable from '../components/DataTable';
import adminApi, { type AdminUser } from '../adminapi';

const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    employee: 'bg-purple-100 text-purple-700',
    retailer: 'bg-blue-100 text-blue-700',
    farmer: 'bg-green-100 text-green-700',
};

export function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'retailer',
        businessName: '',
    });

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getUsers({
                page,
                limit: 15,
                role: roleFilter || undefined,
                search: search || undefined,
            });
            setUsers(response.data);
            setTotalPages(response.meta.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await adminApi.createUser(newUser);
            setShowCreateModal(false);
            setNewUser({ name: '', email: '', phone: '', password: '', role: 'retailer', businessName: '' });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (userId: string) => {
        try {
            await adminApi.toggleUserStatus(userId);
            fetchUsers();
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await adminApi.updateUserRole(userId, newRole);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'User',
            render: (user: AdminUser) => (
                <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
            ),
        },
        {
            key: 'phone',
            header: 'Phone',
        },
        {
            key: 'role',
            header: 'Role',
            render: (user: AdminUser) => (
                <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${roleColors[user.role]}`}
                >
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                    <option value="retailer">Retailer</option>
                    <option value="farmer">Farmer</option>
                </select>
            ),
        },
        {
            key: 'businessName',
            header: 'Business',
            render: (user: AdminUser) => user.businessName || '-',
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (user: AdminUser) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                >
                    {user.isActive ? 'Active' : 'Disabled'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Joined',
            render: (user: AdminUser) =>
                new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (user: AdminUser) => (
                <button
                    onClick={() => handleToggleStatus(user._id)}
                    className={`p-2 rounded-lg transition-colors ${user.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                        }`}
                    title={user.isActive ? 'Disable User' : 'Enable User'}
                >
                    {user.isActive ? <Ban size={18} /> : <Check size={18} />}
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">Manage users, roles, and permissions</p>
                </div>
                <Button
                    leftIcon={<UserPlus size={20} />}
                    onClick={() => setShowCreateModal(true)}
                >
                    Add User
                </Button>
            </div>

            {/* Filters */}
            <Card padding="sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </form>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                        <option value="retailer">Retailer</option>
                        <option value="farmer">Farmer</option>
                    </select>
                </div>
            </Card>

            {/* Users Table */}
            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                emptyMessage="No users found"
                pagination={{
                    page,
                    totalPages,
                    onPageChange: setPage,
                }}
            />

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <Input
                                label="Full Name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                required
                            />
                            <Input
                                label="Phone"
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Role
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="retailer">Retailer</option>
                                    <option value="farmer">Farmer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {newUser.role === 'retailer' && (
                                <Input
                                    label="Business Name"
                                    value={newUser.businessName}
                                    onChange={(e) => setNewUser({ ...newUser, businessName: e.target.value })}
                                />
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" fullWidth isLoading={creating}>
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsersPage;
