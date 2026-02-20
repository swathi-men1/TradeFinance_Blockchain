import React, { useState, useEffect, useCallback } from 'react';
import { adminService, User, UserRole } from '../../services/adminService';

/* ─── Toast System ─────────────────────────────────────────── */
type Toast = { id: number; type: 'success' | 'error' | 'info' | 'warn'; msg: string };
let _toastId = 0;

interface EditFormState {
    name: string;
    email: string;
    org_name: string;
    role: UserRole;
    is_active: boolean;
    password: string;
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium backdrop-blur-md animate-fade-in transition-all
                        ${t.type === 'success' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : ''}
                        ${t.type === 'error' ? 'bg-red-100 border-red-300 text-red-800' : ''}
                        ${t.type === 'warn' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : ''}
                        ${t.type === 'info' ? 'bg-blue-100 border-blue-300 text-blue-800' : ''}
                    `}
                >
                    <span>{t.type === 'success' ? '✔' : t.type === 'error' ? '✖' : t.type === 'warn' ? '⚠' : 'ℹ'}</span>
                    <span>{t.msg}</span>
                    <button className="ml-2 opacity-60 hover:opacity-100" onClick={() => remove(t.id)}>✕</button>
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const push = useCallback((type: Toast['type'], msg: string) => {
        const id = ++_toastId;
        setToasts(p => [...p, { id, type, msg }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
    }, []);
    const remove = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
    return { toasts, remove, push };
}

/* ─── Helpers ──────────────────────────────────────────────── */
type UserRole = User['role'];

const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-300',
    bank: 'bg-blue-100 text-blue-700 border-blue-300',
    corporate: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    auditor: 'bg-orange-100 text-orange-700 border-orange-300',
};

function RoleBadge({ role }: { role: UserRole }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${ROLE_COLORS[role] || 'bg-white/10 text-white border-white/20'}`}>
            {role}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 ${active ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
            {active ? 'Active' : 'Disabled'}
        </span>
    );
}

function formatDate(val: string | undefined) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const emptyForm = { name: '', email: '', password: '', org_name: '', role: 'corporate' as UserRole, is_active: true };

