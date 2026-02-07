import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { DocumentType } from '../types/document.types';

export default function UploadDocumentPage() {
    const [docType, setDocType] = useState<DocumentType>('BILL_OF_LADING');
    const [docNumber, setDocNumber] = useState('');
    const [issuedAt, setIssuedAt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
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
            const formData = new FormData();
            formData.append('file', file);
            formData.append('doc_type', docType);
            formData.append('doc_number', docNumber);
            formData.append('issued_at', issuedAt);

            await documentService.uploadDocument(formData);
            setSuccess(true);

            // Redirect after success
            setTimeout(() => {
                navigate('/documents');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="modern-card-lime text-center max-w-md">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Upload Successful!
                    </h2>
                    <p className="text-secondary">
                        Your document has been uploaded and recorded on the blockchain.
                    </p>
                    <p className="text-lime mt-4">
                        Redirecting to documents...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/documents')}
                        className="text-lime hover:underline mb-4 flex items-center gap-2"
                    >
                        ← Back to Documents
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Upload Document
                    </h1>
                    <p className="text-secondary">
                        Upload and verify trade finance documents on the blockchain
                    </p>
                </div>

                {/* Form Card */}
                <div className="modern-card-lime">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                            {error}
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
                                className="modern-input"
                                required
                            >
                                <option value="BILL_OF_LADING">Bill of Lading</option>
                                <option value="LOC">Letter of Credit</option>
                                <option value="INVOICE">Commercial Invoice</option>
                                <option value="PO">Purchase Order</option>
                                <option value="COO">Certificate of Origin</option>
                                <option value="INSURANCE_CERT">Insurance Certificate</option>
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
                                className="modern-input"
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
                                className="modern-input"
                                required
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Document File *
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                                        ? 'border-lime bg-lime/5'
                                        : 'border-dark-elevated hover:border-lime/50'
                                    }`}
                            >
                                {file ? (
                                    <div>
                                        <div className="text-5xl mb-3">📄</div>
                                        <p className="text-white font-semibold mb-1">{file.name}</p>
                                        <p className="text-secondary text-sm mb-4">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-5xl mb-3">⬆️</div>
                                        <p className="text-white mb-2">
                                            Drag and drop your file here, or
                                        </p>
                                        <label className="btn-outline-lime inline-block cursor-pointer">
                                            Browse Files
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                        </label>
                                        <p className="text-muted text-xs mt-4">
                                            Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-dark-elevated border border-border-dark rounded-xl">
                            <h4 className="text-sm font-semibold text-white mb-2">📋 Important Information</h4>
                            <ul className="text-sm text-secondary space-y-1">
                                <li>✓ Document will be stored securely and encrypted</li>
                                <li>✓ SHA-256 hash will be recorded on blockchain</li>
                                <li>✓ Immutable audit trail will be created</li>
                                <li>✓ Document can be verified by all authorized parties</li>
                            </ul>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/documents')}
                                className="btn-dark flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !file}
                                className="btn-lime flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner w-5 h-5 border-dark" />
                                        Uploading...
                                    </span>
                                ) : (
                                    '⬆️ Upload Document'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Help Section */}
                <div className="mt-8 modern-card">
                    <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Upload Guidelines
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-secondary">
                        <div>
                            <h4 className="text-white font-semibold mb-2">✅ Do</h4>
                            <ul className="space-y-1">
                                <li>• Use clear, legible scans</li>
                                <li>• Ensure all information is visible</li>
                                <li>• Use unique document numbers</li>
                                <li>• Upload original/certified copies</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-2">❌ Don't</h4>
                            <ul className="space-y-1">
                                <li>• Upload blurry or incomplete documents</li>
                                <li>• Use duplicate document numbers</li>
                                <li>• Exceed file size limits</li>
                                <li>• Upload unsupported file formats</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
