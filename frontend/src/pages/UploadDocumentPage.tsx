import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import { DocumentType } from '../types/document.types';
import { UploadZone } from '../components/UploadZone';
import { GlassCard } from '../components/GlassCard';

export default function UploadDocumentPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [docType, setDocType] = useState<DocumentType>('BILL_OF_LADING');
    const [docNumber, setDocNumber] = useState('');
    const [issuedAt, setIssuedAt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [hashGenerating, setHashGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Role-based access control: Auditors cannot upload documents
    if (user?.role === 'auditor') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                    <p className="text-secondary mb-6">
                        Auditors have read-only access and cannot upload documents.
                    </p>
                    <button
                        onClick={() => navigate('/documents')}
                        className="btn-primary"
                    >
                        View Documents
                    </button>
                </GlassCard>
            </div>
        );
    }

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        if (!docNumber || !issuedAt) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setUploadProgress(30);

            // Simulate hash generation
            setHashGenerating(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setUploadProgress(60);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('doc_type', docType);
            formData.append('doc_number', docNumber);
            formData.append('issued_at', issuedAt);

            await documentService.uploadDocument(formData);
            setUploadProgress(100);
            setHashGenerating(false);
            setSuccess(true);

            // Redirect after success
            setTimeout(() => {
                navigate('/documents');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
            setUploadProgress(0);
            setHashGenerating(false);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md glow-pulse">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Upload Successful!
                    </h2>
                    <p className="text-secondary mb-4">
                        Your document has been uploaded and recorded on the blockchain.
                    </p>
                    <div className="inline-flex items-center gap-2 text-lime">
                        <div className="spinner spinner-small" />
                        <span>Redirecting to documents...</span>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/documents')}
                    className="text-secondary hover:text-lime transition-colors mb-4 flex items-center gap-2"
                >
                    <span>←</span>
                    <span>Back to Documents</span>
                </button>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Upload Document
                </h1>
                <p className="text-secondary">
                    Upload and verify trade finance documents on the blockchain ledger
                </p>
            </div>

            {/* Form Card */}
            <GlassCard>
                {error && (
                    <div className="alert alert-error mb-6">
                        <span className="text-2xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Document Type */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Document Type *
                        </label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value as DocumentType)}
                            className="input-field"
                            required
                        >
                            <option value="BILL_OF_LADING">📄 Bill of Lading</option>
                            <option value="LOC">💰 Letter of Credit</option>
                            <option value="INVOICE">🧾 Commercial Invoice</option>
                            <option value="PO">📋 Purchase Order</option>
                            <option value="COO">✅ Certificate of Origin</option>
                            <option value="INSURANCE_CERT">🛡️ Insurance Certificate</option>
                        </select>
                    </div>

                    {/* Document Number */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Document Number *
                        </label>
                        <input
                            type="text"
                            value={docNumber}
                            onChange={(e) => setDocNumber(e.target.value)}
                            className="input-field"
                            placeholder="e.g., BL-2024-001"
                            required
                        />
                        <p className="mt-2 text-xs text-muted">
                            Unique identifier for this document
                        </p>
                    </div>

                    {/* Issue Date */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Issue Date *
                        </label>
                        <input
                            type="date"
                            value={issuedAt}
                            onChange={(e) => setIssuedAt(e.target.value)}
                            className="input-field"
                            required
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* File Upload Zone */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">
                            Document File *
                        </label>
                        {!file ? (
                            <UploadZone onFileSelect={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" maxSize={10} />
                        ) : (
                            <div className="glass-card-flat text-center">
                                <div className="text-5xl mb-3">📄</div>
                                <p className="text-white font-semibold mb-1">{file.name}</p>
                                <p className="text-secondary text-sm mb-4">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="btn-outline text-sm"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    Remove file
                                </button>
                            </div>
                        )}
                        <p className="mt-2 text-xs text-muted">
                            Supported formats: PDF, DOC, DOCX, JPG, PNG • Maximum: 10MB
                        </p>
                    </div>

                    {/* Upload Progress */}
                    {loading && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-secondary">
                                    {hashGenerating ? 'Generating SHA-256 hash...' : 'Uploading to blockchain...'}
                                </span>
                                <span className="text-lime font-semibold">{uploadProgress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="alert alert-info">
                        <span className="text-2xl">📋</span>
                        <div className="text-sm">
                            <p className="font-semibold mb-2">Important Information</p>
                            <ul className="space-y-1 text-xs">
                                <li>✓ Document will be stored securely and encrypted</li>
                                <li>✓ SHA-256 hash will be recorded on blockchain</li>
                                <li>✓ Immutable audit trail will be created</li>
                                <li>✓ Document can be verified by all authorized parties</li>
                            </ul>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/documents')}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="spinner spinner-small" style={{ borderTopColor: 'var(--bg-primary)' }} />
                                    Uploading...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>⬆️</span>
                                    <span>Upload Document</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </GlassCard>

            {/* Help Section */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
                <GlassCard hover={false}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span>✅</span>
                        <span>Do</span>
                    </h3>
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Use clear, legible scans</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Ensure all information is visible</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Use unique document numbers</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Upload original/certified copies</span>
                        </li>
                    </ul>
                </GlassCard>

                <GlassCard hover={false}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span>❌</span>
                        <span>Don't</span>
                    </h3>
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex items-start gap-2">
                            <span className="text-error">•</span>
                            <span>Upload blurry or incomplete documents</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-error">•</span>
                            <span>Use duplicate document numbers</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-error">•</span>
                            <span>Exceed file size limits (10MB)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-error">•</span>
                            <span>Upload unsupported file formats</span>
                        </li>
                    </ul>
                </GlassCard>
            </div>
        </div>
    );
}
