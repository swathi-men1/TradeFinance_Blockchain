import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { ledgerService } from '../services/ledgerService';
import { Document } from '../types/document.types';
import { LedgerEntry } from '../types/ledger.types';

export default function DocumentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<Document | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            loadDocument();
            loadLedger();
        }
    }, [id]);

    const loadDocument = async () => {
        try {
            const data = await documentService.getDocumentById(Number(id));
            setDocument(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load document');
        } finally {
            setIsLoading(false);
        }
    };

    const loadLedger = async () => {
        try {
            const data = await ledgerService.getDocumentLedger(Number(id));
            setLedgerEntries(data);
        } catch (err: any) {
            console.error('Failed to load ledger:', err);
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        setVerificationResult(null);
        setError('');

        try {
            const result = await documentService.verifyDocument(Number(id));
            setVerificationResult(result);
            // Reload ledger to show new verification entry
            loadLedger();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400">Loading document...</p>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="glass rounded-2xl p-12 text-center max-w-md">
                    <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
                        ❌
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Document Not Found</h2>
                    <p className="text-slate-400 mb-6">The document you're looking for doesn't exist or you don't have access.</p>
                    <button
                        onClick={() => navigate('/documents')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
                    >
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/documents')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 animate-fade-in-up"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Documents
                </button>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 animate-fade-in-up">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {/* Document Info Card */}
                <div className="glass rounded-2xl p-6 mb-6 animate-fade-in-up">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
                                📄
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{document.doc_number}</h1>
                                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 text-sm font-medium rounded-full border border-cyan-500/30">
                                    {document.doc_type}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Verify Hash
                                </>
                            )}
                        </button>
                    </div>

                    {/* Document Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Document ID</p>
                            <p className="text-white font-medium">#{document.id}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Owner ID</p>
                            <p className="text-white font-medium">{document.owner_id}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Issued Date</p>
                            <p className="text-white font-medium">{new Date(document.issued_at).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Upload Date</p>
                            <p className="text-white font-medium">{new Date(document.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* SHA-256 Hash */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 mb-2">SHA-256 Hash</p>
                        <div className="flex items-center gap-2">
                            <code className="text-cyan-400 font-mono text-sm break-all flex-1">{document.hash}</code>
                            <button
                                onClick={() => navigator.clipboard.writeText(document.hash)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                title="Copy hash"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Verification Result */}
                    {verificationResult && (
                        <div className={`mt-6 p-4 rounded-xl border animate-fade-in-up ${verificationResult.is_valid
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${verificationResult.is_valid ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                    }`}>
                                    {verificationResult.is_valid ? '✅' : '❌'}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${verificationResult.is_valid ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {verificationResult.message}
                                    </p>
                                    {verificationResult.note && (
                                        <p className="text-slate-400 text-sm mt-1">
                                            ℹ️ {verificationResult.note}
                                        </p>
                                    )}
                                    {!verificationResult.is_valid && verificationResult.stored_hash !== verificationResult.current_hash && (
                                        <div className="mt-3 space-y-1 text-sm">
                                            <p className="text-slate-400">
                                                <span className="text-slate-500">Stored:</span>{' '}
                                                <code className="text-red-400 font-mono">{verificationResult.stored_hash}</code>
                                            </p>
                                            <p className="text-slate-400">
                                                <span className="text-slate-500">Current:</span>{' '}
                                                <code className="text-red-400 font-mono">{verificationResult.current_hash}</code>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ledger Timeline */}
                <div className="glass rounded-2xl p-6 animate-fade-in-up stagger-2">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        Ledger Timeline
                    </h2>

                    {ledgerEntries.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">
                                📝
                            </div>
                            <p className="text-slate-400">No ledger entries found</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {ledgerEntries.map((entry, index) => (
                                <div key={entry.id} className="flex gap-4">
                                    {/* Timeline connector */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg shadow-blue-500/30"></div>
                                        {index < ledgerEntries.length - 1 && (
                                            <div className="w-0.5 flex-1 bg-gradient-to-b from-cyan-500/50 to-slate-700 min-h-[60px]"></div>
                                        )}
                                    </div>

                                    {/* Entry content */}
                                    <div className="flex-1 pb-6">
                                        <div className="bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-lg">
                                                        {entry.action}
                                                    </span>
                                                    {entry.actor_id && (
                                                        <span className="text-sm text-slate-500">
                                                            by User #{entry.actor_id}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-500">
                                                    {new Date(entry.created_at).toLocaleString()}
                                                </span>
                                            </div>

                                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                                <div className="mt-2 bg-slate-900/50 rounded-lg p-3">
                                                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono overflow-x-auto">
                                                        {JSON.stringify(entry.metadata, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
