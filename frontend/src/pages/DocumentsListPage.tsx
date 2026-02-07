import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document } from '../types/document.types';
import { useAuth } from '../context/AuthContext';

export default function DocumentsListPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const { user } = useAuth();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const docs = await documentService.getDocuments();
            setDocuments(docs);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = filter === 'all'
        ? documents
        : documents.filter(doc => doc.doc_type === filter);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-secondary">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Trade Documents
                        </h1>
                        <p className="text-secondary">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} in total
                        </p>
                    </div>
                    {user?.role !== 'auditor' && (
                        <Link to="/upload" className="btn-lime">
                            ⬆️ Upload Document
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="mb-8 flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={filter === 'all' ? 'badge-lime' : 'badge-outline hover:border-lime transition-colors'}
                    >
                        All Documents
                    </button>
                    <button
                        onClick={() => setFilter('BILL_OF_LADING')}
                        className={filter === 'BILL_OF_LADING' ? 'badge-lime' : 'badge-outline hover:border-lime transition-colors'}
                    >
                        Bill of Lading
                    </button>
                    <button
                        onClick={() => setFilter('LOC')}
                        className={filter === 'LOC' ? 'badge-lime' : 'badge-outline hover:border-lime transition-colors'}
                    >
                        Letter of Credit
                    </button>
                    <button
                        onClick={() => setFilter('INVOICE')}
                        className={filter === 'INVOICE' ? 'badge-lime' : 'badge-outline hover:border-lime transition-colors'}
                    >
                        Commercial Invoice
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                        {error}
                    </div>
                )}

                {/* Documents Grid */}
                {filteredDocuments.length === 0 ? (
                    <div className="modern-card text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            No Documents Found
                        </h3>
                        <p className="text-secondary mb-6">
                            {filter === 'all'
                                ? 'Upload your first document to get started'
                                : 'No documents match this filter'}
                        </p>
                        {user?.role !== 'auditor' && filter === 'all' && (
                            <Link to="/upload" className="btn-lime inline-block">
                                Upload Document
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map((doc) => (
                            <Link
                                key={doc.id}
                                to={`/documents/${doc.id}`}
                                className="modern-card group"
                            >
                                {/* Document Icon */}
                                <div className="text-5xl mb-4">{getDocIcon(doc.doc_type)}</div>

                                {/* Document Number */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {doc.doc_number}
                                </h3>

                                {/* Document Type */}
                                <p className="text-secondary text-sm mb-4">
                                    {doc.doc_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>

                                {/* Created Date */}
                                <div className="flex items-center justify-between">
                                    <span className="badge-outline text-xs">
                                        {doc.doc_type}
                                    </span>
                                    <span className="text-muted text-xs">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Hover Indicator */}
                                <div className="mt-4 pt-4 border-t border-dark-elevated flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm text-secondary">View Details</span>
                                    <span className="text-lime">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
