import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { LedgerLifecycleResponse, LedgerEntry } from '../services/auditorService';
import { FileText, Database } from 'lucide-react';

interface DocumentSlim {
    id: number;
    doc_number: string;
    doc_type: string;
    created_at: string;
}

const ACTION_COLOR: Record<string, { bg: string; text: string; border: string }> = {
    TRADE_CREATED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    DOCUMENT_UPLOADED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    VERIFIED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    STATUS_UPDATED: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    DISPUTED: { bg: 'bg-red-600/10', text: 'text-red-400', border: 'border-red-600/20' },
    AMENDED: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    SYSTEM_CHECK: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
    ISSUED: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    SHIPPED: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    RECEIVED: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    PAID: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

function ActionBadge({ action }: { action: string }) {
    const cfg = ACTION_COLOR[action] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
    return (
        <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} font-mono`}>
            {action}
        </span>
    );
}

function formatDate(dt: string) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AuditorLedgerPage() {
    const [activeTab, setActiveTab] = useState<'document' | 'system'>('system');

    // Document Lifecycle State
    const [documents, setDocuments] = useState<DocumentSlim[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [timeline, setTimeline] = useState<LedgerLifecycleResponse | null>(null);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    // System Ledger State
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

    const [error, setError] = useState('');

    useEffect(() => {
        if (activeTab === 'document') {
            fetchDocuments();
        } else {
            fetchSystemLedger();
        }
    }, [activeTab]);

    const fetchDocuments = async () => {
        setLoadingDocs(true);
        setError('');
        try {
            const docs = await auditorService.getDocuments(0, 200);
            setDocuments(docs);
        } catch {
            setError('Failed to load documents.');
        } finally {
            setLoadingDocs(false);
        }
    };

    const fetchSystemLedger = async () => {
        setLoadingLedger(true);
        setError('');
        try {
            const entries = await auditorService.getFullLedger(0, 200);
            setLedgerEntries(entries);
        } catch {
            setError('Failed to load system ledger.');
        } finally {
            setLoadingLedger(false);
        }
    };

    const loadTimeline = async (docId: number) => {
        setSelectedDocId(docId);
        setLoadingTimeline(true);
        setTimeline(null);
        try {
            const data = await auditorService.getLedgerTimeline(docId);
            setTimeline(data);
        } catch {
            setError('Failed to load document timeline.');
        } finally {
            setLoadingTimeline(false);
        }
    };

    return (
        <div className="fade-in space-y-6">
            {/* Header with Tabs */}
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">⛓️</span>
                            <h1 className="text-3xl font-bold text-white">Ledger Explorer</h1>
                        </div>
                        <p className="text-secondary">Audit immutable system actions and confirm full traceability</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary bg-lime/10 border border-lime/20 px-3 py-2 rounded-lg">
                        <span className="text-lime font-bold">🔒</span>
                        <span>Read-only · Append-only Ledger</span>
                    </div>
                </div>

                <div className="flex gap-1 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`pb-3 px-5 flex items-center gap-2 font-medium text-sm transition-colors ${activeTab === 'system'
                                ? 'text-lime border-b-2 border-lime'
                                : 'text-secondary hover:text-white'
                            }`}
                    >
                        <Database size={16} />
                        System Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('document')}
                        className={`pb-3 px-5 flex items-center gap-2 font-medium text-sm transition-colors ${activeTab === 'document'
                                ? 'text-lime border-b-2 border-lime'
                                : 'text-secondary hover:text-white'
                            }`}
                    >
                        <FileText size={16} />
                        Document Lifecycle
                    </button>
                </div>
            </GlassCard>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 flex items-center gap-3">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* ─────────────── SYSTEM LEDGER TAB ─────────────── */}
            {activeTab === 'system' && (
                <GlassCard>
                    {loadingLedger ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-14 w-14 border-4 border-lime border-t-transparent mx-auto mb-4" />
                                <p className="text-secondary">Loading ledger...</p>
                            </div>
                        </div>
                    ) : ledgerEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <span className="text-5xl mb-4">📭</span>
                            <p className="text-xl text-white mb-1">No records available for audit review.</p>
                            <p className="text-sm text-secondary">The system ledger is empty.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">All System Actions</h2>
                                <span className="text-secondary text-sm">{ledgerEntries.length} entries</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-700 text-secondary text-xs uppercase tracking-wider">
                                            <th className="py-3 px-4 font-semibold">Timestamp</th>
                                            <th className="py-3 px-4 font-semibold">Action</th>
                                            <th className="py-3 px-4 font-semibold">Actor ID</th>
                                            <th className="py-3 px-4 font-semibold">Target ID</th>
                                            <th className="py-3 px-4 font-semibold">Hash</th>
                                            <th className="py-3 px-4 font-semibold text-center">Metadata</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {ledgerEntries.map((entry) => {
                                            const isExpanded = expandedEntry === entry.id;
                                            const isFailed = entry.action?.toString().includes('FAIL') || entry.action?.toString() === 'DISPUTED';
                                            return (
                                                <>
                                                    <tr
                                                        key={entry.id}
                                                        className={`transition-colors cursor-pointer ${isFailed ? 'bg-red-900/10 hover:bg-red-900/15' : 'hover:bg-white/5'
                                                            }`}
                                                        onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                                    >
                                                        <td className="py-3 px-4 text-sm text-secondary font-mono whitespace-nowrap">
                                                            {formatDate(entry.created_at)}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <ActionBadge action={entry.action?.toString() ?? '—'} />
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-lime font-mono text-sm font-bold">#{entry.actor_id}</span>
                                                                <span className="text-secondary text-xs">{entry.actor?.name ?? '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-secondary text-sm font-mono">
                                                            {entry.document_id ? (
                                                                <span className="text-blue-400">Doc #{entry.document_id}</span>
                                                            ) : (
                                                                <span className="opacity-40">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {entry.entry_hash ? (
                                                                <span
                                                                    className="text-xs font-mono text-lime bg-lime/10 px-1.5 py-0.5 rounded cursor-help"
                                                                    title={entry.entry_hash}
                                                                >
                                                                    {entry.entry_hash.substring(0, 8)}…
                                                                </span>
                                                            ) : (
                                                                <span className="text-secondary text-xs">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {entry.entry_metadata && Object.keys(entry.entry_metadata).length > 0 ? (
                                                                <span className={`text-xs text-secondary transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                                                                    ▼
                                                                </span>
                                                            ) : (
                                                                <span className="text-secondary opacity-30 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Metadata Row */}
                                                    {isExpanded && entry.entry_metadata && Object.keys(entry.entry_metadata).length > 0 && (
                                                        <tr key={`${entry.id}-meta`} className="bg-dark/40">
                                                            <td colSpan={6} className="px-8 py-4">
                                                                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">Entry Metadata</p>
                                                                <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-gray-300 overflow-x-auto custom-scrollbar">
                                                                    <pre className="whitespace-pre-wrap break-all">
                                                                        {JSON.stringify(entry.entry_metadata, null, 2)}
                                                                    </pre>
                                                                </div>
                                                                {entry.previous_hash && (
                                                                    <div className="mt-2 text-xs text-secondary">
                                                                        <span className="text-gray-500">Previous Hash: </span>
                                                                        <span className="font-mono">{entry.previous_hash}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </GlassCard>
            )}

            {/* ─────────────── DOCUMENT LIFECYCLE TAB ─────────────── */}
            {activeTab === 'document' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Document List */}
                    <div className="lg:col-span-1">
                        <GlassCard className="h-[calc(100vh-300px)] min-h-[480px] flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-4">Select Document</h3>
                            <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
                                {loadingDocs ? (
                                    <div className="flex justify-center p-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-lime border-t-transparent" />
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-8 opacity-50">
                                        <p className="text-sm text-secondary">No records available for audit review.</p>
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => loadTimeline(doc.id)}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedDocId === doc.id
                                                    ? 'bg-lime/20 border border-lime/50'
                                                    : 'bg-dark/30 hover:bg-dark/50 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-white font-semibold text-sm">{doc.doc_number}</span>
                                                <span className="text-xs text-secondary font-mono">#{doc.id}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs bg-gray-700/80 px-2 py-0.5 rounded text-gray-300">{doc.doc_type}</span>
                                                <span className="text-xs text-secondary">{new Date(doc.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Timeline View */}
                    <div className="lg:col-span-2">
                        <GlassCard className="h-[calc(100vh-300px)] min-h-[480px] flex flex-col">
                            {!selectedDocId ? (
                                <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                    <span className="text-4xl mb-4">⛓️</span>
                                    <p className="text-sm">Select a document to view its audit trail</p>
                                </div>
                            ) : loadingTimeline ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime border-t-transparent" />
                                </div>
                            ) : timeline ? (
                                <>
                                    <div className="flex-shrink-0 border-b border-gray-700 pb-4 mb-4">
                                        <h2 className="text-xl font-bold text-white">{timeline.document_number}</h2>
                                        <p className="text-secondary text-sm">{timeline.document_type}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${timeline.is_sequence_valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {timeline.is_sequence_valid ? '✓ Sequence Valid' : '✗ Sequence Invalid'}
                                            </span>
                                            {timeline.missing_stages.length > 0 && (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-400">
                                                    Missing: {timeline.missing_stages.join(', ')}
                                                </span>
                                            )}
                                            {timeline.duplicate_actions.length > 0 && (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                                                    Duplicates: {timeline.duplicate_actions.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {timeline.lifecycle_events.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                            <p className="text-sm text-secondary">No records available for audit review.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
                                            <div className="flex gap-8 min-w-max pt-4 px-2">
                                                {timeline.lifecycle_events.map((event, idx) => (
                                                    <div key={idx} className="relative w-[320px] flex-shrink-0">
                                                        {idx !== timeline.lifecycle_events.length - 1 && (
                                                            <div className="absolute top-[10px] left-1/2 w-[calc(100%+2rem)] h-0.5 bg-gray-700" />
                                                        )}
                                                        <div
                                                            className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-dark z-10"
                                                            style={{ backgroundColor: event.is_valid ? '#84cc16' : '#ef4444' }}
                                                        />
                                                        <div className={`mt-8 p-4 rounded-xl border ${event.is_valid
                                                                ? 'bg-dark/40 hover:bg-dark/60 border-gray-700/50'
                                                                : 'bg-red-500/10 border-red-500/30'
                                                            } transition-colors`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <ActionBadge action={event.action} />
                                                                <span className="text-xs text-secondary font-mono">
                                                                    {new Date(event.timestamp).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-white text-xs mt-2">
                                                                by <span className="font-semibold">{event.actor_name}</span>
                                                            </p>
                                                            {!event.is_valid && event.validation_notes && (
                                                                <p className="text-red-300 text-xs mt-2 bg-red-500/10 p-2 rounded">
                                                                    ⚠️ {event.validation_notes}
                                                                </p>
                                                            )}
                                                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                                <div className="text-xs text-gray-500 font-mono mt-2 bg-black/20 p-2 rounded overflow-hidden">
                                                                    {Object.entries(event.metadata).slice(0, 2).map(([k, v]) => (
                                                                        <div key={k} className="truncate">
                                                                            <span className="text-gray-600">{k}: </span>
                                                                            {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
}
