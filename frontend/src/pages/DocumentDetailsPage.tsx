import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document } from '../types/document.types';
import { useAuth } from '../context/AuthContext';

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            loadDocument();
        }
    }, [id]);

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
                                <button className="btn-dark">
                                    Verify Document
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
