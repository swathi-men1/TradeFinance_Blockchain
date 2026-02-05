/* Author: Abdul Samad | */
import React, { useState } from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    Info,
    FileText,
    User,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditEvent {
    id: number;
    severity: "CRITICAL" | "WARNING" | "INFO";
    timestamp: string;
    actor_name: string;
    actor_role?: string;
    action: string;
    target_type: "DOCUMENT" | "USER";
    target_id: string | number;
    target_display: string;
    evidence?: any;
}

interface RichAuditTableProps {
    logs: AuditEvent[];
}

const getSeverityConfig = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("TAMPER") || act.includes("DELETE") || act.includes("FAILURE") || act.includes("CRITICAL")) {
        return {
            level: "CRITICAL",
            color: "text-red-700 dark:text-red-400",
            bg: "bg-red-100 dark:bg-red-900/20",
            border: "border-red-200 dark:border-red-800",
            icon: ShieldAlert
        };
    } else if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("CHANGE") || act.includes("REVOKE")) {
        return {
            level: "WARNING",
            color: "text-amber-700 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-900/20",
            border: "border-amber-200 dark:border-amber-800",
            icon: AlertCircle
        };
    } else {
        return {
            level: "INFO",
            color: "text-blue-700 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-900/20",
            border: "border-blue-200 dark:border-blue-800",
            icon: Info
        };
    }
};

const EvidenceModal = ({ log, onClose }: { log: AuditEvent; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative border border-gray-200 dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                    Security Evidence Record
                </h3>

                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Event Type</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">{log.action}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                            <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase mb-1">Mismatch Found</p>
                            <code className="text-xs break-all text-red-800 dark:text-red-300 font-mono block">
                                {log.evidence?.found_hash || "N/A"}
                            </code>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase mb-1">Expected Hash</p>
                            <code className="text-xs break-all text-green-800 dark:text-green-300 font-mono block">
                                {log.evidence?.expected_hash || "N/A"}
                            </code>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-2">Raw Metadata</p>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-gray-800">
                            {JSON.stringify(log.evidence, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close Record
                    </button>
                </div>
            </div>
        </div>
    );
};

export const RichAuditTable: React.FC<RichAuditTableProps> = ({ logs }) => {
    const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-4 font-medium w-16">Sev</th>
                            <th className="px-6 py-4 font-medium">Timestamp</th>
                            <th className="px-6 py-4 font-medium">Actor</th>
                            <th className="px-6 py-4 font-medium">Event</th>
                            <th className="px-6 py-4 font-medium">Target Entity</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {logs.map((log) => {
                            const config = getSeverityConfig(log.action);
                            const Icon = config.icon;
                            const isTamper = log.action.includes("TAMPER");

                            return (
                                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${config.bg} ${config.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                                        {format(new Date(log.timestamp), "MMM dd, yyyy • hh:mm a")}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {log.actor_name || "System Integrity Bot"}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {log.actor_role || "Admin"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            {log.target_type === 'DOCUMENT' ?
                                                <FileText className="w-4 h-4 text-gray-400" /> :
                                                <User className="w-4 h-4 text-gray-400" />
                                            }
                                            <span className={`font-medium ${isTamper ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
                                                {log.target_display || `ID: ${log.target_id}`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {isTamper && (
                                            <button
                                                onClick={() => {
                                                    console.log(log.evidence);
                                                    setSelectedLog(log);
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs font-medium transition-colors"
                                            >
                                                View Evidence
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedLog && (
                <EvidenceModal log={selectedLog} onClose={() => setSelectedLog(null)} />
            )}
        </>
    );
};
