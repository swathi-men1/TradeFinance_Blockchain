/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React from 'react';
import { CheckCircle2, XCircle, ArrowDown } from 'lucide-react';

interface LedgerEntry {
    id: number;
    action: string;
    actor: string;
    timestamp: string;
    previousHash: string;
    entryHash: string;
    isValid?: boolean;
}

interface AuditChainTimelineProps {
    entries: LedgerEntry[];
}

export function AuditChainTimeline({ entries }: AuditChainTimelineProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const truncateHash = (hash: string) => {
        if (!hash) return "Pending";
        if (hash.length <= 16) return hash;
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    };

    return (
        <div className="relative pl-4 space-y-6">
            {/* Vertical Line */}
            <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-white/10" style={{ zIndex: 0 }}></div>

            {entries.map((entry, index) => (
                <div key={entry.id} className="relative z-10 pl-8">
                    {/* Status Dot */}
                    <div className={`absolute left-2.5 top-5 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${entry.isValid === false
                        ? 'bg-red-500 border-red-900 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                        : entry.isValid === true
                            ? 'bg-lime-500 border-lime-900 shadow-[0_0_10px_rgba(132,204,22,0.5)]'
                            : 'bg-gray-500 border-gray-800'
                        }`}></div>

                    {/* Card */}
                    <div className={`rounded-xl border p-4 transition-all hover:bg-white/5 ${entry.isValid === false
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-black/20 border-white/5'
                        }`}>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-content-primary text-base tracking-wide flex items-center gap-2">
                                {entry.action.replace(/_/g, ' ')}
                            </h4>
                            {entry.isValid !== undefined && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${entry.isValid
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                    {entry.isValid ? (
                                        <><CheckCircle2 size={12} /> Valid</>
                                    ) : (
                                        <><XCircle size={12} /> Invalid</>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex flex-col">
                                <span className="text-secondary text-xs uppercase tracking-wider mb-0.5">Actor</span>
                                <span className="font-semibold text-content-primary">{entry.actor}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-secondary text-xs uppercase tracking-wider mb-0.5">Timestamp</span>
                                <span className="font-mono text-content-primary">{formatDate(entry.timestamp)}</span>
                            </div>
                        </div>

                        {/* Hashes */}
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                            <div className="flex items-center justify-between group">
                                <span className="text-secondary text-xs font-mono">Prev:</span>
                                <code className="text-xs font-mono text-white/40 bg-black/40 px-2 py-1 rounded w-full ml-2 truncate group-hover:text-white/60 transition-colors">
                                    {truncateHash(entry.previousHash)}
                                </code>
                            </div>
                            <div className="flex items-center justify-between group">
                                <span className="text-lime-400/70 text-xs font-mono">Hash:</span>
                                <code className="text-xs font-mono text-lime-400 bg-lime-400/10 px-2 py-1 rounded w-full ml-2 truncate border border-lime-400/20">
                                    {truncateHash(entry.entryHash)}
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Arrow for connection */}
                    {index < entries.length - 1 && (
                        <div className="ml-4 my-2 text-white/10 flex justify-center">
                            <ArrowDown size={16} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
