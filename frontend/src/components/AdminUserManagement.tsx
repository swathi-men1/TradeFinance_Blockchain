
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { User, UserCreate, userService } from '../services/userService';

export default function AdminUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<UserCreate> & { id?: number }>({
        name: '',
        email: '',
        password: '',
        role: 'corporate',
        org_name: ''
    });

    useEffect(() => {
        loadUsers();
        loadPendingUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingUsers = async () => {
        try {
            const data = await userService.getPendingUsers();
            setPendingUsers(data);
        } catch (err) {
            console.error('Failed to load pending users:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await userService.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            setPendingUsers(pendingUsers.filter(u => u.id !== id));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const approvedUser = await userService.approveUser(id);
            setUsers([...users, approvedUser]);
            setPendingUsers(pendingUsers.filter(u => u.id !== id));
            alert('User approved successfully!');
        } catch (err) {
            alert('Failed to approve user');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Are you sure you want to reject this user registration? This will permanently delete the user.')) return;
        try {
            await userService.rejectUser(id);
            setPendingUsers(pendingUsers.filter(u => u.id !== id));
            alert('User registration rejected and deleted.');
        } catch (err) {
            alert('Failed to reject user');
        }
    };

    const handleEdit = (user: User) => {
        setCurrentUser({ ...user, password: '' });
        setEditMode(true);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setCurrentUser({
            name: '',
            email: '',
            password: '',
            role: 'corporate',
            org_name: ''
        });
        setEditMode(false);
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && currentUser.id) {
                const updated = await userService.updateUser(currentUser.id, currentUser);
                setUsers(users.map(u => u.id === updated.id ? updated : u));
            } else {
                if (!currentUser.password) {
                    alert('Password is required for new users');
                    return;
                }
                const created = await userService.createUser(currentUser as UserCreate);
                setUsers([...users, created]);
            }
            setIsFormOpen(false);
        } catch (err) {
            alert('Failed to save user');
            console.error(err);
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">User Management</h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPendingOnly(!showPendingOnly)}
                        className={`px-4 py-2 font-bold rounded-lg transition-all ${
                            showPendingOnly 
                                ? 'bg-warning text-primary' 
                                : 'bg-lime text-primary hover:bg-opacity-90'
                        }`}
                    >
                        {showPendingOnly ? 'Show All Users' : `Pending Approvals (${pendingUsers.length})`}
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-lime text-primary font-bold rounded-lg hover:bg-opacity-90 transition-all"
                    >
                        + Add User
                    </button>
                </div>
            </div>

            {pendingUsers.length > 0 && !showPendingOnly && (
                <div className="mb-6 p-4 bg-warning bg-opacity-20 border border-warning border-opacity-30 rounded-lg">
                    <p className="text-warning font-semibold">
                        ⚠️ You have {pendingUsers.length} pending user registration{pendingUsers.length > 1 ? 's' : ''} waiting for approval.
                    </p>
                </div>
            )}

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-light/20 text-secondary">
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Organization</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showPendingOnly ? pendingUsers : users).map(user => (
                                <tr key={user.id} className="border-b border-light/10 hover:bg-light/5">
                                    <td className="p-3 font-semibold text-white">{user.name}</td>
                                    <td className="p-3 text-secondary">{user.email}</td>
                                    <td className="p-3">
                                        <span className={`role-badge role-${user.role} text-xs uppercase px-2 py-1 rounded`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-secondary">{user.org_name}</td>
                                    <td className="p-3">
                                        <span className={`text-xs uppercase px-2 py-1 rounded ${
                                            user.is_active 
                                                ? 'bg-success bg-opacity-20 text-success' 
                                                : 'bg-warning bg-opacity-20 text-warning'
                                        }`}>
                                            {user.is_active ? 'Active' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {!user.is_active ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(user.id)}
                                                    className="text-green-400 hover:text-green-300 mr-3"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user.id)}
                                                    className="text-red-400 hover:text-red-300 mr-3"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-blue-400 hover:text-blue-300 mr-3"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <GlassCard className="w-full max-w-lg">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {editMode ? 'Edit User' : 'Add New User'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-secondary mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={currentUser.name}
                                    onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={currentUser.email}
                                    onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">
                                    Password {editMode && '(Leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={currentUser.password}
                                    onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Role</label>
                                <select
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={currentUser.role}
                                    onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })}
                                >
                                    <option value="corporate">Corporate</option>
                                    <option value="bank">Bank</option>
                                    <option value="auditor">Auditor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-secondary mb-1">Organization</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-primary border border-light/20 rounded p-2 text-white"
                                    value={currentUser.org_name}
                                    onChange={e => setCurrentUser({ ...currentUser, org_name: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-secondary hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-lime text-primary font-bold rounded hover:bg-opacity-90 transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
