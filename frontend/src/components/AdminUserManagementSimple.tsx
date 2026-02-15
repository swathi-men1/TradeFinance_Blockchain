import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { adminService, User } from '../services/adminService';

// Helper type for the form state (excluding ID and creating a clean structure)
type UserFormState = Omit<User, 'id' | 'user_code'> & { password?: string };

export default function AdminUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state - typed correctly to avoid "string vs union" errors
    const [newUser, setNewUser] = useState<UserFormState>({
        name: '',
        email: '',
        password: '',
        role: 'corporate',
        org_name: '',
        is_active: true
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            // Ensure data is treated as User[]
            setUsers(data as User[]);
            setError(null);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await adminService.activateUser(id);
            // Optimistic update
            setUsers(users.map((u: User) => u.id === id ? { ...u, is_active: true } : u));
        } catch (err) {
            alert('Failed to activate user');
        }
    };

    const handleDeactivate = async (id: number) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await adminService.deactivateUser(id);
            setUsers(users.map((u: User) => u.id === id ? { ...u, is_active: false } : u));
        } catch (err) {
            alert('Failed to deactivate user');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) return;
        try {
            await adminService.deleteUser(id);
            setUsers(users.filter((u: User) => u.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    // Updated to use User['role'] instead of string
    const handleUpdateRole = async (id: number, newRole: User['role']) => {
        try {
            await adminService.updateUserRole(id, newRole);
            setUsers(users.map((u: User) => u.id === id ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await adminService.updateUser(editingUser.id, editingUser);
            setUsers(users.map((u: User) => u.id === editingUser.id ? editingUser : u));
            setEditingUser(null);
            setIsFormOpen(false);
        } catch (err) {
            alert('Failed to update user');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await adminService.createUser(newUser);
            setUsers([...users, created]);
            setIsFormOpen(false);
            // Reset form
            setNewUser({
                name: '',
                email: '',
                password: '',
                role: 'corporate',
                org_name: '',
                is_active: true
            });
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to create user');
        }
    };

    if (loading) return <GlassCard>Loading user data...</GlassCard>;

    const filteredUsers = showPendingOnly
        ? users.filter((u: User) => !u.is_active)
        : users;

    const pendingCount = users.filter((u: User) => !u.is_active).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">User Management</h3>
                    <p className="text-secondary text-sm">Manage users, roles, and permissions</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => setShowPendingOnly(!showPendingOnly)}
                        className={`px-4 py-2 font-bold rounded-lg transition-all text-sm ${showPendingOnly
                            ? 'bg-warning text-primary'
                            : 'bg-lime text-primary hover:bg-opacity-90'
                            }`}
                    >
                        {showPendingOnly ? 'Show All Users' : `Pending (${pendingCount})`}
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="px-4 py-2 bg-lime text-primary font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="text-base">+</span> Add User
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[1000px] border-collapse">
                        <thead>
                            <tr className="border-b border-light/20 bg-light/5">
                                <th className="p-4 text-left font-semibold text-white text-sm whitespace-nowrap">User Details</th>
                                <th className="p-4 text-left font-semibold text-white text-sm whitespace-nowrap">Contact Info</th>
                                <th className="p-4 text-left font-semibold text-white text-sm whitespace-nowrap">Role</th>
                                <th className="p-4 text-left font-semibold text-white text-sm whitespace-nowrap">Organization</th>
                                <th className="p-4 text-center font-semibold text-white text-sm whitespace-nowrap">Status</th>
                                <th className="p-4 text-right font-semibold text-white text-sm whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-secondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="text-4xl mb-4">👥</div>
                                            <div className="text-lg font-medium mb-2">No users found</div>
                                            <div className="text-sm">
                                                {showPendingOnly ? 'No pending approvals' : 'Start by adding your first user'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-light/10 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-lime to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white text-base">{user.name}</div>
                                                    <div className="text-xs text-secondary font-mono">ID: #{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-white text-sm font-medium">{user.email}</div>
                                                {user.user_code && (
                                                    <div className="text-xs text-secondary font-mono bg-white/5 px-2 py-0.5 rounded w-fit">
                                                        {user.user_code}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium focus:border-lime focus:ring-1 focus:ring-lime transition-all cursor-pointer hover:bg-black/60"
                                                value={user.role}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateRole(user.id, e.target.value as User['role'])}
                                            >
                                                <option value="corporate">Corporate</option>
                                                <option value="bank">Bank</option>
                                                <option value="auditor">Auditor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-white text-sm font-medium">
                                                {user.org_name || <span className="text-secondary italic">No Org</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.is_active
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></span>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    ✏️
                                                </button>
                                                {!user.is_active ? (
                                                    <button
                                                        onClick={() => handleActivate(user.id)}
                                                        className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all text-xs font-bold"
                                                    >
                                                        Activate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeactivate(user.id)}
                                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all text-xs font-bold"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <GlassCard className="w-full max-w-lg">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h3>
                        <form onSubmit={editingUser ? handleUpdateUser : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-secondary mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={editingUser ? editingUser.name : newUser.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => editingUser ? setEditingUser({ ...editingUser, name: e.target.value }) : setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={editingUser ? editingUser.email : newUser.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => editingUser ? setEditingUser({ ...editingUser, email: e.target.value }) : setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Password</label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={editingUser ? editingUser.password || '' : newUser.password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => editingUser ? setEditingUser({ ...editingUser, password: e.target.value }) : setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder={editingUser ? "Leave blank to keep current password" : "•••••••"}
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Organization</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={editingUser ? editingUser.org_name : newUser.org_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => editingUser ? setEditingUser({ ...editingUser, org_name: e.target.value }) : setNewUser({ ...newUser, org_name: e.target.value })}
                                    placeholder="Acme Corporation"
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Role</label>
                                <select
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={editingUser ? editingUser.role : newUser.role}
                                    // Type Assertion here fixes the error
                                    onChange={e => {
                                        const r = e.target.value as User['role'];
                                        editingUser ? setEditingUser({ ...editingUser, role: r }) : setNewUser({ ...newUser, role: r });
                                    }}
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                >
                                    <option value="corporate">Corporate</option>
                                    <option value="bank">Bank</option>
                                    <option value="auditor">Auditor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        setEditingUser(null);
                                        setNewUser({
                                            name: '',
                                            email: '',
                                            password: '',
                                            role: 'corporate',
                                            org_name: '',
                                            is_active: true
                                        });
                                    }}
                                    className="px-4 py-2 text-secondary hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-lime text-primary font-bold rounded hover:bg-opacity-90 transition-all"
                                >
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}