/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../layout/ElevatedPanel';
import { adminService, User } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { Button } from '../common/Button';
import { Users, Edit2, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';

// Helper type for the form state (excluding ID and creating a clean structure)
type UserFormState = Omit<User, 'id' | 'user_code'> & { password?: string };

export default function AdminUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();
    const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'delete'; userId: number } | null>(null);

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
            setUsers(users.map((u: User) => u.id === id ? { ...u, is_active: true } : u));
            toast.success('User activated successfully');
        } catch (err) {
            toast.error('Failed to activate user');
        }
    };

    const handleDeactivate = async (id: number) => {
        try {
            await adminService.deactivateUser(id);
            setUsers(users.map((u: User) => u.id === id ? { ...u, is_active: false } : u));
            toast.success('User deactivated');
        } catch (err) {
            toast.error('Failed to deactivate user');
        } finally {
            setConfirmAction(null);
        }
    };

    const handleDeleteUser = async (id: number) => {
        try {
            await adminService.deleteUser(id);
            setUsers(users.filter((u: User) => u.id !== id));
            toast.success('User deleted permanently');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete user');
        } finally {
            setConfirmAction(null);
        }
    };

    // Updated to use User['role'] instead of string
    const handleUpdateRole = async (id: number, newRole: User['role']) => {
        try {
            await adminService.updateUserRole(id, newRole);
            setUsers(users.map((u: User) => u.id === id ? { ...u, role: newRole } : u));
            toast.success('Role updated');
        } catch (err) {
            toast.error('Failed to update role');
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
            setIsSaving(true);
            await adminService.updateUser(editingUser.id, editingUser);
            setUsers(users.map((u: User) => u.id === editingUser.id ? editingUser : u));
            setEditingUser(null);
            setIsFormOpen(false);
            toast.success('User updated successfully');
        } catch (err) {
            toast.error('Failed to update user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
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
            toast.success('User created successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <ElevatedPanel>
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="animate-spin text-lime-400 mr-3" />
                <span className="text-secondary">Loading user data...</span>
            </div>
        </ElevatedPanel>
    );

    const filteredUsers = showPendingOnly
        ? users.filter((u: User) => !u.is_active)
        : users;

    const pendingCount = users.filter((u: User) => !u.is_active).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
                        <Users size={24} className="text-blue-400" />
                        <span>User Management</span>
                    </h3>
                    <p className="text-secondary text-sm">Manage users, roles, and permissions</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => setShowPendingOnly(!showPendingOnly)}
                        className={`px-4 py-2 font-bold rounded-lg transition-all text-sm flex items-center gap-2 border ${showPendingOnly
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                            : 'bg-white/5 text-secondary border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {showPendingOnly ? (
                            <>
                                <Users size={16} />
                                <span>Show All Users</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={16} className={pendingCount > 0 ? "text-yellow-400" : ""} />
                                <span>Pending ({pendingCount})</span>
                            </>
                        )}
                    </button>
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        icon={<Plus size={16} />}
                    >
                        Add User
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <ElevatedPanel className="p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[1000px] border-collapse">
                        <thead>
                            <tr className="border-b border-light/20 bg-light/5">
                                <th className="p-4 text-left font-semibold text-content-primary text-sm whitespace-nowrap">User Details</th>
                                <th className="p-4 text-left font-semibold text-content-primary text-sm whitespace-nowrap">Contact Info</th>
                                <th className="p-4 text-left font-semibold text-content-primary text-sm whitespace-nowrap">Role</th>
                                <th className="p-4 text-left font-semibold text-content-primary text-sm whitespace-nowrap">Organization</th>
                                <th className="p-4 text-center font-semibold text-content-primary text-sm whitespace-nowrap">Status</th>
                                <th className="p-4 text-right font-semibold text-content-primary text-sm whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-secondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-4 text-secondary">
                                                <Users size={48} />
                                            </div>
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
                                                <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-green-600 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-content-primary text-base">{user.name}</div>
                                                    <div className="text-xs text-secondary font-mono">ID: #{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-content-primary text-sm font-medium">{user.email}</div>
                                                {user.user_code && (
                                                    <div className="text-xs text-secondary font-mono bg-white/5 px-2 py-0.5 rounded w-fit">
                                                        {user.user_code}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-content-primary focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all cursor-pointer hover:bg-black/60"
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
                                            <div className="text-content-primary text-sm font-medium">
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
                                                    className="p-2 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {!user.is_active ? (
                                                    <button
                                                        onClick={() => handleActivate(user.id)}
                                                        className="p-2 text-green-400 hover:text-white hover:bg-green-500/20 rounded-lg transition-colors"
                                                        title="Activate User"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'deactivate', userId: user.id })}
                                                        className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors"
                                                        title="Deactivate User"
                                                    >
                                                        <AlertCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'delete', userId: user.id })}
                                                    className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </ElevatedPanel>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <ElevatedPanel className="w-full max-w-lg">
                        <h3 className="text-2xl font-bold text-content-primary mb-6">
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h3>
                        <form onSubmit={editingUser ? handleUpdateUser : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-secondary mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
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
                                    className="input-field"
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
                                    className="input-field"
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
                                    className="input-field"
                                    value={editingUser ? editingUser.org_name : newUser.org_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => editingUser ? setEditingUser({ ...editingUser, org_name: e.target.value }) : setNewUser({ ...newUser, org_name: e.target.value })}
                                    placeholder="Acme Corporation"
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Role</label>
                                <select
                                    className="input-field"
                                    value={editingUser ? editingUser.role : newUser.role}
                                    // Type Assertion here fixes the error
                                    onChange={e => {
                                        const r = e.target.value as User['role'];
                                        editingUser ? setEditingUser({ ...editingUser, role: r }) : setNewUser({ ...newUser, role: r });
                                    }}
                                >
                                    <option value="corporate">Corporate</option>
                                    <option value="bank">Bank</option>
                                    <option value="auditor">Auditor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="secondary"
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
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={isSaving}
                                >
                                    {editingUser ? 'Update User' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </ElevatedPanel>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmAction !== null}
                title={confirmAction?.type === 'delete' ? 'Delete User' : 'Deactivate User'}
                message={confirmAction?.type === 'delete'
                    ? 'Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.'
                    : 'Are you sure you want to deactivate this user?'}
                confirmText={confirmAction?.type === 'delete' ? 'Delete' : 'Deactivate'}
                isDestructive={true}
                onConfirm={() => {
                    if (!confirmAction) return;
                    if (confirmAction.type === 'delete') handleDeleteUser(confirmAction.userId);
                    else handleDeactivate(confirmAction.userId);
                }}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
}
