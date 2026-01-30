import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { DocumentType } from '../types/document.types';

export default function UploadDocumentPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [formData, setFormData] = useState({
        doc_type: 'INVOICE' as DocumentType,
        doc_number: '',
        issued_at: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const documentTypes = [
        { value: 'LOC', label: 'Letter of Credit', icon: '📜' },
        { value: 'INVOICE', label: 'Invoice', icon: '🧾' },
        { value: 'BILL_OF_LADING', label: 'Bill of Lading', icon: '🚢' },
        { value: 'PO', label: 'Purchase Order', icon: '📝' },
        { value: 'COO', label: 'Certificate of Origin', icon: '🌍' },
        { value: 'INSURANCE_CERT', label: 'Insurance Certificate', icon: '🛡️' },
    ];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file');
            return;
        }

        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('doc_type', formData.doc_type);
            uploadData.append('doc_number', formData.doc_number);
            uploadData.append('issued_at', new Date(formData.issued_at).toISOString());

            const document = await documentService.uploadDocument(uploadData);
            setSuccess('Document uploaded successfully!');
            setTimeout(() => {
                navigate(`/documents/${document.id}`);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-white mb-2">Upload Document</h1>
                    <p className="text-slate-400">Add a new trade finance document to the ledger</p>
                </div>

                <div className="glass rounded-2xl p-8 animate-fade-in-up stagger-1">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-6 animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {success}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Document Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">
                                Document Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {documentTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, doc_type: type.value as DocumentType })}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${formData.doc_type === type.value
                                                ? 'bg-cyan-500/20 border-cyan-500 text-white'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{type.icon}</span>
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Document Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Document Number
                            </label>
                            <input
                                type="text"
                                value={formData.doc_number}
                                onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                                placeholder="e.g., INV-2024-001"
                                required
                            />
                        </div>

                        {/* Issue Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Issue Date
                            </label>
                            <input
                                type="date"
                                value={formData.issued_at}
                                onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                                required
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Document File
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isDragging
                                        ? 'border-cyan-500 bg-cyan-500/10'
                                        : file
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    required={!file}
                                />
                                {file ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                                            📄
                                        </div>
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="mt-3 text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                                            📁
                                        </div>
                                        <p className="text-white font-medium">
                                            Drop your file here, or <span className="text-cyan-400">browse</span>
                                        </p>
                                        <p className="text-slate-500 text-sm mt-1">
                                            PDF, Images, and documents up to 50MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload Document
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/documents')}
                                className="px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
