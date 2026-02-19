import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { tradeService } from '../services/tradeService';
import { Document, DocumentType } from '../types/document.types';
import { Trade } from '../types/trade.types';
import { useAuth } from '../context/AuthContext';
import { DocumentCard } from '../components/DocumentCard';
import { GlassCard } from '../components/GlassCard';
import { UploadZone } from '../components/UploadZone';

export default function DocumentsListPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const { user } = useAuth();

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<DocumentType>('BILL_OF_LADING');
    const [docNumber, setDocNumber] = useState('');
    const [issuedAt, setIssuedAt] = useState('');
    const [linkedTradeId, setLinkedTradeId] = useState<string>('');
    const [availableTrades, setAvailableTrades] = useState<Trade[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        loadDocuments();
    }, []);

    useEffect(() => {
        if (showUploadModal && user?.role === 'corporate') {
            loadTrades();
        }
    }, [showUploadModal]);

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

    const loadTrades = async () => {
        try {
            const data = await tradeService.getTrades();
            // Corporate users can only see trades they are involved in
            setAvailableTrades(data);
        } catch (err) {
            console.error('Failed to load trades for linking', err);
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

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert('Please select a file');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(30);

            // 1. Upload Document
            const formData = new FormData();
            formData.append('file', file);
            formData.append('doc_type', docType);
            formData.append('doc_number', docNumber);
            formData.append('issued_at', issuedAt);

            const newDoc = await documentService.uploadDocument(formData);
            setUploadProgress(70);

            // 2. Run Verification (Explicitly required by workflow)
            try {
                await documentService.verifyDocument(newDoc.id);
            } catch (verifyErr) {
                console.error("Verification warning:", verifyErr);
            }

            // 3. Link to Trade (if selected)
            if (linkedTradeId) {
                await tradeService.linkDocumentToTrade(parseInt(linkedTradeId), newDoc.id);
            }

            setUploadProgress(100);

            // 4. Refresh and Close
            await loadDocuments();
            setShowUploadModal(false);
            resetUploadForm();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const resetUploadForm = () => {
        setFile(null);
        setDocType('BILL_OF_LADING');
        setDocNumber('');
        setIssuedAt('');
        setLinkedTradeId('');
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
        <div className="fade-in relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Document Oversight
                    </h1>
                    <p className="text-secondary">
                        {documents.length} document{documents.length !== 1 ? 's' : ''} in total
                    </p>
                </div>
                {user?.role !== 'auditor' && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn-primary"
                    >
                        <span>⬆️</span>
                        <span>Upload Document</span>
                    </button>
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
                >
                    All Documents
                </button>
                <button
                    onClick={() => setTypeFilter('BILL_OF_LADING')}
                    className={typeFilter === 'BILL_OF_LADING' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                >
                    📄 Bill of Lading
                </button>
                {user?.role !== 'corporate' && (
                    <button
                        onClick={() => setTypeFilter('LOC')}
                        className={typeFilter === 'LOC' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    >
                        💰 Letter of Credit
                    </button>
                )}
                <button
                    onClick={() => setTypeFilter('INVOICE')}
                    className={typeFilter === 'INVOICE' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                >
                    🧾 Invoice
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
                    <h3 className="text-2xl font-bold text-white mb-2">No Documents Found</h3>
                    <p className="text-secondary mb-6">
                        {searchTerm || typeFilter !== 'all'
                            ? 'No documents match your search criteria'
                            : 'Upload your first document to get started'}
                    </p>
                    {user?.role !== 'auditor' && !searchTerm && typeFilter === 'all' && (
                        <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                            <span>⬆️</span>
                            <span>Upload Document</span>
                        </button>
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

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Upload Document</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-secondary hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Document Type *</label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value as DocumentType)}
                                        className="input-field"
                                        required
                                    >
                                        <option value="BILL_OF_LADING">📄 Bill of Lading</option>
                                        <option value="INVOICE">🧾 Commercial Invoice</option>
                                        <option value="PO">📋 Purchase Order</option>
                                        <option value="COO">✅ Certificate of Origin</option>
                                        <option value="INSURANCE_CERT">🛡️ Insurance Certificate</option>
                                        <option value="LOC">💰 Letter of Credit</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Document Number *</label>
                                    <input
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. BL-12345"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Issue Date *</label>
                                <input
                                    type="date"
                                    value={issuedAt}
                                    onChange={(e) => setIssuedAt(e.target.value)}
                                    className="input-field"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Linked Trade Selection */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Link to Trade (Optional)
                                </label>
                                <select
                                    value={linkedTradeId}
                                    onChange={(e) => setLinkedTradeId(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">-- No Linked Trade --</option>
                                    {availableTrades.map(trade => (
                                        <option key={trade.id} value={trade.id}>
                                            Trade #{trade.id} - {trade.amount} {trade.currency} ({trade.status})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-secondary mt-1">
                                    Linking a document to a trade provides better traceability.
                                </p>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Document File *</label>
                                {!file ? (
                                    <UploadZone onFileSelect={setFile} accept=".pdf,.doc,.docx,.jpg,.png" maxSize={10} />
                                ) : (
                                    <div className="p-4 border border-lime/50 rounded-lg bg-lime/10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">📄</span>
                                            <div>
                                                <p className="text-white font-medium">{file.name}</p>
                                                <p className="text-xs text-secondary">{(file.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div
                                        className="bg-lime h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="btn-secondary flex-1"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {uploading ? 'Processing...' : 'Upload & Verify'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
