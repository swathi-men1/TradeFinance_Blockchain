/* Author: Abdul Samad | */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout/MainLayout';
import { apiClient } from '../services/api';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { LedgerTimeline } from '../components/LedgerTimeline';
import { useSafeFetch } from '../hooks/useSafeFetch';

interface ChainItem {
    action: string;
    actor: string;
    role: string;
    timestamp: string;
    hash: string;
    prev_hash: string;
    metadata?: any;
}

interface LedgerResponse {
    document_status: string; // VALID or TAMPERED
    integrity_checked_at: string;
    chain: ChainItem[];
}

export const Ledger = () => {
    const { id } = useParams<{ id: string }>();
    const { execute: fetchLedger, data, loading } = useSafeFetch<LedgerResponse>();
    const [verifying, setVerifying] = useState(false);
    const [showTamperModal, setShowTamperModal] = useState<any>(null);

    useEffect(() => {
        if (id) {
            console.log("DEBUG: Fetching Ledger for Doc", id);
            fetchLedger(() => apiClient.get<LedgerResponse>(`/ledger/document/${id}`));
        }
    }, [id]);

    const triggerRefresh = () => {
        if (id) fetchLedger(() => apiClient.get<LedgerResponse>(`/ledger/document/${id}`));
    };

    const handleVerifyIntegrity = async () => {
        setVerifying(true);
        try {
            const response = await apiClient.post(`/ledger/document/${id}/verify-integrity`);
            const result = response.data;

            if (result.status === 'VERIFIED') {
                alert("Integrity Verified! File hash matches the blockchain record.");
            } else {
                setShowTamperModal(result);
            }
            // Refresh to update status
            triggerRefresh();
        } catch (error) {
            console.error("Verification failed", error);
            alert("Verification process failed. See console.");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return <Layout><div className="p-8 text-center">Loading Immutable Ledger...</div></Layout>;
    if (!data) return <Layout><div className="p-8 text-center">Ledger not found or access denied.</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Section */}
                <div className={`p-6 rounded-2xl border flex items-center justify-between
                    ${data.document_status === 'TAMPERED'
                        ? 'bg-red-50 border-red-200'
                        : data.document_status === 'VALID'
                            ? 'bg-emerald-50 border-emerald-200' // Green for Verified
                            : 'bg-blue-50 border-blue-200'} // Blue for Pending/Other
                `}>
                    <div>
                        <h1 className={`text-2xl font-bold flex items-center gap-3
                            ${data.document_status === 'TAMPERED' ? 'text-red-700' :
                                data.document_status === 'VALID' ? 'text-emerald-800' : 'text-blue-800'}
                        `}>
                            {data.document_status === 'TAMPERED' ? (
                                <><ShieldAlert className="w-8 h-8" /> COMPROMISED DOCUMENT</>
                            ) : data.document_status === 'VALID' ? (
                                <><ShieldCheck className="w-8 h-8 text-emerald-600" /> VERIFIED SECURE</>
                            ) : (
                                <><ShieldCheck className="w-8 h-8 text-blue-600" /> PENDING VERIFICATION</>
                            )}
                        </h1>
                        <p className={`text-sm mt-1 font-medium
                             ${data.document_status === 'TAMPERED' ? 'text-red-600' : 'text-gray-500'}
                        `}>
                            Chain of Custody for Document #{id} • Last Checked: {new Date(data.integrity_checked_at).toLocaleString()}
                        </p>
                    </div>

                    <button
                        onClick={handleVerifyIntegrity}
                        disabled={verifying}
                        className={`px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2
                            ${data.document_status === 'TAMPERED'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200'}
                        `}
                    >
                        {verifying ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <ShieldCheck className="w-5 h-5" />
                        )}
                        {verifying ? 'Verifying...' : 'Verify Integrity'}
                    </button>
                </div>

                {/* Timeline */}
                <LedgerTimeline chain={data.chain} status={data.document_status} />

                {/* Tamper Modal */}
                {showTamperModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border-2 border-red-100 animate-in fade-in zoom-in duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <ShieldAlert className="w-8 h-8 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">CRITICAL INTEGRITY FAILURE</h2>
                                <p className="text-gray-600 mb-6">
                                    The physical file on the server does NOT match the cryptographic hash stored on the blockchain.
                                </p>

                                <div className="w-full bg-red-50 p-4 rounded-xl border border-red-100 mb-6 text-left space-y-3">
                                    <div>
                                        <span className="text-xs font-bold text-red-600 uppercase">Expected Hash</span>
                                        <code className="block text-xs font-mono break-all text-red-800">{showTamperModal.evidence?.expected_hash}</code>
                                    </div>
                                    <div className="border-t border-red-200 pt-2">
                                        <span className="text-xs font-bold text-red-600 uppercase">Found Hash</span>
                                        <code className="block text-xs font-mono break-all text-red-800">{showTamperModal.evidence?.found_hash}</code>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowTamperModal(null)}
                                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/audit-logs'}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-200"
                                    >
                                        Report to Audit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
