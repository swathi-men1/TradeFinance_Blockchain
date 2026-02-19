/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import auditorService, { LedgerLifecycleResponse, LedgerLifecycleEvent } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';
import { Check, X, User, AlertTriangle, ArrowLeft, Loader2, Link as LinkIcon } from 'lucide-react';

interface Document {
    id: number;
    doc_number: string;
    doc_type: string;
    created_at: string;
}

export default function AuditorLedgerPage() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [timeline, setTimeline] = useState<LedgerLifecycleResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const docs = await auditorService.getDocuments(0, 100);
            setDocuments(docs);
        } catch (err) {
            setError('Failed to load documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadTimeline = async (docId: number) => {
        setSelectedDocId(docId);
        setLoadingTimeline(true);
        setTimeline(null);
        try {
            const data = await auditorService.getLedgerTimeline(docId);
            setTimeline(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load timeline');
        } finally {
            setLoadingTimeline(false);
        }
    };

    return (
        <div className="fade-in space-y-6">
            <ElevatedPanel>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
                            <LinkIcon size={32} className="text-purple-400" />
                            <span>Ledger Lifecycle</span>
                        </h1>
                        <p className="text-secondary">Validate document lifecycle execution and sequence integrity</p>
                    </div>
                    <button onClick={() => navigate('/auditor')} className="btn-secondary flex items-center gap-2">
                        <ArrowLeft size={16} />
                        <span>Back to Console</span>
                    </button>
                </div>
            </ElevatedPanel>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Document List */}
                <div className="lg:col-span-1 space-y-4">
                    <ElevatedPanel className="h-[calc(100vh-180px)] min-h-[500px] flex flex-col">
                        <h3 className="text-xl font-bold text-content-primary mb-4">Select Document</h3>
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-secondary text-center py-4">Loading...</p>
                            ) : (
                                documents.map((doc: Document) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => loadTimeline(doc.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedDocId === doc.id ? 'bg-lime-500/20 border border-lime-500/50' : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-content-primary font-semibold">{doc.doc_number}</span>
                                            <span className="text-xs text-secondary">#{doc.id}</span>
                                        </div>
                                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{doc.doc_type}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </ElevatedPanel>
                </div>

                {/* Timeline View */}
                <div className="lg:col-span-2">
                    <ElevatedPanel className="h-[calc(100vh-180px)] min-h-[500px] flex flex-col">
                        {!selectedDocId ? (
                            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                <LinkIcon size={64} className="mb-4 text-purple-400" />
                                <p>Select a document to view its ledger timeline</p>
                            </div>
                        ) : loadingTimeline ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 size={48} className="animate-spin text-lime" />
                            </div>
                        ) : timeline ? (
                            <>
                                <div className="flex-shrink-0 border-b border-gray-700 pb-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-content-primary">{timeline.document_number}</h2>
                                            <div className="flex gap-3 mt-2">
                                                <span className={`px-2 py-0.5 rounded text-sm flex items-center gap-1 ${timeline.is_sequence_valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {timeline.is_sequence_valid ? <Check size={14} /> : <X size={14} />}
                                                    {timeline.is_sequence_valid ? 'Sequence Valid' : 'Sequence Invalid'}
                                                </span>
                                                {timeline.missing_stages.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded text-sm bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                                        <AlertTriangle size={14} />
                                                        Missing Stages: {timeline.missing_stages.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 p-2">
                                    <div className="flex gap-12 min-w-max pt-4 px-4">
                                        {timeline.lifecycle_events.map((event: LedgerLifecycleEvent, idx: number) => (
                                            <div key={idx} className="relative w-[450px] flex-shrink-0 group">
                                                {/* Connector Line */}
                                                {idx !== timeline.lifecycle_events.length - 1 && (
                                                    <div className="absolute top-[10px] left-1/2 w-[calc(100%+3rem)] h-0.5 bg-gray-700 ml-1"></div>
                                                )}

                                                {/* Dot */}
                                                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-dark z-10 shadow-lg ${event.is_valid ? 'bg-lime-500' : 'bg-red-500'}`}>
                                                </div>

                                                {/* Content Card */}
                                                <div className={`mt-8 p-4 rounded-xl transition-all duration-200 border ${event.is_valid
                                                    ? 'bg-black/40 hover:bg-black/60 border-transparent'
                                                    : 'bg-red-500/10 border-red-500/30'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className={`font-bold text-lg ${event.is_valid ? 'text-content-primary' : 'text-red-400'}`}>
                                                                {event.action}
                                                            </h4>
                                                            <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                                                                <span className="flex items-center gap-1"><User size={14} /> {event.actor_name}</span>
                                                                <span className="text-xs opacity-50 bg-white/10 px-1.5 py-0.5 rounded ml-1">ID: {event.actor_id}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-secondary font-mono bg-black/20 px-2 py-1 rounded">
                                                            {new Date(event.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {!event.is_valid && event.validation_notes && (
                                                        <div className="mb-3 p-2 rounded bg-red-500/20 border-l-2 border-red-500 flex gap-2">
                                                            <AlertTriangle size={16} className="text-red-400" />
                                                            <p className="text-sm text-red-200">{event.validation_notes}</p>
                                                        </div>
                                                    )}

                                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                        <div className="mt-3 bg-[#0d1117] rounded-lg border border-gray-700/50 overflow-hidden shadow-inner">
                                                            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-gray-700/50 select-none">
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Event Details</span>
                                                                <span className="text-[10px] text-gray-600 font-mono">JSON</span>
                                                            </div>
                                                            <div className="p-3 bg-black/20">
                                                                <div className="grid grid-cols-1 gap-y-3">
                                                                    {Object.entries(event.metadata).map(([key, value]: [string, any]) => (
                                                                        <div key={key} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                            <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                                                                                {key.replace(/_/g, ' ')}
                                                                            </span>
                                                                            <div className="overflow-x-auto custom-scrollbar pb-1">
                                                                                <span className="text-sm text-gray-200 font-medium whitespace-pre-wrap font-mono">
                                                                                    {value !== null && value !== undefined
                                                                                        ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))
                                                                                        : '-'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-red-400">Failed to load timeline data</p>
                        )}
                    </ElevatedPanel>
                </div>
            </div>
        </div>
    );
}
