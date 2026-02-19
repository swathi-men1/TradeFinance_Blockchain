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

    // Helper: Format Action String
    const formatAction = (action: string) => {
        return action
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    // Helper: Get Badge Color for Action
    const getActionColor = (action: string) => {
        if (action.includes('CREATE') || action.includes('UPLOAD') || action.includes('REGISTER')) return 'bg-success/20 text-success border-success/30';
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('REMOVE')) return 'bg-error/20 text-error border-error/30';
        if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('AMEND')) return 'bg-info/20 text-info border-info/30';
        if (action.includes('RISK') || action.includes('CALCULATION')) return 'bg-warning/20 text-warning border-warning/30';
        if (action.includes('VERIF')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        return 'bg-white/10 text-white border-white/20';
    };

    // Helper: Display Actor
    const getActorDisplay = (log: AuditLog) => {
        if (!log.admin_id) return <span className="text-purple-400 font-mono">System 🤖</span>;

        if (log.admin?.name) {
            return (
                <div className="flex flex-col">
                    <span className="text-blue-300 font-semibold">{log.admin.name}</span>
                    <span className="text-xs text-white/40">ID: {log.admin_id}</span>
                </div>
            );
        }

        return <span className="text-blue-300 font-mono">User ID: {log.admin_id} 👤</span>;
    };

    return (
        <GlassCard className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>📜</span> Audit Logs
                    </h3>
                    <p className="text-secondary text-sm">Track all system activities and administrative actions</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center bg-dark/30 p-2 rounded-lg border border-white/5">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-xs">ID:</span>
                        <input
                            type="number"
                            name="user_id"
                            placeholder="User ID..."
                            className="pl-8 pr-3 py-1.5 bg-dark/50 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary w-24"
                            value={filters.user_id}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-xs">ACT:</span>
                        <input
                            type="text"
                            name="action"
                            placeholder="Search action..."
                            className="pl-10 pr-3 py-1.5 bg-dark/50 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary w-32"
                            value={filters.action}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <button
                        onClick={loadLogs}
                        className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm rounded transition-colors flex items-center gap-1"
                    >
                        <span>🔍</span> Filter
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors border border-white/10 flex items-center gap-1"
                    >
                        <span>📥</span> Export
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5">
                        <tr className="text-secondary text-xs uppercase tracking-wider border-b border-white/10">
                            <th className="p-4 font-medium">Log ID</th>
                            <th className="p-4 font-medium">Actor</th>
                            <th className="p-4 font-medium">Action Performed</th>
                            <th className="p-4 font-medium">Target Entity</th>
                            <th className="p-4 font-medium">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center p-8 text-secondary animate-pulse">Loading audit trail...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-8 text-secondary">No audit logs found matching your criteria.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 text-white/50 text-sm font-mono">#{log.id}</td>

                                    <td className="p-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            {getActorDisplay(log)}
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-white text-sm font-medium">{log.target_type}</span>
                                            <span className="text-xs text-secondary">ID: {log.target_id || 'N/A'}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-secondary text-sm font-mono whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-xs text-center text-white/20">
                Showing {logs.length} entries • System Audit Trail • Indelible Record
            </div>
        </GlassCard>
    );
}
