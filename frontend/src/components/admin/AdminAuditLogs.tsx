/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { adminService, AuditLog } from '../../services/adminService';

import { ElevatedPanel } from '../layout/ElevatedPanel';
import { FileText, Bot, User, Search, Download, Filter } from 'lucide-react';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [searchQuery, logs]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Fetch all recent logs without server-side filtering to enable client-side smart search
            const data = await adminService.getAuditLogs({});
            setLogs(data);
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        if (!searchQuery.trim()) {
            setFilteredLogs(logs);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = logs.filter(log => {
            const adminName = log.admin?.name?.toLowerCase() || '';
            const action = log.action.toLowerCase().replace(/_/g, ' ');
            const target = log.target_type.toLowerCase();
            const idMatch = log.admin_id?.toString().includes(query) || log.target_id?.toString().includes(query);

            return adminName.includes(query) ||
                action.includes(query) ||
                target.includes(query) ||
                idMatch;
        });
        setFilteredLogs(filtered);
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
        return 'bg-white/10 text-content-primary border-white/20';
    };

    // Helper: Display Actor with "Abdul Samad" Protocol
    const getActorDisplay = (log: AuditLog) => {
        // System Actions
        if (!log.admin_id) return (
            <div className="flex items-center gap-2 text-purple-400 font-mono">
                <Bot size={16} />
                <span>System</span>
            </div>
        );

        // Named Admin
        if (log.admin?.name) {
            return (
                <div className="flex flex-col">
                    <span className="text-blue-300 font-semibold">{log.admin.name}</span>
                    <span className="text-xs text-white/40">ID: {log.admin_id?.toString().substring(0, 8)}...</span>
                </div>
            );
        }

        // Masked Admin ID -> Alias
        return (
            <div className="flex flex-col">
                <span className="text-secondary font-semibold flex items-center gap-1">
                    <User size={14} />
                    Admin User
                </span>
                <span className="text-xs text-white/30 font-mono">ID: {log.admin_id?.toString().substring(0, 8)}...</span>
            </div>
        );
    };

    return (
        <ElevatedPanel className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <FileText size={24} className="text-blue-400" />
                        <span>Audit Logs</span>
                    </h3>
                    <p className="text-secondary text-sm">Track all system activities and administrative actions</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Smart Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search user, action, or entity..."
                            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-content-primary placeholder-white/20 focus:outline-none focus:border-blue-500 focus:bg-black/60 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={loadLogs}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
                        title="Refresh"
                    >
                        <Filter size={18} />
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20"
                    >
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
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
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-8 text-secondary">
                                {searchQuery ? 'No matching logs found.' : 'No audit logs available.'}
                            </td></tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 text-white/50 text-sm font-mono">#{log.id}</td>

                                    <td className="p-4 text-sm">
                                        {getActorDisplay(log)}
                                    </td>

                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getActionColor(log.action)}`}>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-content-primary text-sm font-medium">{log.target_type}</span>
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
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs text-secondary">
                <span>Displaying {filteredLogs.length} active audit records</span>
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    System Audit Trail • Indelible Record
                </span>
            </div>
        </ElevatedPanel>
    );
}
