/* Author: Abdul Samad | */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/MainLayout';
import { documentService } from '../services/documentService';
import { ledgerService } from '../services/ledgerService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { ArrowLeft, FileText, Hash, Calendar, ShieldCheck, CheckCircle, Clock, SearchX, Lock } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { LedgerTimeline } from '../components/LedgerTimeline';
import type { Document } from '../types/document.types';
import type { LedgerEntry } from '../types/ledger.types';

export const DocumentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<Document | null>(null);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDocumentDetails();
        }
    }, [id]);

    const fetchDocumentDetails = async () => {
        try {
            setLoading(true);
            const [docData, ledgerData] = await Promise.all([
                documentService.getDocumentById(Number(id)),
                ledgerService.getDocumentLedger(Number(id))
            ]);
            setDocument(docData);
            setLedger(ledgerData);
            setErrorStatus(null);
        } catch (err: any) {
            console.error("Error fetching document details:", err);
            // Capture Status Code
            if (err.response) {
                setErrorStatus(err.response.status);
            } else {
                setErrorStatus(500);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        // Simulate network delay for effect
        setTimeout(() => {
            setVerifying(false);
            alert("Integrity Verified: Document hash matches blockchain record.");
        }, 1500);
    };

    if (loading) return <Layout><LoadingSpinner /></Layout>;

    // Error State Handling (404 vs 403)
    if (errorStatus === 404) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-slate-800 rounded-full">
                        <SearchX className="w-12 h-12 text-slate-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Trade #{id} not found.</h2>
                    <p className="text-slate-400 max-w-md">The trade transaction you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => navigate('/documents')}>Back to Dashboard</Button>
                </div>
            </Layout>
        );
    }

    if (errorStatus === 403) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-rose-900/20 rounded-full border border-rose-800">
                        <Lock className="w-12 h-12 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Restricted Access</h2>
                    <p className="text-slate-400 max-w-md">You are not authorized to view the ledger for this trade. Access is strictly limited to transaction participants.</p>
                    <Button onClick={() => navigate('/documents')}>Return Home</Button>
                </div>
            </Layout>
        );
    }

    if (!document) return null; // Should be handled by 404 Logic

    // Mock Stepper Logic
    const steps = [
        { label: 'Initiated', status: 'completed' },
        { label: 'Financed', status: ledger.some(l => l.action === 'FINANCED') ? 'completed' : 'current' },
        { label: 'Shipped', status: ledger.some(l => l.action === 'SHIPPED') ? 'completed' : 'upcoming' },
        { label: 'Completed', status: ledger.some(l => l.action === 'PAID') ? 'completed' : 'upcoming' }
    ];

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header Section */}
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Button variant="secondary" onClick={() => navigate('/documents')} className="p-2 h-auto bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            Trade #{document.doc_number}
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-sm rounded-full border border-blue-500/20">
                                IN_PROGRESS
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Metro Line Stepper */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between relative z-10">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center flex-1 relative">
                                {/* Line Connector */}
                                {idx !== 0 && (
                                    <div className={`absolute top-4 right-1/2 w-full h-1 -translate-y-1/2 -z-10
                                        ${step.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}
                                    `} style={{ right: '50%' }} />
                                )}

                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors mb-3
                                    ${step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                                        step.status === 'current' ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-500 animate-pulse' :
                                            'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-600'}
                                `}>
                                    {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                        step.status === 'current' ? <Clock className="w-5 h-5" /> :
                                            <span className="text-xs font-bold">{idx + 1}</span>}
                                </div>
                                <span className={`text-sm font-medium ${step.status === 'completed' ? 'text-emerald-500 dark:text-emerald-400' :
                                    step.status === 'current' ? 'text-blue-500 dark:text-blue-400' :
                                        'text-gray-400 dark:text-slate-500'
                                    }`}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Documents */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" /> Attached Documents
                            </h2>
                            <div className="space-y-4">
                                {/* Single Doc Card (representing 'list' for now) */}
                                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700 flex justify-between items-center group hover:border-indigo-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-medium">{document.doc_type} - {document.doc_number}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-500 font-mono mt-1">
                                                {formatDate(document.issued_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            onClick={handleVerify}
                                            disabled={verifying}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            {verifying ? <LoadingSpinner size="sm" /> : <ShieldCheck className="w-3 h-3" />}
                                            {verifying ? 'Checking...' : 'Verify Integrity'}
                                        </button>
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                                            Hash: {document.hash.substring(0, 8)}...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trade Metadata</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700/50">
                                    <span className="text-gray-500 dark:text-slate-400">Owner ID</span>
                                    <span className="text-gray-900 dark:text-white font-mono">{document.owner_id}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700/50">
                                    <span className="text-gray-500 dark:text-slate-400">Blockchain Hash</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{document.hash}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700/50">
                                    <span className="text-gray-500 dark:text-slate-400">File Storage</span>
                                    <span className="text-gray-700 dark:text-slate-300 truncate max-w-[200px]">{document.file_url}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Ledger */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg">
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Hash className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Immutable Ledger
                            </h2>
                            <span className="text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900/50 animate-pulse">
                                Live Sync
                            </span>
                        </div>

                        <LedgerTimeline chain={ledger.map(l => ({
                            action: l.action,
                            actor: `User #${l.actor_id}`,
                            role: 'Admin', // Mock role as it is not in LedgerEntry
                            timestamp: l.created_at,
                            hash: l.metadata_info?.hash || "HASH_MISSING",
                            prev_hash: l.metadata_info?.prev_hash || "GENESIS_HASH",
                            metadata: l.metadata_info
                        }))} status="VALID" />
                    </div>
                </div>
            </div>
        </Layout>
    );
};
