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
    if (a.includes('CREATE') || a.includes('REGISTER')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (a.includes('DELETE') || a.includes('REMOVE')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (a.includes('UPDATE') || a.includes('ROLE')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (a.includes('DEACTIVATE') || a.includes('DISABLE')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (a.includes('ACTIVATE')) return 'bg-lime/20 text-lime border-lime/30';
    if (a.includes('PASSWORD') || a.includes('RESET')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (a.includes('RISK') || a.includes('RECALCULATE')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (a.includes('SYSTEM') || a.includes('CHECK')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-white/10 text-white border-white/20';
}

function ActionBadge({ action }: { action: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getActionColor(action)}`}>
            {action.replace(/_/g, ' ')}
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>📜</span> Audit Logs
                    </h1>
                    <p className="text-secondary text-sm mt-1">Immutable record of all administrative and system actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-secondary bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                        🔒 Immutable · Read-Only
                    </span>
                </div>
            </div>

            {/* Filters */}
            <GlassCard className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    {/* Admin ID filter */}
                    <div>
                        <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Admin ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 3"
                            className="w-full bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-lime/50"
                            value={filterAdminId}
                            onChange={e => setFilterAdminId(e.target.value)}
                        />
                    </div>
                    {/* Action filter */}
                    <div>
                        <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Action</label>
                        <select
                            className="w-full bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/50"
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                            <option value="">All Actions</option>
                            {KNOWN_ACTIONS.map(a => (
                                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    {/* Date From */}
                    <div>
                        <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Date From</label>
                        <input
                            type="date"
                            className="w-full bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/50"
                            value={filterDateFrom}
                            onChange={e => setFilterDateFrom(e.target.value)}
                        />
                    </div>
                    {/* Date To */}
                    <div>
                        <label className="block text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wider">Date To</label>
                        <input
                            type="date"
                            className="w-full bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/50"
                            value={filterDateTo}
                            onChange={e => setFilterDateTo(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadLogs}
                        className="px-5 py-2 bg-lime text-primary font-bold rounded-lg text-sm hover:bg-opacity-90 transition-all"
                    >
                        🔍 Apply Filters
                    </button>
                    <button
                        onClick={() => { setFilterAdminId(''); setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                        className="px-4 py-2 bg-white/10 border border-white/10 text-white text-sm rounded-lg hover:bg-white/15 transition-all"
                    >
                        ✕ Clear
                    </button>
                </div>
            </GlassCard>

            {/* Summary */}
            {!loading && (
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-secondary">
                        Showing <strong className="text-white">{dateFiltered.length}</strong> log entries
                        {filterAction && <span> for action <strong className="text-lime">{filterAction}</strong></span>}
                        {filterAdminId && <span> by admin <strong className="text-blue-300">#{filterAdminId}</strong></span>}
                    </span>
                </div>
            )}

            {/* Table */}
            <GlassCard className="p-0 overflow-hidden">
                {error && (
                    <div className="p-4 text-red-400 text-sm border-b border-red-500/20 bg-red-900/10">
                        ✖ {error}
                    </div>
                )}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[900px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Timestamp</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Admin ID</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Action</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Target Type</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Target ID</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center text-secondary animate-pulse">Loading audit trail…</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="text-3xl mb-3">📜</div>
                                        <div className="text-secondary">No records available.</div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        {/* Timestamp */}
                                        <td className="py-3 px-4 text-secondary text-xs font-mono whitespace-nowrap">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        {/* Admin */}
                                        <td className="py-3 px-4">
                                            {log.admin_id ? (
                                                <div className="flex flex-col">
                                                    <span className="text-lime font-mono font-bold text-xs">#{log.admin_id}</span>
                                                    {log.admin?.name && <span className="text-secondary text-xs">{log.admin.name}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-purple-400 text-xs font-semibold">System 🤖</span>
                                            )}
                                        </td>
                                        {/* Action */}
                                        <td className="py-3 px-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        {/* Target Type */}
                                        <td className="py-3 px-4">
                                            <span className="text-white font-semibold text-sm">{log.target_type || '—'}</span>
                                        </td>
                                        {/* Target ID */}
                                        <td className="py-3 px-4">
                                            <span className="text-secondary font-mono text-xs">{log.target_id ?? '—'}</span>
                                        </td>
                                        {/* Metadata */}
                                        <td className="py-3 px-4">
                                            {(log as any).metadata ? (
                                                <code className="text-xs text-secondary font-mono bg-white/5 px-2 py-1 rounded border border-white/5 max-w-[200px] truncate block" title={JSON.stringify((log as any).metadata)}>
                                                    {JSON.stringify((log as any).metadata)}
                                                </code>
                                            ) : <span className="text-secondary text-xs">—</span>}
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
                            Page {page} of {totalPages} · {dateFiltered.length} total entries
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/20 transition-all">← Prev</button>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/20 transition-all">Next →</button>
                        </div>
                    </div>
                )}

                <div className="px-4 py-2 border-t border-white/5 text-center text-secondary text-xs">
                    Audit logs are immutable and cannot be modified · System Indelible Record
                </div>
            </GlassCard>
        </div>
    );
}
