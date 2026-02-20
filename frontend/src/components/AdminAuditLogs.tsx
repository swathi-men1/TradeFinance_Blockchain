import React, { useState, useEffect } from 'react';
import { adminService, AuditLog } from '../services/adminService';
import { GlassCard } from './GlassCard';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ user_id: '', action: '' });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Only add params if they have values
            const params: any = {};
            if (filters.user_id) params.user_id = parseInt(filters.user_id);
            if (filters.action) params.action = filters.action;

            const data = await adminService.getAuditLogs(params);
            setLogs(data);
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleClearFilters = () => {
        setFilters({ user_id: '', action: '' });
        loadLogs();
    };

    // Helper: Format Action String
    const formatAction = (action: string) => {
        return action
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    // Helper: Get Action Icon
    const getActionIcon = (action: string) => {
        if (action.includes('CREATE') || action.includes('UPLOAD') || action.includes('REGISTER')) return '✨';
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('REMOVE')) return '🗑️';
        if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('AMEND')) return '✏️';
        if (action.includes('RISK') || action.includes('CALCULATION')) return '⚠️';
        if (action.includes('VERIF')) return '✅';
        if (action.includes('PASSWORD')) return '🔑';
        if (action.includes('ACTIVATE')) return '🟢';
        if (action.includes('DEACTIVATE')) return '🔴';
        if (action.includes('LEDGER')) return '📖';
        return '📋';
    };

    // Helper: Get Badge Color for Action
    const getActionColor = (action: string) => {
        if (action.includes('CREATE') || action.includes('UPLOAD') || action.includes('REGISTER')) return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10';
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('REMOVE')) return 'bg-red-500/25 text-red-300 border-red-500/40 shadow-lg shadow-red-500/10';
        if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('AMEND')) return 'bg-blue-500/25 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-500/10';
        if (action.includes('RISK') || action.includes('CALCULATION')) return 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10';
        if (action.includes('VERIF')) return 'bg-purple-500/25 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10';
        if (action.includes('PASSWORD') || action.includes('ACTIVATE')) return 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10';
        return 'bg-slate-500/25 text-slate-300 border-slate-500/40 shadow-lg shadow-slate-500/10';
    };

    // Helper: Display Actor
    const getActorDisplay = (log: AuditLog) => {
        if (!log.admin_id) return (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-xs">🤖</div>
                <div className="flex flex-col">
                    <span className="text-purple-300 font-semibold text-sm">System</span>
                    <span className="text-xs text-white/30">Automated</span>
                </div>
            </div>
        );

        if (log.admin?.name) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-xs font-bold">{log.admin.name.charAt(0).toUpperCase()}</div>
                    <div className="flex flex-col">
                        <span className="text-blue-300 font-semibold text-sm">{log.admin.name}</span>
                        <span className="text-xs text-white/30">ID: {log.admin_id}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-xs">👤</div>
                <span className="text-blue-300 text-sm font-mono">User {log.admin_id}</span>
            </div>
        );
    };

    const isFiltered = filters.user_id || filters.action;

    return (
        <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-8 pb-6 border-b border-white/10">
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">📜</div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">Audit Logs</h2>
                            <p className="text-white/60 text-sm mt-1">Immutable record of all system actions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <span>🔒</span> Read-Only
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span>✓</span> Immutable
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 rounded-xl border border-white/10 bg-gradient-to-r from-white/5 via-white/3 to-white/5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Admin ID</label>
                        <input
                            type="number"
                            name="user_id"
                            placeholder="e.g. 3"
                            className="w-full px-3.5 py-2.5 bg-dark/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                            value={filters.user_id}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Action</label>
                        <input
                            type="text"
                            name="action"
                            placeholder="Search action (e.g., PASSWORD RESET)"
                            className="w-full px-3.5 py-2.5 bg-dark/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                            value={filters.action}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={loadLogs}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <span>🔍</span> Apply Filters
                        </button>
                        {isFiltered && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <span>✕</span> Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="mb-4 text-sm text-white/50">
                Showing <span className="font-semibold text-white">{logs.length}</span> log entries
                {isFiltered && <span className="ml-2 text-cyan-400">(filtered)</span>}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-gradient-to-b from-white/3 to-transparent">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/8 border-b border-white/10">
                            <th className="px-6 py-4 text-xs font-bold text-white/70 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/70 uppercase tracking-wider">Actor</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/70 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/70 uppercase tracking-wider">Target Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/70 uppercase tracking-wider">Target ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="animate-spin text-3xl">⏳</div>
                                        <p className="text-white/50 font-medium">Loading audit trail...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="text-4xl opacity-50">📭</div>
                                        <p className="text-white/50 font-medium">No audit logs found</p>
                                        <p className="text-white/30 text-sm">Try adjusting your filters or check back later</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log, idx) => (
                                <tr key={log.id} className="hover:bg-white/8 transition-all duration-200 group">
                                    <td className="px-6 py-4 text-sm font-mono text-white/70 whitespace-nowrap group-hover:text-white/90">
                                        {new Date(log.timestamp).toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </td>

                                    <td className="px-6 py-4 text-sm">
                                        {getActorDisplay(log)}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getActionColor(log.action)}`}>
                                            <span>{getActionIcon(log.action)}</span>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-sm">
                                        <div className="inline-block px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-white/80 font-medium text-xs">
                                            {log.target_type}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-sm font-mono text-white/60 group-hover:text-white/80">
                                        {log.target_id || <span className="text-white/30">—</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-white/40">
                    <span className="flex items-center gap-1 inline-flex">
                        <span>🔐</span> Immutable and cannot be modified
                    </span>
                </div>
                <div className="text-xs text-white/30 font-mono">
                    System Indelible Record
                </div>
            </div>
        </GlassCard>
    );
}
