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
        } catch (err) {
            alert('Failed to view document');
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
                    <p className="text-secondary">Loading document...</p>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Document Not Found
                    </h2>
                    <p className="text-secondary mb-6">
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
        <div className="fade-in max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => {
                        if (user?.role === 'bank') navigate('/bank/documents');
                        else if (user?.role === 'auditor') navigate('/auditor/documents');
                        else navigate('/documents');
                    }}
                    className="text-secondary hover:text-lime transition-colors mb-4 flex items-center gap-2"
                >
                    <span>←</span>
                    <span>Back to Documents</span>
                </button>

                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="text-6xl">{getDocIcon(document.doc_type)}</div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {document.doc_number}
                            </h1>
                            <p className="text-secondary text-lg">
                                {formatDocType(document.doc_type)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {user?.role === 'admin' && (
                            <>
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSave} disabled={saving} className="btn-primary bg-lime text-black hover:bg-white">
                                            <span>💾</span>
                                            <span>{saving ? 'Saving...' : 'Save'}</span>
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="btn-outline">
                                            <span>❌</span>
                                            <span>Cancel</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="btn-outline text-lime border-lime hover:bg-lime hover:text-black">
                                            <span>✏️</span>
                                            <span>Edit</span>
                                        </button>
                                        <button onClick={handleDelete} className="btn-outline text-red-400 border-red-400 hover:bg-red-400 hover:text-white">
                                            <span>🗑️</span>
                                            <span>Delete</span>
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Auditor Actions */}
                        {user?.role === 'auditor' && (
                            <>
                                <button
                                    onClick={handleVerifyDocument}
                                    disabled={verifying}
                                    className="btn-primary"
                                >
                                    {verifying ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                            Verifying...
                                        </span>
                                    ) : (
                                        <>
                                            <span>🔍</span>
                                            <span>Verify</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowFlagModal(true)}
                                    className="btn-outline text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                                >
                                    <span>🚩</span>
                                    <span>Flag</span>
                                </button>
                            </>
                        )}

                        {!isEditing && (
                            <>
                                <button onClick={handleViewFile} className="btn-outline text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-black">
                                    <span>👁️</span>
                                    <span>View File</span>
                                </button>
                                <button onClick={handleDownload} className="btn-primary">
                                    <span>⬇️</span>
                                    <span>Download</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>


            {/* Notifications */}
            {
                error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 mb-6 flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="text-sm hover:text-white">✕</button>
                    </div>
                )
            }
            {
                success && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 mb-6 flex justify-between items-center">
                        <span>{success}</span>
                        <button onClick={() => setSuccess('')} className="text-sm hover:text-white">✕</button>
                    </div>
                )
            }

            {/* Verification Result Card */}
            {
                verificationResult && (
                    <GlassCard className={`mb-8 border-l-4 ${verificationResult.is_valid ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Verification Result
                            </h3>
                            <button onClick={() => setVerificationResult(null)} className="text-secondary hover:text-white">✕</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-secondary text-sm">Document ID</p>
                                <p className="text-white font-semibold">{verificationResult.document_id}</p>
                            </div>
                            <div>
                                <p className="text-secondary text-sm">Status</p>
                                <p className={`font-semibold ${verificationResult.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                                    {verificationResult.is_valid ? '✓ VERIFIED' : '✗ FAILED'}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-secondary text-sm">Stored Hash</p>
                                <p className="text-white font-mono text-xs break-all bg-dark/30 p-2 rounded">{verificationResult.stored_hash}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-secondary text-sm">Current Hash</p>
                                <p className="text-white font-mono text-xs break-all bg-dark/30 p-2 rounded">{verificationResult.current_hash}</p>
                            </div>
                        </div>
                        <p className="text-white mb-4">{verificationResult.message}</p>

                        {!verificationResult.is_valid && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowFlagModal(true)}
                                    className="btn-primary bg-red-600 hover:bg-red-700"
                                >
                                    🚩 Flag for Investigation
                                </button>
                            </div>
                        )}
                    </GlassCard>
                )
            }

            {/* Document Metadata Card */}
            <GlassCard className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span>📋</span>
                    <span>Document Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="text-muted text-sm block mb-1">Document ID</label>
                        <p className="text-white font-semibold">#{document.id}</p>
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Document Number</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="input-field w-full"
                                value={editForm.doc_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, doc_number: e.target.value })}
                            />
                        ) : (
                            <p className="text-white font-semibold">{document.doc_number}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Document Type</label>
                        {isEditing ? (
                            <select
                                className="input-field w-full"
                                value={editForm.doc_type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm({ ...editForm, doc_type: e.target.value as any })}
                                style={{ color: 'white' }}
                            >
                                <option value="LOC" style={{ color: '#1a1a2e' }}>💰 Letter of Credit</option>
                                <option value="INVOICE" style={{ color: '#1a1a2e' }}>🧾 Commercial Invoice</option>
                                <option value="BILL_OF_LADING" style={{ color: '#1a1a2e' }}>📄 Bill of Lading</option>
                                <option value="PO" style={{ color: '#1a1a2e' }}>📋 Purchase Order</option>
                                <option value="COO" style={{ color: '#1a1a2e' }}>✅ Certificate of Origin</option>
                                <option value="INSURANCE_CERT" style={{ color: '#1a1a2e' }}>🛡️ Insurance Certificate</option>
                            </select>
                        ) : (
                            <p className="text-white font-semibold">{formatDocType(document.doc_type)}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Owner Organization</label>
                        <p className="text-white font-semibold">{document.owner?.org_name || 'Unknown'}</p>
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Issued Date</label>
                        {isEditing ? (
                            <input
                                type="date"
                                className="input-field w-full"
                                value={editForm.issued_at ? new Date(editForm.issued_at).toISOString().split('T')[0] : ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, issued_at: e.target.value })}
                            />
                        ) : (
                            <p className="text-white font-semibold">
                                {formatDateShortIST(document.issued_at)}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Upload Date</label>
                        <p className="text-white font-semibold">
                            {formatDateShortIST(document.created_at)}
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Blockchain Verification */}
            <GlassCard className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span>⛓️</span>
                    <span>Blockchain Verification</span>
                </h2>

                <div className="space-y-6">
                    {/* SHA-256 Hash */}
                    <div>
                        <label className="text-muted text-sm block mb-2">Document Hash (SHA-256)</label>
                        <div className="glass-card-flat">
                            <code className="text-mono text-sm text-lime break-all block">
                                {document.hash}
                            </code>
                        </div>
                        <p className="text-xs text-muted mt-2">
                            This unique cryptographic hash ensures document integrity on the blockchain
                        </p>
                    </div>

                    {/* Verification Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card-flat text-center">
                            <div className="text-4xl mb-2">⛓️</div>
                            <p className="text-white font-semibold mb-1">Blockchain</p>
                            <p className="text-success text-sm font-semibold">✓ Verified</p>
                        </div>

                        <div className="glass-card-flat text-center">
                            <div className="text-4xl mb-2">🔐</div>
                            <p className="text-white font-semibold mb-1">Encryption</p>
                            <p className="text-lime text-sm font-semibold">SHA-256</p>
                        </div>

                        <div className="glass-card-flat text-center">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="text-white font-semibold mb-1">Status</p>
                            <p className="text-success text-sm font-semibold">Immutable</p>
                        </div>
                    </div>

                    {/* Verify Button for Banks and Admins */}
                    {(user?.role === 'bank' || user?.role === 'admin') && (
                        <div className="pt-4 border-t border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                            <button
                                onClick={handleVerifyDocument}
                                disabled={verifying}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner spinner-small" style={{ borderTopColor: 'var(--bg-primary)' }} />
                                        Verifying...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>🔍</span>
                                        <span>Run Verification</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Ledger Hash Chain Timeline */}
            <GlassCard className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span>🔗</span>
                    <span>Ledger Hash Chain</span>
                </h2>

                {ledgerEntries.length > 0 ? (
                    <LedgerTimeline entries={ledgerEntries.map(entry => ({
                        id: entry.id,
                        action: entry.action,
                        actor: entry.actor_id ? `User #${entry.actor_id}` : 'System',
                        timestamp: entry.created_at,
                        previousHash: entry.previous_hash || '',
                        entryHash: entry.entry_hash || '',
                        isValid: entry.entry_metadata?.is_valid
                    }))} />
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">⛓️</div>
                        <p className="text-secondary">
                            No ledger entries found for this document
                        </p>
                    </div>
                )}
            </GlassCard>

            {/* File Access */}
            <GlassCard>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span>📁</span>
                    <span>File Access</span>
                </h2>

                <div className="glass-card-flat">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">📄</div>
                            <div>
                                <p className="text-white font-semibold text-lg">Document File</p>
                                <p className="text-secondary text-sm">Securely stored and encrypted</p>
                            </div>
                        </div>

                        <button onClick={handleViewFile} className="btn-outline">
                            <span>👁️</span>
                            <span>View File</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 alert alert-info">
                    <span className="text-2xl">🔒</span>
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Access Control</p>
                        <p>Only authorized users can view and download this document. All access is logged and recorded on the blockchain for audit purposes.</p>
                    </div>
                </div>
            </GlassCard>

            {/* Flag Modal */}
            {
                showFlagModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <GlassCard className="max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-4">
                                Flag Document for Investigation
                            </h3>
                            <p className="text-secondary mb-4">
                                Document: {document.doc_number}
                            </p>
                            <textarea
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                                placeholder="Enter reason for flagging this document..."
                                className="input-field w-full mb-4"
                                rows={4}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowFlagModal(false);
                                        setFlagReason('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFlag}
                                    disabled={!flagReason.trim()}
                                    className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                >
                                    Flag Document
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                )
            }
        </div >
    );
}
