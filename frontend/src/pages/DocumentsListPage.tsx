import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document } from '../types/document.types';
import { useAuth } from '../context/AuthContext';
import { DocumentCard } from '../components/DocumentCard';
import { GlassCard } from '../components/GlassCard';

export default function DocumentsListPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
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

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
        try {
            await documentService.deleteDocument(id);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete document');
        }
    };

    // Filter documents by search term and type
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = searchTerm === '' ||
            doc.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.doc_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.owner?.org_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || doc.doc_type === typeFilter;

        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-secondary">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Page Header */}
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
                    <Link to="/upload" className="btn-primary">
                        <span>⬆️</span>
                        <span>Upload Document</span>
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="🔍 Search by document number, type, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field"
                />
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap gap-3">
                <button
                    onClick={() => setTypeFilter('all')}
                    className={typeFilter === 'all' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: typeFilter === 'all' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    All Documents
                </button>
                <button
                    onClick={() => setTypeFilter('BILL_OF_LADING')}
                    className={typeFilter === 'BILL_OF_LADING' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: typeFilter === 'BILL_OF_LADING' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    📄 Bill of Lading
                </button>
                <button
                    onClick={() => setTypeFilter('LOC')}
                    className={typeFilter === 'LOC' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: typeFilter === 'LOC' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    💰 Letter of Credit
                </button>
                <button
                    onClick={() => setTypeFilter('INVOICE')}
                    className={typeFilter === 'INVOICE' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: typeFilter === 'INVOICE' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    🧾 Invoice
                </button>
                <button
                    onClick={() => setTypeFilter('PO')}
                    className={typeFilter === 'PO' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: typeFilter === 'PO' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    📋 Purchase Order
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error mb-6">
                    <span className="text-2xl">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
                <GlassCard className="text-center py-16">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        No Documents Found
                    </h3>
                    <p className="text-secondary mb-6">
                        {searchTerm || typeFilter !== 'all'
                            ? 'No documents match your search criteria'
                            : 'Upload your first document to get started'}
                    </p>
                    {user?.role !== 'auditor' && !searchTerm && typeFilter === 'all' && (
                        <Link to="/upload" className="btn-primary">
                            <span>⬆️</span>
                            <span>Upload Document</span>
                        </Link>
                    )}
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((doc) => (
                        <DocumentCard
                            key={doc.id}
                            id={doc.id}
                            docType={doc.doc_type}
                            docNumber={doc.doc_number}
                            ownerName={doc.owner?.name || 'Unknown'}
                            ownerOrg={doc.owner?.org_name}
                            uploadedAt={doc.created_at}
                            status="verified"
                            onDelete={user?.role === 'admin' ? () => handleDelete(doc.id) : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
