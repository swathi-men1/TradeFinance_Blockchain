import { useState, useEffect } from 'react';
import auditorService, { LedgerLifecycleResponse, LedgerEntry } from '../services/auditorService';
import { FileText, Database } from 'lucide-react';

interface DocumentSlim {
    id: number;
    doc_number: string;
    doc_type: string;
    created_at: string;
}

const ACTION_COLOR: Record<string, { bg: string; text: string; border: string }> = {
    TRADE_CREATED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    DOCUMENT_UPLOADED: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    VERIFIED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    STATUS_UPDATED: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
    DISPUTED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    AMENDED: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    SYSTEM_CHECK: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    ISSUED: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
    SHIPPED: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
    RECEIVED: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
    PAID: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
};

function ActionBadge({ action }: { action: string }) {
    const cfg = ACTION_COLOR[action] ?? { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} font-mono`}>
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
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-full mx-auto relative z-10">
                {/* Header with Tabs */}
                <div className="bg-white border-2 border-gray-200 rounded-[28px] p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">⛓️</span>
                                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Ledger Explorer</h1>
                            </div>
                            <p className="text-gray-600">
                                Audit immutable system actions and confirm full traceability
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-blue-100 border-2 border-blue-300 text-blue-700 px-4 py-2 rounded-lg font-bold">
                            <span>🔒</span>
                            <span>Read-only · Append-only</span>
                        </div>
                    </div>

                    <div className="flex gap-1 border-b-2 border-gray-300">
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`pb-3 px-5 flex items-center gap-2 font-medium text-sm transition-colors ${activeTab === 'system'
                                    ? 'text-blue-700 border-b-2 border-blue-700'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <Database size={16} />
                            System Ledger
                        </button>
                        <button
                            onClick={() => setActiveTab('document')}
                            className={`pb-3 px-5 flex items-center gap-2 font-medium text-sm transition-colors ${activeTab === 'document'
                                    ? 'text-blue-700 border-b-2 border-blue-700'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <FileText size={16} />
                            Document Lifecycle
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700 flex items-center gap-3 mb-6">
                        <span>⚠️</span> {error}
                        <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 opacity-70 hover:opacity-100">✕</button>
                    </div>
                )}

                {/* ─────────────── SYSTEM LEDGER TAB ─────────────── */}
                {activeTab === 'system' && (
                    <div className="bg-white border-2 border-gray-200 rounded-[28px] overflow-hidden">
                        {loadingLedger ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="spinner mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">Loading ledger...</p>
                                </div>
                            </div>
                        ) : ledgerEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <span className="text-5xl mb-4">📭</span>
                                <p className="text-xl text-gray-800 mb-1">No records available for audit review.</p>
                                <p className="text-sm text-gray-600">The system ledger is empty.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between p-6 border-b-2 border-gray-300 bg-gray-50">
                                    <h2 className="text-lg font-bold text-gray-800">All System Actions</h2>
                                    <span className="text-gray-600 text-sm font-medium">{ledgerEntries.length} entries</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-300 bg-gray-50 text-gray-800 text-xs uppercase tracking-wider">
                                                <th className="py-3 px-6 font-bold">Timestamp</th>
                                                <th className="py-3 px-6 font-bold">Action</th>
                                                <th className="py-3 px-6 font-bold">Actor ID</th>
                                                <th className="py-3 px-6 font-bold">Target ID</th>
                                                <th className="py-3 px-6 font-bold">Hash</th>
                                                <th className="py-3 px-6 font-bold text-center">Metadata</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-300">
                                            {ledgerEntries.map((entry) => {
                                                const isExpanded = expandedEntry === entry.id;
                                                const isFailed = entry.action?.toString().includes('FAIL') || entry.action?.toString() === 'DISPUTED';
                                                return (
                                                    <>
                                                        <tr
                                                            key={entry.id}
                                                            className={`transition-colors cursor-pointer ${isFailed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'
                                                                }`}
                                                            onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                                        >
                                                            <td className="py-3 px-6 text-sm text-gray-800 font-mono whitespace-nowrap">
                                                                {formatDate(entry.created_at)}
                                                            </td>
                                                            <td className="py-3 px-6">
                                                                <ActionBadge action={entry.action?.toString() ?? '—'} />
                                                            </td>
                                                            <td className="py-3 px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-blue-700 font-mono text-sm font-bold">#{entry.actor_id}</span>
                                                                    <span className="text-gray-600 text-xs">{entry.actor?.name ?? '—'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-6 text-gray-700 text-sm font-mono">
                                                                {entry.document_id ? (
                                                                    <span className="text-blue-600 font-bold">Doc #{entry.document_id}</span>
                                                                ) : (
                                                                    <span className="opacity-40">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-6">
                                                                {entry.entry_hash ? (
                                                                    <span
                                                                        className="text-xs font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded cursor-help"
                                                                        title={entry.entry_hash}
                                                                    >
                                                                        {entry.entry_hash.substring(0, 8)}…
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600 text-xs">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-6 text-center">
                                                                {entry.entry_metadata && Object.keys(entry.entry_metadata).length > 0 ? (
                                                                    <span className={`text-gray-600 transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                                                                        ▼
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-500 opacity-30 text-xs">—</span>
                                                                )}
                                                            </td>
                                                        </tr>

                                                        {/* Expanded Metadata Row */}
                                                        {isExpanded && entry.entry_metadata && Object.keys(entry.entry_metadata).length > 0 && (
                                                            <tr key={`${entry.id}-meta`} className="bg-gray-50">
                                                                <td colSpan={6} className="px-8 py-4">
                                                                    <p className="text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Entry Metadata</p>
                                                                    <div className="bg-gray-200 rounded-lg p-3 font-mono text-xs text-gray-800 overflow-x-auto">
                                                                        <pre className="whitespace-pre-wrap break-all">
                                                                            {JSON.stringify(entry.entry_metadata, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                    {entry.previous_hash && (
                                                                        <div className="mt-2 text-xs text-gray-700">
                                                                            <span className="text-gray-600">Previous Hash: </span>
                                                                            <span className="font-mono text-blue-600">{entry.previous_hash}</span>
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
                    </div>
                )}

                {/* ─────────────── DOCUMENT LIFECYCLE TAB ─────────────── */}
                {activeTab === 'document' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Document List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border-2 border-gray-200 rounded-[28px] h-[calc(100vh-300px)] min-h-[480px] flex flex-col overflow-hidden">
                                <div className="p-6 border-b-2 border-gray-300 bg-gray-50">
                                    <h3 className="text-lg font-bold text-gray-800">Select Document</h3>
                                </div>
                                <div className="overflow-y-auto flex-1 space-y-2 px-6 py-4">
                                    {loadingDocs ? (
                                        <div className="flex justify-center p-4">
                                            <div className="spinner" />
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <div className="text-center py-8 opacity-50">
                                            <p className="text-sm text-gray-600">No records available for audit review.</p>
                                        </div>
                                    ) : (
                                        documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                onClick={() => loadTimeline(doc.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${selectedDocId === doc.id
                                                        ? 'bg-blue-50 border-blue-300 shadow-md shadow-blue-200'
                                                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-gray-800 font-semibold text-sm">{doc.doc_number}</span>
                                                    <span className="text-xs text-gray-600 font-mono">#{doc.id}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-700 font-medium border border-blue-200">{doc.doc_type}</span>
                                                    <span className="text-xs text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timeline View */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border-2 border-gray-200 rounded-[28px] h-[calc(100vh-300px)] min-h-[480px] flex flex-col overflow-hidden">
                                {!selectedDocId ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                        <span className="text-4xl mb-4">⛓️</span>
                                        <p className="text-sm">Select a document to view its audit trail</p>
                                    </div>
                                ) : loadingTimeline ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="spinner" />
                                    </div>
                                ) : timeline ? (
                                    <>
                                        <div className="flex-shrink-0 border-b-2 border-gray-300 p-6 bg-gray-50">
                                            <h2 className="text-xl font-bold text-gray-800">{timeline.document_number}</h2>
                                            <p className="text-gray-600 text-sm">{timeline.document_type}</p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${timeline.is_sequence_valid ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                                                    {timeline.is_sequence_valid ? '✓ Sequence Valid' : '✗ Sequence Invalid'}
                                                </span>
                                                {timeline.missing_stages.length > 0 && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-300">
                                                        Missing: {timeline.missing_stages.join(', ')}
                                                    </span>
                                                )}
                                                {timeline.duplicate_actions.length > 0 && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300">
                                                        Duplicates: {timeline.duplicate_actions.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {timeline.lifecycle_events.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                                <p className="text-sm text-gray-600">No records available for audit review.</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 overflow-x-auto pb-4 px-6 py-4">
                                                <div className="flex gap-8 min-w-max">
                                                    {timeline.lifecycle_events.map((event, idx) => (
                                                        <div key={idx} className="relative w-[320px] flex-shrink-0">
                                                            {idx !== timeline.lifecycle_events.length - 1 && (
                                                                <div className="absolute top-[10px] left-1/2 w-[calc(100%+2rem)] h-0.5 bg-gray-400" />
                                                            )}
                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white z-10"
                                                                style={{ backgroundColor: event.is_valid ? '#10b981' : '#ef4444' }}
                                                            />
                                                            <div className={`mt-8 p-4 rounded-xl border-2 ${event.is_valid
                                                                    ? 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                                                                    : 'bg-red-50 border-red-300'
                                                                } transition-colors`}>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <ActionBadge action={event.action} />
                                                                    <span className="text-xs text-gray-600 font-mono">
                                                                        {new Date(event.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-800 text-xs mt-2">
                                                                    by <span className="font-semibold">{event.actor_name}</span>
                                                                </p>
                                                                {!event.is_valid && event.validation_notes && (
                                                                    <p className="text-red-700 text-xs mt-2 bg-red-100 p-2 rounded border border-red-300">
                                                                        ⚠️ {event.validation_notes}
                                                                    </p>
                                                                )}
                                                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                                    <div className="text-xs text-gray-700 font-mono mt-2 bg-gray-100 p-2 rounded overflow-hidden border border-gray-300">
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
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
