import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { adminService, AuditLog } from '../../services/adminService';

/* ─── Helpers ──────────────────────────────────────────────── */
function formatDate(val: string) {
    if (!val) return '—';
    return new Date(val).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function getActionColor(action: string) {
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('REGISTER')) return { bg: 'bg-green-500/15', text: 'text-green-300', border: 'border-green-500/30', icon: '🗂️' };
    if (a.includes('DELETE') || a.includes('REMOVE')) return { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/30', icon: '🗑️' };
    if (a.includes('UPDATE') || a.includes('ROLE')) return { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30', icon: '✏️' };
    if (a.includes('DEACTIVATE') || a.includes('DISABLE')) return { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30', icon: '⏸️' };
    if (a.includes('ACTIVATE')) return { bg: 'bg-lime/15', text: 'text-lime', border: 'border-lime/30', icon: '▶️' };
    if (a.includes('PASSWORD') || a.includes('RESET')) return { bg: 'bg-yellow-500/15', text: 'text-yellow-300', border: 'border-yellow-500/30', icon: '🔑' };
    if (a.includes('RISK') || a.includes('RECALCULATE')) return { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30', icon: '📊' };
    if (a.includes('SYSTEM') || a.includes('CHECK')) return { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', icon: '⚙️' };
    return { bg: 'bg-white/10', text: 'text-white', border: 'border-white/20', icon: '📝' };
}

function ActionBadge({ action }: { action: string }) {
    const { bg, text, border, icon } = getActionColor(action);
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border backdrop-blur-sm transition-all hover:scale-105 ${bg} ${text} ${border}`}>
            {icon} {action.replace(/_/g, ' ')}
        </span>
    );
}

/* Known Admin actions for dropdown filter */
const KNOWN_ACTIONS = [
    'USER_CREATED', 'ROLE_UPDATED', 'ACCOUNT_DISABLED', 'ACCOUNT_ACTIVATED',
    'PASSWORD_RESET', 'SYSTEM_CHECK', 'RISK_JOB_TRIGGERED',
    'CREATE_USER', 'UPDATE_ROLE', 'DEACTIVATE_USER', 'ACTIVATE_USER',
    'DELETE_USER', 'CREATE_ORG', 'UPDATE_ORG',
];

const PAGE_SIZE = 20;

/* ─── Main ─────────────────────────────────────────────────── */
export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterAdminId, setFilterAdminId] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Pagination
    const [page, setPage] = useState(1);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (filterAdminId) params.user_id = parseInt(filterAdminId);
            if (filterAction) params.action = filterAction;
            const data = await adminService.getAuditLogs(params);
            setLogs(data);
            setPage(1);
        } catch {
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [filterAdminId, filterAction]);

    useEffect(() => { loadLogs(); }, []); // eslint-disable-line

    /* Client-side date filter */
    const dateFiltered = logs.filter(log => {
        if (!log.timestamp) return true;
        const ts = new Date(log.timestamp).getTime();
        if (filterDateFrom && ts < new Date(filterDateFrom).getTime()) return false;
        if (filterDateTo && ts > new Date(filterDateTo + 'T23:59:59').getTime()) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(dateFiltered.length / PAGE_SIZE));
    const paginated = dateFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Hero Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-pink-600/20 rounded-2xl blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl border border-gray-300 backdrop-blur-xl bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h1 className="text-4xl font-black text-black flex items-center gap-3 mb-2">
                            <span className="text-5xl">📜</span> Audit Logs
                        </h1>
                        <p className="text-black/70 text-sm font-medium">Immutable record of all administrative and system actions</p>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl backdrop-blur-md">
                            <span className="text-xl">🔒</span>
                            <div>
                                <div className="text-xs font-bold text-black uppercase tracking-wide">Immutable</div>
                                <div className="text-xs text-black/60">Read-Only Record</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Filters */}
            <GlassCard className="p-6 border border-white/10">
                <h3 className="text-base font-bold text-black/90 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span>🔍</span> Filter Logs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    {/* Admin ID filter */}
                    <div>
                        <label className="block text-black/75 text-xs font-bold mb-2 uppercase tracking-wider">Admin ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 3"
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
                            value={filterAdminId}
                            onChange={e => setFilterAdminId(e.target.value)}
                        />
                    </div>
                    {/* Action filter */}
                    <div>
                        <label className="block text-black/75 text-xs font-bold mb-2 uppercase tracking-wider">Action</label>
                        <select
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                        >
                            <option value="" className="bg-white text-black">All Actions</option>
                            {KNOWN_ACTIONS.map(a => (
                                <option key={a} value={a} className="bg-white text-black">{a.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    {/* Date From */}
                    <div>
                        <label className="block text-black/75 text-xs font-bold mb-2 uppercase tracking-wider">Date From</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
                            value={filterDateFrom}
                            onChange={e => setFilterDateFrom(e.target.value)}
                        />
                    </div>
                    {/* Date To */}
                    <div>
                        <label className="block text-black/75 text-xs font-bold mb-2 uppercase tracking-wider">Date To</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
                            value={filterDateTo}
                            onChange={e => setFilterDateTo(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={loadLogs}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                        🔍 Apply Filters
                    </button>
                    <button
                        onClick={() => { setFilterAdminId(''); setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                        className="px-6 py-2.5 bg-gray-100 border border-gray-300 text-black/80 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-all"
                    >
                        ✕ Clear
                    </button>
                </div>
            </GlassCard>

            {/* Summary Stats */}
            {!loading && (
                <div className="p-4 bg-gray-100 border border-gray-300 rounded-xl">
                    <p className="text-black/80 text-sm font-medium">
                        📋 Showing <span className="text-emerald-600 font-bold">{dateFiltered.length}</span> log entries
                        {filterAction && <span> · Action: <span className="text-blue-600 font-bold">{filterAction.replace(/_/g, ' ')}</span></span>}
                        {filterAdminId && <span> · Admin: <span className="text-purple-600 font-bold">#{filterAdminId}</span></span>}
                    </p>
                </div>
            )}

            {/* Audit Table */}
            <GlassCard className="p-0 overflow-hidden border border-gray-300 flex flex-col bg-white">
                {error && (
                    <div className="p-4 text-red-600 text-sm border-b border-red-300 bg-red-50 flex items-center gap-2">
                        <span>✖</span> {error}
                    </div>
                )}
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full min-w-[950px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 backdrop-blur">
                                <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Timestamp</th>
                                <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Admin</th>
                                <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Action</th>
                                <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Target Type</th>
                                <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Target ID</th>
                                <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-3 border-blue-300/50 border-t-blue-600 rounded-full animate-spin" />
                                        <span className="text-black/60 text-sm font-medium">Loading audit trail…</span>
                                    </div>
                                </td></tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="text-6xl animate-bounce opacity-60">📜</div>
                                            <div>
                                                <div className="text-black/80 font-semibold mb-1">No records available.</div>
                                                <div className="text-black/50 text-xs">{filterAction || filterAdminId ? '✓ Try adjusting your filters' : '✓ Logs will appear as actions occur'}</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-200 transition-all backdrop-blur-sm hover:bg-gray-50">
                                        {/* Timestamp */}
                                        <td className="py-4 px-4 text-black/60 text-xs font-mono whitespace-nowrap">
                                            <span className="text-black/80">{formatDate(log.timestamp)}</span>
                                        </td>
                                        {/* Admin */}
                                        <td className="py-4 px-4">
                                            {log.admin_id ? (
                                                <div className="flex flex-col">
                                                    <span className="text-emerald-600 font-mono font-bold text-sm">#{log.admin_id}</span>
                                                    {log.admin?.name && <span className="text-black/60 text-xs mt-0.5">{log.admin.name}</span>}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-bold border border-purple-500/30">🤖 System</span>
                                            )}
                                        </td>
                                        {/* Action */}
                                        <td className="py-4 px-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        {/* Target Type */}
                                        <td className="py-4 px-4">
                                            <span className="text-black/80 font-semibold text-sm">{log.target_type || '—'}</span>
                                        </td>
                                        {/* Target ID */}
                                        <td className="py-4 px-4">
                                            <span className="text-blue-600 font-mono font-bold text-xs">#{log.target_id ?? '—'}</span>
                                        </td>
                                        {/* Metadata */}
                                        <td className="py-4 px-4">
                                            {(log as any).metadata ? (
                                                <code className="text-xs text-black/60 font-mono bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-300 max-w-[220px] truncate block hover:bg-gray-200 transition-all" title={JSON.stringify((log as any).metadata)}>
                                                    {JSON.stringify((log as any).metadata)}
                                                </code>
                                            ) : <span className="text-black/40 text-xs">—</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-300 bg-gray-50">
                        <span className="text-black/70 text-sm font-medium">
                            Page <span className="text-black font-bold">{page}</span> of <span className="text-black font-bold">{totalPages}</span> · <span className="text-emerald-600">{dateFiltered.length}</span> total entries
                        </span>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setPage(p => p - 1)} 
                                disabled={page === 1} 
                                className="px-4 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg text-black/70 font-bold disabled:opacity-40 hover:bg-gray-200 transition-all"
                            >
                                ← Prev
                            </button>
                            <button 
                                onClick={() => setPage(p => p + 1)} 
                                disabled={page === totalPages} 
                                className="px-4 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg text-black/70 font-bold disabled:opacity-40 hover:bg-gray-200 transition-all"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-300 bg-gray-50 text-center text-black/60 text-xs font-medium flex items-center justify-center gap-2">
                    <span>🔐</span> Audit logs are immutable and cannot be modified · System Indelible Record
                </div>
            </GlassCard>
        </div>
    );
}
