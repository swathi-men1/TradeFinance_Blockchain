import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document, DocumentUpdate } from '../types/document.types';
import { useAuth } from '../context/AuthContext';
import { ledgerService } from '../services/ledgerService';
import { LedgerEntry } from '../types/ledger.types';
import { LedgerTimeline } from '../components/LedgerTimeline';
import { GlassCard } from '../components/GlassCard';
import { formatDateShortIST } from '../utils/dateFormat';
import auditorService, { DocumentVerificationResponse } from '../services/auditorService';

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [verifying, setVerifying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<DocumentUpdate>({});
    const [saving, setSaving] = useState(false);

    // Auditor specific state
    const [verificationResult, setVerificationResult] = useState<DocumentVerificationResponse | null>(null);
    const [flagReason, setFlagReason] = useState('');
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [success, setSuccess] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleVerifyDocument = async () => {
        try {
            setVerifying(true);
            setVerificationResult(null);
            setError('');
            setSuccess('');

            // Use auditor service for auditors, document service for others
            if (user?.role === 'auditor') {
                const result = await auditorService.verifyDocument(parseInt(id!));
                setVerificationResult(result);
                if (result.is_valid) {
                    setSuccess(result.message);
                } else {
                    setError(result.message);
                }
            } else {
                const result = await documentService.verifyDocument(parseInt(id!));
                const statusText = result.is_valid ? 'Verified' : 'Failed';
                alert(`Verification Result: ${statusText}\nMessage: ${result.message || 'Integrity Verified'}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Verification failed');
            if (user?.role !== 'auditor') {
                alert(`Verification Failed: ${err.response?.data?.detail || 'Unknown error'}`);
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleFlag = async () => {
        if (!document || !flagReason.trim()) return;

        try {
            await auditorService.flagDocument(document.id, flagReason);
            setSuccess(`Document ${document.doc_number} flagged for investigation`);
            setShowFlagModal(false);
            setFlagReason('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to flag document');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
        try {
            await documentService.deleteDocument(parseInt(id!));
            navigate('/documents');
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete document');
        }
    };

    useEffect(() => {
        if (id) {
            loadDocument();
            loadLedger();
        }
    }, [id]);

    const loadLedger = async () => {
        try {
            const data = await ledgerService.getDocumentLedger(parseInt(id!));
            setLedgerEntries(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadDocument = async () => {
        try {
            setLoading(true);
            const doc = await documentService.getDocumentById(parseInt(id!));
            setDocument(doc);
            setEditForm({
                doc_number: doc.doc_number,
                doc_type: doc.doc_type,
                issued_at: new Date(doc.issued_at).toISOString().split('T')[0]
            });
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load document');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updatedDoc = await documentService.updateDocument(parseInt(id!), editForm);
            setDocument(updatedDoc);
            setIsEditing(false);
            alert('Document updated successfully');
            // Refresh ledger to show AMENDED action
            loadLedger();
        } catch (err: any) {
            alert(`Update Failed: ${err.response?.data?.detail || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!document) return;
        try {
            await documentService.downloadDocument(document.id);
        } catch (err) {
            alert('Failed to download document');
        }
    };

    const handleViewFile = async () => {
        if (!document) return;
        try {
            await documentService.viewDocument(document.id);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to view document';
            setError(errorMsg);
            console.error('View document error:', err);
        }
    };

    const getDocIcon = (docType: string) => {
        const icons: Record<string, string> = {
            'LOC': '💰',
            'INVOICE': '🧾',
            'BILL_OF_LADING': '📄',
            'PO': '📋',
            'COO': '✅',
            'INSURANCE_CERT': '🛡️'
        };
        return icons[docType] || '📄';
    };

    const formatDocType = (docType: string) => {
        const names: Record<string, string> = {
            'LOC': 'Letter of Credit',
            'INVOICE': 'Commercial Invoice',
            'BILL_OF_LADING': 'Bill of Lading',
            'PO': 'Purchase Order',
            'COO': 'Certificate of Origin',
            'INSURANCE_CERT': 'Insurance Certificate'
        };
        return names[docType] || docType;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-black/60">Loading document...</p>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md bg-white border-gray-300">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-3xl font-bold text-black mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Document Not Found
                    </h2>
                    <p className="text-black/60 mb-6">
                        {error || 'The document you are looking for does not exist'}
                    </p>
                    <button onClick={() => navigate('/documents')} className="btn-primary">
                        Back to Documents
                    </button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-7xl bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
            {/* Header with Breadcrumb */}
            <div className="mb-8">
                <button
                    onClick={() => {
                        if (user?.role === 'bank') navigate('/bank/documents');
                        else if (user?.role === 'auditor') navigate('/auditor/documents');
                        else navigate('/documents');
                    }}
                    className="text-sm font-medium text-black/60 hover:text-black transition-colors mb-6 flex items-center gap-2 group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    <span>Back to Documents</span>
                </button>

                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 rounded-3xl p-8 border border-gray-300 backdrop-blur-sm mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start gap-6 flex-1">
                            {/* Document Icon */}
                            <div className="text-7xl p-4 bg-gray-100 rounded-2xl backdrop-blur-sm border border-gray-300">
                                {getDocIcon(document.doc_type)}
                            </div>
                            
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2">
                                    {formatDocType(document.doc_type)}
                                </p>
                                <h1 className="text-4xl md:text-5xl font-bold text-black mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {document.doc_number}
                                </h1>
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-semibold">
                                        ✓ Active Document
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-xs font-semibold">
                                        🔐 Encrypted
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-end w-full md:w-auto">
                            {user?.role === 'admin' && (
                                <>
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleSave} disabled={saving} 
                                                className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all">
                                                <span>💾 {saving ? 'Saving...' : 'Save'}</span>
                                            </button>
                                            <button onClick={() => setIsEditing(false)} 
                                                className="px-6 py-2.5 rounded-xl font-semibold bg-gray-400 hover:bg-gray-500 text-white transition-all">
                                                ❌ Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsEditing(true)} 
                                                className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2">
                                                <span>✏️</span>
                                                <span>Edit</span>
                                            </button>
                                            <button onClick={handleDelete} 
                                                className="px-6 py-2.5 rounded-xl font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-700 border border-red-400 transition-all flex items-center gap-2">
                                                <span>🗑️</span>
                                                <span>Delete</span>
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                            {user?.role === 'auditor' && (
                                <>
                                    <button
                                        onClick={handleVerifyDocument}
                                        disabled={verifying}
                                        className="px-6 py-2.5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white transition-all flex items-center gap-2"
                                    >
                                        <span>{verifying ? '⏳' : '🔍'}</span>
                                        <span>{verifying ? 'Verifying...' : 'Verify'}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowFlagModal(true)}
                                        className="px-6 py-2.5 rounded-xl font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-700 border border-red-400 transition-all flex items-center gap-2"
                                    >
                                        <span>🚩</span>
                                        <span>Flag</span>
                                    </button>
                                </>
                            )}

                            {!isEditing && (
                                <>
                                    <button onClick={handleViewFile} 
                                        className="px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-2">
                                        <span>👁️</span>
                                        <span>View</span>
                                    </button>
                                    <button onClick={handleDownload} 
                                        className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2">
                                        <span>⬇️</span>
                                        <span>Download</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-3"><span>⚠️</span>{error}</span>
                    <button onClick={() => setError('')} className="hover:text-red-900">✕</button>
                </div>
            )}
            {success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-3"><span>✅</span>{success}</span>
                    <button onClick={() => setSuccess('')} className="hover:text-emerald-900">✕</button>
                </div>
            )}

            {/* Verification Result */}
            {verificationResult && (
                <GlassCard className={`mb-8 border-l-4 ${verificationResult.is_valid ? 'border-l-emerald-600' : 'border-l-red-600'} bg-gradient-to-r ${verificationResult.is_valid ? 'from-emerald-50' : 'from-red-50'} to-transparent border border-gray-300`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{verificationResult.is_valid ? '✅' : '❌'}</span>
                            <div>
                                <h3 className="text-2xl font-bold text-black">Verification Result</h3>
                                <p className={`text-sm font-semibold ${verificationResult.is_valid ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {verificationResult.is_valid ? 'Document Verified' : 'Verification Failed'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setVerificationResult(null)} className="text-gray-600 hover:text-black text-2xl">✕</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                            <p className="text-gray-600 text-xs mb-1">Stored Hash</p>
                            <code className="text-blue-700 text-xs font-mono break-all block">{verificationResult.stored_hash.substring(0, 32)}...</code>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                            <p className="text-gray-600 text-xs mb-1">Current Hash</p>
                            <code className="text-blue-700 text-xs font-mono break-all block">{verificationResult.current_hash.substring(0, 32)}...</code>
                        </div>
                    </div>
                    <p className="text-black mb-4">{verificationResult.message}</p>
                    {!verificationResult.is_valid && (
                        <button onClick={() => setShowFlagModal(true)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all">
                            🚩 Flag for Investigation
                        </button>
                    )}
                </GlassCard>
            )}

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column - Document Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Document Information */}
                    <GlassCard className="border border-gray-300 bg-white">
                        <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                            <span className="text-3xl">📋</span>
                            <span>Document Information</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-black/60 text-xs font-semibold uppercase tracking-wider block mb-2">ID</label>
                                <p className="text-black text-lg font-semibold">#{document.id}</p>
                            </div>
                            <div>
                                <label className="text-black/60 text-xs font-semibold uppercase tracking-wider block mb-2">Number</label>
                                {isEditing ? (
                                    <input type="text" className="input-field w-full bg-white border border-gray-300 rounded-lg text-black" 
                                        value={editForm.doc_number} onChange={(e) => setEditForm({ ...editForm, doc_number: e.target.value })} />
                                ) : (
                                    <p className="text-black text-lg font-semibold">{document.doc_number}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-black/60 text-xs font-semibold uppercase tracking-wider block mb-2">Type</label>
                                {isEditing ? (
                                    <select className="input-field w-full bg-white border border-gray-300 rounded-lg text-black" 
                                        value={editForm.doc_type} onChange={(e) => setEditForm({ ...editForm, doc_type: e.target.value as any })}>
                                        <option value="LOC">💰 Letter of Credit</option>
                                        <option value="INVOICE">🧾 Commercial Invoice</option>
                                        <option value="BILL_OF_LADING">📄 Bill of Lading</option>
                                        <option value="PO">📋 Purchase Order</option>
                                        <option value="COO">✅ Certificate of Origin</option>
                                        <option value="INSURANCE_CERT">🛡️ Insurance Certificate</option>
                                    </select>
                                ) : (
                                    <p className="text-black text-lg font-semibold">{formatDocType(document.doc_type)}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-black/60 text-xs font-semibold uppercase tracking-wider block mb-2">Organization</label>
                                <p className="text-black text-lg font-semibold">{document.owner?.org_name || '—'}</p>
                            </div>
                            <div>
                                <label className="text-black/60 text-xs font-semibold uppercase tracking-wider block mb-2">Issued</label>
                                {isEditing ? (
                                    <input type="date" className="input-field w-full bg-white border border-gray-300 rounded-lg text-black text-sm"
                                        value={editForm.issued_at ? new Date(editForm.issued_at).toISOString().split('T')[0] : ''} 
                                        onChange={(e) => setEditForm({ ...editForm, issued_at: e.target.value })} />
                                ) : (
                                    <p className="text-black text-lg font-semibold">{formatDateShortIST(document.issued_at)}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-black/60 text-xs font-semibold uppercase tracking-wider block mb-2">Uploaded</label>
                                <p className="text-black text-lg font-semibold">{formatDateShortIST(document.created_at)}</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Ledger Hash Chain */}
                    <GlassCard className="border border-gray-300 bg-white">
                        <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                            <span className="text-3xl">🔗</span>
                            <span>Ledger Chain</span>
                            <span className="text-sm bg-blue-100 px-3 py-1 rounded-full text-blue-700 font-semibold ml-auto">
                                {ledgerEntries.length} entries
                            </span>
                        </h2>
                        {ledgerEntries.length > 0 ? (
                            <div className="space-y-3">
                                {ledgerEntries.slice(0, 5).map((entry, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 border border-gray-300 rounded-xl hover:border-blue-300 transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">⛓️</span>
                                                <span className="font-semibold text-black">{entry.action.replace(/_/g, ' ')}</span>
                                                {entry.entry_metadata?.is_valid && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">✓ Valid</span>}
                                            </div>
                                            <span className="text-xs text-black/60">{formatDateShortIST(entry.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-black/60 mb-2">
                                            Actor: {entry.actor ? (
                                                <span className="font-semibold text-black">
                                                    {entry.actor.name}
                                                    {entry.actor.user_code && <span className="text-blue-700"> ({entry.actor.user_code})</span>}
                                                </span>
                                            ) : (
                                                <span>User #{entry.actor_id}</span>
                                            )}
                                        </p>
                                        <code className="text-xs font-mono text-blue-700 break-all">{entry.entry_hash?.substring(0, 24)}...</code>
                                    </div>
                                ))}
                                {ledgerEntries.length > 5 && (
                                    <p className="text-center text-black/60 text-sm py-2">+{ledgerEntries.length - 5} more entries</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-black/60">No ledger entries</div>
                        )}
                    </GlassCard>
                </div>

                {/* Right Column - Hash & File */}
                <div className="space-y-8">
                    {/* Blockchain Verification Badge */}
                    <GlassCard className="border border-blue-300 bg-gradient-to-br from-blue-50 to-emerald-50">
                        <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                            <span>⛓️</span>
                            <span>Blockchain</span>
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                                <p className="text-xs text-black/60 mb-1">SHA-256 Hash</p>
                                <code className="text-blue-700 font-mono text-xs leading-relaxed break-all block">
                                    {document.hash.substring(0, 20)}...{document.hash.substring(-20)}
                                </code>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-center">
                                    <span className="text-2xl">✓</span>
                                    <p className="text-xs text-emerald-700 font-semibold mt-1">Verified</p>
                                </div>
                                <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg text-center">
                                    <span className="text-2xl">🔐</span>
                                    <p className="text-xs text-blue-700 font-semibold mt-1">Encrypted</p>
                                </div>
                                <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg text-center">
                                    <span className="text-2xl">♾️</span>
                                    <p className="text-xs text-purple-700 font-semibold mt-1">Immutable</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* File Access */}
                    <GlassCard className="border border-gray-300 bg-white">
                        <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                            <span>📁</span>
                            <span>File Access</span>
                        </h2>
                        <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">📄</span>
                                <div>
                                    <p className="text-black font-semibold">Secure Document</p>
                                    <p className="text-xs text-black/60">Encrypted storage</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleViewFile} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all">
                            👁️ View File
                        </button>
                    </GlassCard>

                    {/* Access Info */}
                    <div className="p-4 bg-blue-100 border border-blue-300 rounded-xl">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="mt-0.5 text-lg">🔒</span>
                            <span><strong>Access Controlled:</strong> Only authorized users can view this document. All access is logged.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Flag Modal */}
            {showFlagModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <GlassCard className="max-w-md w-full mx-4 border border-red-300 bg-white">
                        <h3 className="text-2xl font-bold text-black mb-2">🚩 Flag Document</h3>
                        <p className="text-black/60 text-sm mb-4">Document: <span className="text-blue-700 font-semibold">{document.doc_number}</span></p>
                        <textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
                            placeholder="Explain why you're flagging this document..." 
                            className="input-field w-full bg-white border border-gray-300 rounded-lg text-black text-sm mb-4"  rows={4} />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setShowFlagModal(false); setFlagReason(''); }} 
                                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-black font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleFlag} disabled={!flagReason.trim()} 
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50">
                                Flag
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
