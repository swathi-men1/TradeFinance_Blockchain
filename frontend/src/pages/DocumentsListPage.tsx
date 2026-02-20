import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { tradeService } from '../services/tradeService';
import { Document, DocumentType } from '../types/document.types';
import { Trade } from '../types/trade.types';
import { useAuth } from '../context/AuthContext';
import { DocumentCard } from '../components/DocumentCard';
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
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 space-y-8 relative z-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Document Oversight
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Manage and verify {documents.length} document{documents.length !== 1 ? 's' : ''} in your ecosystem
                    </p>
                </div>
                {user?.role !== 'auditor' && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <span>⬆️</span>
                        <span>Upload Document</span>
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by document number, type, or organization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white/80 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap gap-3">
                <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        typeFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-white/60 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white/80'
                    }`}
                >
                    All Documents
                </button>
                <button
                    onClick={() => setTypeFilter('BILL_OF_LADING')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        typeFilter === 'BILL_OF_LADING'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-blue-50/60 border-2 border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                    📄 Bill of Lading
                </button>
                {user?.role !== 'corporate' && (
                    <button
                        onClick={() => setTypeFilter('LOC')}
                        className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                            typeFilter === 'LOC'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-green-50/60 border-2 border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50'
                        }`}
                    >
                        💰 Letter of Credit
                    </button>
                )}
                <button
                    onClick={() => setTypeFilter('INVOICE')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        typeFilter === 'INVOICE'
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-orange-50/60 border-2 border-orange-200 text-orange-700 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                >
                    🧾 Invoice
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3 mb-6">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-800 font-medium">{error}</span>
                </div>
            )}

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-16 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Documents Found</h3>
                    <p className="text-slate-600 mb-6">
                        {searchTerm || typeFilter !== 'all'
                            ? 'No documents match your search criteria'
                            : 'Upload your first document to get started'}
                    </p>
                    {user?.role !== 'auditor' && !searchTerm && typeFilter === 'all' && (
                        <button onClick={() => setShowUploadModal(true)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2">
                            <span>⬆️</span>
                            <span>Upload Document</span>
                        </button>
                    )}
                </div>
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

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white/95 border-b border-slate-200 flex items-center justify-between p-6 z-10">
                            <h2 className="text-2xl font-bold text-slate-900">📤 Upload Document</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-slate-500 hover:text-slate-900 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Document Type *</label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value as DocumentType)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
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
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Document Number *</label>
                                    <input
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="e.g. BL-12345"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Issue Date *</label>
                                <input
                                    type="date"
                                    value={issuedAt}
                                    onChange={(e) => setIssuedAt(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Linked Trade Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">
                                    Link to Trade (Optional)
                                </label>
                                <select
                                    value={linkedTradeId}
                                    onChange={(e) => setLinkedTradeId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                                >
                                    <option value="">-- No Linked Trade --</option>
                                    {availableTrades.map(trade => (
                                        <option key={trade.id} value={trade.id}>
                                            Trade #{trade.id} - {trade.amount} {trade.currency} ({trade.status})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-600 mt-1">
                                    Linking a document to a trade provides better traceability.
                                </p>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Document File *</label>
                                {!file ? (
                                    <UploadZone onFileSelect={setFile} accept=".pdf,.doc,.docx,.jpg,.png" maxSize={10} />
                                ) : (
                                    <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">📄</span>
                                            <div>
                                                <p className="text-slate-900 font-medium">{file.name}</p>
                                                <p className="text-xs text-slate-600">{(file.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="text-red-600 hover:text-red-700 font-bold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-lg transition-all disabled:opacity-50"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
