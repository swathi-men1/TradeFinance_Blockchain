import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document } from '../types/document.types';
import { useAuth } from '../context/AuthContext';
import { ledgerService } from '../services/ledgerService';
import { LedgerEntry } from '../types/ledger.types';

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [verifying, setVerifying] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleVerifyDocument = async () => {
        try {
            setVerifying(true);
            const result = await documentService.verifyDocument(parseInt(id!));
            alert(`Verification Result: ${result.status}\nMessage: ${result.message || 'Integrity Verified'}`);
        } catch (err: any) {
            alert(`Verification Failed: ${err.response?.data?.detail || 'Unknown error'}`);
        } finally {
            setVerifying(false);
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
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load document');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (document?.file_url) {
            window.open(document.file_url, '_blank');
        }
    };

    const getDocIcon = (docType: string) => {
        const icons: Record<string, string> = {
            'LOC': '💰',
            'INVOICE': '🚢',
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
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-secondary">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="modern-card text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Document Not Found
                    </h2>
                    <p className="text-secondary mb-6">
                        {error || 'The document you are looking for does not exist'}
                    </p>
                    <button onClick={() => navigate('/documents')} className="btn-lime">
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/documents')}
                        className="text-lime hover:underline mb-4 flex items-center gap-2"
                    >
                        ← Back to Documents
                    </button>
                    <div className="flex items-start justify-between">
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
                        <button
                            onClick={handleDownload}
                            className="btn-lime"
                        >
                            ⬇️ Download
                        </button>
                    </div>
                </div>

                {/* Document Details Card */}
                <div className="modern-card-lime mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Document Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-muted text-sm">Document ID</label>
                            <p className="text-white font-semibold mt-1">#{document.id}</p>
                        </div>
                        <div>
                            <label className="text-muted text-sm">Document Number</label>
                            <p className="text-white font-semibold mt-1">{document.doc_number}</p>
                        </div>
                        <div>
                            <label className="text-muted text-sm">Document Type</label>
                            <p className="text-white font-semibold mt-1">{formatDocType(document.doc_type)}</p>
                        </div>
                        <div>
                            <label className="text-muted text-sm">Owner ID</label>
                            <p className="text-white font-semibold mt-1">User #{document.owner_id}</p>
                        </div>
                        <div>
                            <label className="text-muted text-sm">Issued Date</label>
                            <p className="text-white font-semibold mt-1">
                                {new Date(document.issued_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div>
                            <label className="text-muted text-sm">Upload Date</label>
                            <p className="text-white font-semibold mt-1">
                                {new Date(document.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Blockchain Information */}
                <div className="modern-card mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Blockchain Verification
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-muted text-sm">Document Hash (SHA-256)</label>
                            <div className="mt-2 p-4 bg-dark-elevated rounded-xl">
                                <code className="text-lime text-sm break-all font-mono">
                                    {document.hash}
                                </code>
                            </div>
                            <p className="text-xs text-muted mt-2">
                                This unique cryptographic hash ensures document integrity on the blockchain
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="modern-card bg-dark-elevated text-center">
                                <div className="text-3xl mb-2">⛓️</div>
                                <p className="text-white font-semibold">Blockchain</p>
                                <p className="text-lime text-sm">Verified</p>
                            </div>
                            <div className="modern-card bg-dark-elevated text-center">
                                <div className="text-3xl mb-2">🔐</div>
                                <p className="text-white font-semibold">Encrypted</p>
                                <p className="text-lime text-sm">256-bit AES</p>
                            </div>
                            <div className="modern-card bg-dark-elevated text-center">
                                <div className="text-3xl mb-2">✅</div>
                                <p className="text-white font-semibold">Immutable</p>
                                <p className="text-lime text-sm">Tamper-Proof</p>
                            </div>
                        </div>

                        {/* Hash Chain Visualizer */}
                        <div className="mt-8 border-t border-border-dark pt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Ledger Hash Chain</h3>
                            <div className="relative border-l-2 border-lime ml-4 space-y-8">
                                {ledgerEntries.map((entry) => (
                                    <div key={entry.id} className="relative pl-8">
                                        <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-lime border-4 border-dark"></div>
                                        <div className="bg-dark-elevated p-4 rounded-lg border border-border-dark">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-white">{entry.action}</span>
                                                <span className="text-xs text-secondary">{new Date(entry.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs font-mono space-y-1">
                                                <div className="flex gap-2">
                                                    <span className="text-secondary w-20">Prev Hash:</span>
                                                    <span className="text-lime/70 truncate w-48" title={entry.previous_hash || 'Genesis'}>
                                                        {entry.previous_hash ? `${entry.previous_hash.substring(0, 16)}...` : 'Genesis'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-secondary w-20">Entry Hash:</span>
                                                    <span className="text-white truncate w-48" title={entry.entry_hash || 'Pending'}>
                                                        {entry.entry_hash ? `${entry.entry_hash.substring(0, 16)}...` : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {ledgerEntries.length === 0 && (
                                    <p className="text-secondary pl-8">No ledger entries found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Information */}
                <div className="modern-card">
                    <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        File Access
                    </h2>

                    <div className="flex items-center justify-between p-4 bg-dark-elevated rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">📄</div>
                            <div>
                                <p className="text-white font-semibold">Document File</p>
                                <p className="text-secondary text-sm">Securely stored and encrypted</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDownload}
                                className="btn-outline-lime"
                            >
                                View File
                            </button>
                            {user?.role === 'bank' && (
                                <button
                                    onClick={handleVerifyDocument}
                                    disabled={verifying}
                                    className="btn-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verifying ? 'Verifying...' : 'Verify Document'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-dark-elevated border border-border-dark rounded-xl">
                        <p className="text-sm text-secondary">
                            <strong className="text-white">Access Control:</strong> Only authorized users can view and download this document.
                            All access is logged and recorded on the blockchain for audit purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