/* ─── Main Component ───────────────────────────────────────── */
export default function UserManagementPage() {
    const { toasts, remove, push } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

    // Pagination
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ ...emptyForm });
    const [creating, setCreating] = useState(false);

    const [viewUser, setViewUser] = useState<User | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleTarget, setRoleTarget] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<UserRole>('corporate');
    const [changingRole, setChangingRole] = useState(false);

    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [resetting, setResetting] = useState(false);
    const [tempPassword, setTempPassword] = useState<string | null>(null);

    const [togglingId, setTogglingId] = useState<number | null>(null);

    // Edit User modal
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<EditFormState>({ name: '', email: '', org_name: '', role: 'corporate' as UserRole, is_active: true, password: '' });
    const [editSaving, setEditSaving] = useState(false);

    /* Load */
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getUsers();
            setUsers(data as User[]);
        } catch {
            push('error', 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [push]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    /* Filter + Search */
    const filtered = users.filter(u => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (statusFilter === 'active' && !u.is_active) return false;
        if (statusFilter === 'disabled' && u.is_active) return false;
        if (searchQ) {
            const q = searchQ.toLowerCase();
            return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.org_name?.toLowerCase().includes(q);
        }
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* Create User */
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const created = await adminService.createUser(createForm) as User;
            setUsers(p => [created, ...p]);
            setShowCreate(false);
            setCreateForm({ ...emptyForm });
            push('success', `User "${created.name}" created successfully.`);
        } catch (err: any) {
            push('error', err?.response?.data?.detail || 'Failed to create user.');
        } finally {
            setCreating(false);
        }
    };

    /* Toggle Active */
    const handleToggleActive = async (user: User) => {
        if (togglingId) return;
        setTogglingId(user.id);
        try {
            if (user.is_active) {
                await adminService.deactivateUser(user.id);
                setUsers(p => p.map(u => u.id === user.id ? { ...u, is_active: false } : u));
                push('success', `Deactivated ${user.name}.`);
            } else {
                await adminService.activateUser(user.id);
                setUsers(p => p.map(u => u.id === user.id ? { ...u, is_active: true } : u));
                push('success', `Activated ${user.name}.`);
            }
        } catch (err: any) {
            push('error', err?.response?.data?.detail || 'Toggle failed.');
        } finally {
            setTogglingId(null);
        }
    };

    /* Role Change */
    const openRoleModal = (user: User) => {
        setRoleTarget(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };
    const handleRoleChange = async () => {
        if (!roleTarget) return;
        setChangingRole(true);
        try {
            await adminService.updateUserRole(roleTarget.id, newRole);
            setUsers(p => p.map(u => u.id === roleTarget.id ? { ...u, role: newRole } : u));
            push('success', `Role updated to ${newRole.toUpperCase()} for ${roleTarget.name}.`);
            setShowRoleModal(false);
        } catch (err: any) {
            push('error', err?.response?.data?.detail || 'Role update failed.');
        } finally {
            setChangingRole(false);
        }
    };

    /* Reset Password */
    const handleReset = async () => {
        if (!resetTarget) return;
        setResetting(true);
        try {
            const res = await adminService.resetPassword(resetTarget.id);
            setTempPassword(res.temp_password);
            push('info', `Password reset for ${resetTarget.name}. Share the temp password securely.`);
        } catch (err: any) {
            push('error', err?.response?.data?.detail || 'Password reset failed.');
            setResetTarget(null);
        } finally {
            setResetting(false);
        }
    };

    /* Open Edit modal */
    const openEdit = (u: User) => {
        setEditForm({ name: u.name, email: u.email, org_name: u.org_name || '', role: u.role, is_active: u.is_active, password: '' });
        setEditUser(u);
    };

    /* Save Edits */
    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        setEditSaving(true);
        try {
            const payload: any = {
                name: editForm.name,
                email: editForm.email,
                org_name: editForm.org_name,
                role: editForm.role,
                is_active: editForm.is_active,
            };
            if (editForm.password.trim()) payload.password = editForm.password;
            const updated = await adminService.updateUser(editUser.id, payload) as User;
            setUsers(p => p.map(u => u.id === editUser.id ? { ...u, ...updated } : u));
            push('success', `User "${updated.name}" updated successfully.`);
            setEditUser(null);
        } catch (err: any) {
            push('error', err?.response?.data?.detail || 'Update failed.');
        } finally {
            setEditSaving(false);
        }
    };

    /* Stats */
    const statCounts = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        disabled: users.filter(u => !u.is_active).length,
        highRisk: 0,
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto space-y-6 relative z-10">
                <ToastContainer toasts={toasts} remove={remove} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span>👥</span> User Management
                        </h1>
                        <p className="text-slate-600 text-sm mt-2">Create, manage and monitor platform users</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-sm shadow-md whitespace-nowrap"
                        id="btn-create-user"
                    >
                        <span className="text-base">+</span> Create User
                    </button>
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Users', val: statCounts.total, icon: '👥', color: 'text-slate-900' },
                        { label: 'Active', val: statCounts.active, icon: '✅', color: 'text-emerald-600' },
                        { label: 'Disabled', val: statCounts.disabled, icon: '🔴', color: 'text-red-600' },
                        { label: 'Filtered', val: filtered.length, icon: '🔍', color: 'text-blue-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[20px] p-4 text-center">
                            <div className="text-xl mb-1">{s.icon}</div>
                            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
                            <div className="text-slate-600 text-xs mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="Search by name, email, org…"
                            className="flex-1 min-w-[200px] bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            value={searchQ}
                            onChange={e => { setSearchQ(e.target.value); setPage(1); }}
                        />
                        <select
                            className="bg-slate-100 border-2 border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                            value={roleFilter}
                            onChange={e => { setRoleFilter(e.target.value as any); setPage(1); }}
                        >
                            <option value="all">All Roles</option>
                            <option value="bank">Bank</option>
                            <option value="corporate">Corporate</option>
                            <option value="auditor">Auditor</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            className="bg-slate-100 border-2 border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                        </select>
                        <button
                            onClick={loadUsers}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm rounded-lg border-2 border-slate-300 transition-all font-semibold"
                        >
                            ↺ Refresh
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">User ID</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Name</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Organization</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Role</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Created</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-slate-900 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr><td colSpan={7} className="py-16 text-center text-slate-600 animate-pulse">Loading users…</td></tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center">
                                            <div className="text-3xl mb-3">👤</div>
                                            <div className="text-slate-600">No records available.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(user => (
                                        <tr key={user.id} className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="text-blue-600 font-mono font-bold text-xs">#{user.id}</span>
                                                {user.user_code && (
                                                    <div className="text-slate-600 text-xs font-mono mt-0.5">{user.user_code}</div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-900 font-semibold">{user.name}</div>
                                                        <div className="text-slate-600 text-xs">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-900 text-sm">{user.org_name || <span className="text-slate-400 italic">—</span>}</td>
                                            <td className="py-3 px-4"><RoleBadge role={user.role} /></td>
                                            <td className="py-3 px-4"><StatusBadge active={user.is_active} /></td>
                                            <td className="py-3 px-4 text-slate-600 text-xs font-mono">{formatDate((user as any).created_at)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View */}
                                                    <button
                                                        onClick={() => setViewUser(user)}
                                                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 border-2 border-blue-300 hover:bg-blue-200 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        View
                                                    </button>
                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => openEdit(user)}
                                                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border-2 border-emerald-300 hover:bg-emerald-200 rounded-lg transition-all"
                                                        title="Edit User"
                                                    >
                                                        ✏ Edit
                                                    </button>
                                                    {/* Edit Role */}
                                                    <button
                                                        onClick={() => openRoleModal(user)}
                                                        className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 border-2 border-purple-300 hover:bg-purple-200 rounded-lg transition-all"
                                                        title="Edit Role"
                                                    >
                                                        Role
                                                    </button>
                                                    {/* Activate / Deactivate */}
                                                    <button
                                                        onClick={() => handleToggleActive(user)}
                                                        disabled={togglingId === user.id}
                                                        className={`px-3 py-1.5 text-xs font-bold border-2 rounded-lg transition-all disabled:opacity-50 ${user.is_active
                                                            ? 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200'
                                                            : 'text-emerald-700 bg-emerald-100 border-emerald-300 hover:bg-emerald-200'
                                                            }`}
                                                        title={user.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {togglingId === user.id ? '…' : user.is_active ? 'Disable' : 'Activate'}
                                                    </button>
                                                    {/* Reset Password */}
                                                    <button
                                                        onClick={() => { setResetTarget(user); setTempPassword(null); }}
                                                        className="px-3 py-1.5 text-xs font-bold text-yellow-700 bg-yellow-100 border-2 border-yellow-300 hover:bg-yellow-200 rounded-lg transition-all"
                                                        title="Reset Password"
                                                    >
                                                        Reset PW
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                            <span className="text-slate-600 text-xs">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs bg-slate-200 border-2 border-slate-300 rounded-lg text-slate-900 disabled:opacity-30 hover:bg-slate-300 transition-all font-semibold">← Prev</button>
                                <span className="px-3 py-1.5 text-xs text-slate-900 font-semibold">{page}/{totalPages}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs bg-slate-200 border-2 border-slate-300 rounded-lg text-slate-900 disabled:opacity-30 hover:bg-slate-300 transition-all font-semibold">Next →</button>
                            </div>
                        </div>
                    )}
                </div>

            {/* ── CREATE USER MODAL ─────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">Create New User</h2>
                            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl">✕</button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4 p-6">
                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Full Name *</label>
                                <input required type="text" className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
                            </div>
                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Email *</label>
                                <input required type="email" className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
                            </div>
                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Organization Name *</label>
                                <input required type="text" className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500" value={createForm.org_name} onChange={e => setCreateForm(f => ({ ...f, org_name: e.target.value }))} placeholder="Acme Bank" />
                            </div>
                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Temporary Password *</label>
                                <input required type="password" className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Role</label>
                                    <select
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                                        value={createForm.role}
                                        onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
                                    >
                                        <option value="bank">Bank</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="auditor">Auditor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Status</label>
                                    <select
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                                        value={createForm.is_active ? 'active' : 'disabled'}
                                        onChange={e => setCreateForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
                                    >
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold">Cancel</button>
                                <button type="submit" disabled={creating} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-sm disabled:opacity-60">
                                    {creating ? 'Creating…' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── VIEW DETAILS MODAL ────────────────────────────── */}
            {viewUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] w-full max-w-sm">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">User Details</h2>
                            <button onClick={() => setViewUser(null)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {viewUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-slate-900 font-bold text-lg">{viewUser.name}</div>
                                    <div className="text-slate-600 text-sm">{viewUser.email}</div>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: 'User ID', val: `#${viewUser.id}` },
                                    { label: 'User Code', val: viewUser.user_code || '—' },
                                    { label: 'Organization', val: viewUser.org_name || '—' },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-slate-600 font-medium">{row.label}</span>
                                        <span className="text-slate-900 font-mono text-xs">{row.val}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                    <span className="text-slate-600 font-medium">Role</span>
                                    <RoleBadge role={viewUser.role} />
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-600 font-medium">Status</span>
                                    <StatusBadge active={viewUser.is_active} />
                                </div>
                            </div>
                            <button onClick={() => setViewUser(null)} className="w-full mt-2 px-4 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ROLE CHANGE MODAL ────────────────────────────── */}
            {showRoleModal && roleTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] w-full max-w-sm">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">Edit Role</h2>
                            <button onClick={() => setShowRoleModal(false)} className="text-slate-500 hover:text-slate-900 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="text-slate-700 text-sm">
                                Changing role for <strong className="text-slate-900">{roleTarget.name}</strong>.
                                This action will be logged in the audit trail.
                            </p>
                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">New Role</label>
                                <select
                                    className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value as UserRole)}
                                >
                                    <option value="bank">Bank</option>
                                    <option value="corporate">Corporate</option>
                                    <option value="auditor">Auditor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-xs">
                                ⚠ Role changes are permanent and audited. Current role: <strong>{roleTarget.role.toUpperCase()}</strong>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowRoleModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm">Cancel</button>
                                <button onClick={handleRoleChange} disabled={changingRole || newRole === roleTarget.role} className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all text-sm disabled:opacity-50">
                                    {changingRole ? 'Saving…' : 'Confirm Change'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RESET PASSWORD MODAL ─────────────────────────── */}
            {resetTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] w-full max-w-sm">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
                            <button onClick={() => { setResetTarget(null); setTempPassword(null); }} className="text-slate-500 hover:text-slate-900 text-2xl">✕</button>
                        </div>
                        <div className="p-6">
                            {tempPassword ? (
                                <>
                                    <div className="p-4 bg-green-50 border border-green-300 rounded-lg mb-4">
                                        <p className="text-green-800 text-xs font-bold uppercase tracking-wider mb-2">✔ Temporary Password — Share Securely</p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-slate-100 px-3 py-2 rounded-lg text-emerald-700 font-mono text-sm font-bold tracking-widest border border-slate-300">
                                                {tempPassword}
                                            </code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(tempPassword)}
                                                className="px-3 py-2 bg-slate-100 text-slate-900 text-xs rounded-lg hover:bg-slate-200 transition-all border border-slate-300 font-semibold"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-slate-700 text-xs mb-5">The user's password has been reset. Share this temporary password through a secure channel. This password will not be shown again.</p>
                                    <button onClick={() => { setResetTarget(null); setTempPassword(null); }} className="w-full px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-sm">
                                        Done
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-slate-700 text-sm mb-5">
                                        Reset password for <strong className="text-slate-900">{resetTarget.name}</strong>?
                                        A temporary password will be generated. This action will be logged.
                                    </p>
                                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-xs mb-5 font-semibold">
                                        🔐 The existing password will be invalidated immediately.
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setResetTarget(null)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm">Cancel</button>
                                        <button onClick={handleReset} disabled={resetting} className="flex-1 px-4 py-2.5 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 transition-all text-sm disabled:opacity-50">
                                            {resetting ? 'Resetting…' : 'Reset Password'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* ── EDIT USER MODAL ──────────────────────────────── */}
            {editUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white/80">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
                                <p className="text-slate-600 text-xs mt-0.5">#{editUser.id} · Changes are audited</p>
                            </div>
                            <button onClick={() => setEditUser(null)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl">✕</button>
                        </div>

                        {/* User avatar strip */}
                        <div className="flex items-center gap-3 m-6 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {editUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-slate-900 font-semibold text-sm">{editUser.name}</div>
                                <div className="text-slate-600 text-xs">{editUser.email}</div>
                            </div>
                        </div>

                        <form onSubmit={handleEditSave} className="space-y-4 px-6 pb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Full Name *</label>
                                    <input
                                        required type="text"
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Email *</label>
                                    <input
                                        required type="email"
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        value={editForm.email}
                                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Organization Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    value={editForm.org_name}
                                    onChange={e => setEditForm(f => ({ ...f, org_name: e.target.value }))}
                                    placeholder="Acme Corp"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Role</label>
                                    <select
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                                        value={editForm.role}
                                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                                    >
                                        <option value="bank">Bank</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="auditor">Auditor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">Status</label>
                                    <select
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                                        value={editForm.is_active ? 'active' : 'disabled'}
                                        onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
                                    >
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-900 text-xs font-bold mb-1.5 uppercase tracking-wider">
                                    New Password <span className="normal-case text-slate-500 font-normal">(leave blank to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    value={editForm.password}
                                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-xs font-semibold">
                                ⚠ All edits are permanently recorded in the audit trail under your admin account.
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setEditUser(null)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-sm disabled:opacity-60"
                                >
                                    {editSaving ? 'Saving…' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
