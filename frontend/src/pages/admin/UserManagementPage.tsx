import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../components/GlassCard';
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
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-md animate-fade-in transition-all
                        ${t.type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-200' : ''}
                        ${t.type === 'error' ? 'bg-red-900/80 border-red-500/40 text-red-200' : ''}
                        ${t.type === 'warn' ? 'bg-yellow-900/80 border-yellow-500/40 text-yellow-200' : ''}
                        ${t.type === 'info' ? 'bg-blue-900/80 border-blue-500/40 text-blue-200' : ''}
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
    admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    bank: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    corporate: 'bg-lime/20 text-lime border-lime/30',
    auditor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
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
        <div className="p-6 space-y-6">
            <ToastContainer toasts={toasts} remove={remove} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>👥</span> User Management
                    </h1>
                    <p className="text-secondary text-sm mt-1">Create, manage and monitor platform users</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 bg-lime text-primary font-bold rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-2 text-sm shadow-lg shadow-lime/20"
                    id="btn-create-user"
                >
                    <span className="text-base font-bold">+</span> Create User
                </button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Users', val: statCounts.total, icon: '👥', color: 'text-white' },
                    { label: 'Active', val: statCounts.active, icon: '✅', color: 'text-green-400' },
                    { label: 'Disabled', val: statCounts.disabled, icon: '🔴', color: 'text-red-400' },
                    { label: 'Filtered', val: filtered.length, icon: '🔍', color: 'text-lime' },
                ].map(s => (
                    <GlassCard key={s.label} className="p-4 text-center">
                        <div className="text-xl mb-1">{s.icon}</div>
                        <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
                        <div className="text-secondary text-xs mt-1">{s.label}</div>
                    </GlassCard>
                ))}
            </div>

            {/* Filters */}
            <GlassCard className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Search by name, email, org…"
                        className="flex-1 min-w-[200px] bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-lime/50"
                        value={searchQ}
                        onChange={e => { setSearchQ(e.target.value); setPage(1); }}
                    />
                    <select
                        className="bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/50"
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
                        className="bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/50"
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>
                    <button
                        onClick={loadUsers}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg border border-white/10 transition-all"
                    >
                        ↺ Refresh
                    </button>
                </div>
            </GlassCard>

            {/* Table */}
            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[900px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">User ID</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Name</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Organization</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Role</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Created</th>
                                <th className="py-3 px-4 text-right text-xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="py-16 text-center text-secondary animate-pulse">Loading users…</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="text-3xl mb-3">👤</div>
                                        <div className="text-secondary">No records available.</div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map(user => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="text-lime font-mono font-bold text-xs">#{user.id}</span>
                                            {user.user_code && (
                                                <div className="text-secondary text-xs font-mono mt-0.5">{user.user_code}</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime to-green-600 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">{user.name}</div>
                                                    <div className="text-secondary text-xs">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-white text-sm">{user.org_name || <span className="text-secondary italic">—</span>}</td>
                                        <td className="py-3 px-4"><RoleBadge role={user.role} /></td>
                                        <td className="py-3 px-4"><StatusBadge active={user.is_active} /></td>
                                        <td className="py-3 px-4 text-secondary text-xs font-mono">{formatDate((user as any).created_at)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* View */}
                                                <button
                                                    onClick={() => setViewUser(user)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    View
                                                </button>
                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-lime hover:text-green-300 bg-lime/10 hover:bg-lime/20 border border-lime/20 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                    ✏ Edit
                                                </button>
                                                {/* Edit Role */}
                                                <button
                                                    onClick={() => openRoleModal(user)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all"
                                                    title="Edit Role"
                                                >
                                                    Role
                                                </button>
                                                {/* Activate / Deactivate */}
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    disabled={togglingId === user.id}
                                                    className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all disabled:opacity-50 ${user.is_active
                                                        ? 'text-red-300 bg-red-500/10 hover:bg-red-500/20 border-red-500/20'
                                                        : 'text-green-300 bg-green-500/10 hover:bg-green-500/20 border-green-500/20'
                                                        }`}
                                                    title={user.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {togglingId === user.id ? '…' : user.is_active ? 'Disable' : 'Activate'}
                                                </button>
                                                {/* Reset Password */}
                                                <button
                                                    onClick={() => { setResetTarget(user); setTempPassword(null); }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:text-yellow-200 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-all"
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <span className="text-secondary text-xs">
                            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/20 transition-all">← Prev</button>
                            <span className="px-3 py-1.5 text-xs text-white">{page}/{totalPages}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/20 transition-all">Next →</button>
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* ── CREATE USER MODAL ─────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create New User</h2>
                            <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-white transition-colors text-lg">✕</button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Full Name *</label>
                                <input required type="text" className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
                            </div>
                            <div>
                                <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Email *</label>
                                <input required type="email" className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
                            </div>
                            <div>
                                <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Organization Name *</label>
                                <input required type="text" className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50" value={createForm.org_name} onChange={e => setCreateForm(f => ({ ...f, org_name: e.target.value }))} placeholder="Acme Bank" />
                            </div>
                            <div>
                                <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Temporary Password *</label>
                                <input required type="password" className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Role</label>
                                    <select
                                        className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50"
                                        value={createForm.role}
                                        onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
                                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                    >
                                        <option value="bank">Bank</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="auditor">Auditor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Status</label>
                                    <select
                                        className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50"
                                        value={createForm.is_active ? 'active' : 'disabled'}
                                        onChange={e => setCreateForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
                                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                    >
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-secondary hover:text-white transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={creating} className="px-6 py-2.5 bg-lime text-primary font-bold rounded-xl hover:bg-opacity-90 transition-all text-sm disabled:opacity-60">
                                    {creating ? 'Creating…' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* ── VIEW DETAILS MODAL ────────────────────────────── */}
            {viewUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-white">User Details</h2>
                            <button onClick={() => setViewUser(null)} className="text-secondary hover:text-white transition-colors text-lg">✕</button>
                        </div>
                        <div className="flex items-center gap-4 mb-5 p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime to-green-600 flex items-center justify-center text-primary font-bold text-2xl">
                                {viewUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-white font-bold text-lg">{viewUser.name}</div>
                                <div className="text-secondary text-sm">{viewUser.email}</div>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            {[
                                { label: 'User ID', val: `#${viewUser.id}` },
                                { label: 'User Code', val: viewUser.user_code || '—' },
                                { label: 'Organization', val: viewUser.org_name || '—' },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-secondary">{row.label}</span>
                                    <span className="text-white font-mono text-xs">{row.val}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-secondary">Role</span>
                                <RoleBadge role={viewUser.role} />
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-secondary">Status</span>
                                <StatusBadge active={viewUser.is_active} />
                            </div>
                        </div>
                        <button onClick={() => setViewUser(null)} className="w-full mt-5 px-4 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm">
                            Close
                        </button>
                    </GlassCard>
                </div>
            )}

            {/* ── ROLE CHANGE MODAL ────────────────────────────── */}
            {showRoleModal && roleTarget && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-white">Edit Role</h2>
                            <button onClick={() => setShowRoleModal(false)} className="text-secondary hover:text-white text-lg">✕</button>
                        </div>
                        <p className="text-secondary text-sm mb-5">
                            Changing role for <strong className="text-white">{roleTarget.name}</strong>.
                            This action will be logged in the audit trail.
                        </p>
                        <div className="mb-4">
                            <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">New Role</label>
                            <select
                                className="w-full bg-dark/60 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50"
                                value={newRole}
                                onChange={e => setNewRole(e.target.value as UserRole)}
                                style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
                            >
                                <option value="bank">Bank</option>
                                <option value="corporate">Corporate</option>
                                <option value="auditor">Auditor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300 text-xs mb-5">
                            ⚠ Role changes are permanent and audited. Current role: <strong>{roleTarget.role.toUpperCase()}</strong>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRoleModal(false)} className="flex-1 px-4 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm">Cancel</button>
                            <button onClick={handleRoleChange} disabled={changingRole || newRole === roleTarget.role} className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all text-sm disabled:opacity-50">
                                {changingRole ? 'Saving…' : 'Confirm Change'}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* ── RESET PASSWORD MODAL ─────────────────────────── */}
            {resetTarget && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-white">Reset Password</h2>
                            <button onClick={() => { setResetTarget(null); setTempPassword(null); }} className="text-secondary hover:text-white text-lg">✕</button>
                        </div>

                        {tempPassword ? (
                            <>
                                <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-xl mb-4">
                                    <p className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-2">⚠ Temporary Password — Share Securely</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-black/50 px-3 py-2 rounded-lg text-lime font-mono text-sm font-bold tracking-widest border border-white/10">
                                            {tempPassword}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(tempPassword)}
                                            className="px-3 py-2 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                <p className="text-secondary text-xs mb-5">The user's password has been reset. Share this temporary password through a secure channel. This password will not be shown again.</p>
                                <button onClick={() => { setResetTarget(null); setTempPassword(null); }} className="w-full px-4 py-2.5 bg-lime text-primary font-bold rounded-xl hover:bg-opacity-90 transition-all text-sm">
                                    Done
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-secondary text-sm mb-5">
                                    Reset password for <strong className="text-white">{resetTarget.name}</strong>?
                                    A temporary password will be generated. This action will be logged.
                                </p>
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs mb-5">
                                    🔐 The existing password will be invalidated immediately.
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setResetTarget(null)} className="flex-1 px-4 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm">Cancel</button>
                                    <button onClick={handleReset} disabled={resetting} className="flex-1 px-4 py-2.5 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm disabled:opacity-50">
                                        {resetting ? 'Resetting…' : 'Reset Password'}
                                    </button>
                                </div>
                            </>
                        )}
                    </GlassCard>
                </div>
            )}
            {/* ── EDIT USER MODAL ──────────────────────────────── */}
            {editUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Edit User</h2>
                                <p className="text-secondary text-xs mt-0.5">#{editUser.id} · Changes are audited</p>
                            </div>
                            <button onClick={() => setEditUser(null)} className="text-secondary hover:text-white transition-colors text-lg">✕</button>
                        </div>

                        {/* User avatar strip */}
                        <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime to-green-600 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                {editUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm">{editUser.name}</div>
                                <div className="text-secondary text-xs">{editUser.email}</div>
                            </div>
                        </div>

                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Full Name *</label>
                                    <input
                                        required type="text"
                                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50 transition-colors"
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Email *</label>
                                    <input
                                        required type="email"
                                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50 transition-colors"
                                        value={editForm.email}
                                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Organization Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50 transition-colors"
                                    value={editForm.org_name}
                                    onChange={e => setEditForm(f => ({ ...f, org_name: e.target.value }))}
                                    placeholder="Acme Corp"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Role</label>
                                    <select
                                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50"
                                        value={editForm.role}
                                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                                        style={{ backgroundColor: '#000', color: 'white' }}
                                    >
                                        <option value="bank">Bank</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="auditor">Auditor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Status</label>
                                    <select
                                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50"
                                        value={editForm.is_active ? 'active' : 'disabled'}
                                        onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
                                        style={{ backgroundColor: '#000', color: 'white' }}
                                    >
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">
                                    New Password <span className="normal-case text-white/40 font-normal">(leave blank to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-black border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-lime/50 transition-colors"
                                    value={editForm.password}
                                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300 text-xs">
                                ⚠ All edits are permanently recorded in the audit trail under your admin account.
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditUser(null)}
                                    className="flex-1 px-4 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="flex-1 px-6 py-2.5 bg-lime text-primary font-bold rounded-xl hover:bg-opacity-90 transition-all text-sm disabled:opacity-60"
                                >
                                    {editSaving ? 'Saving…' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
