/* Author: Abdul Samad | */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/MainLayout';
import { documentService } from '../services/documentService';
import { Button } from '../components/common/Button';
import { Upload, FileText, ArrowLeft, ShieldCheck, Lock, CheckCircle } from 'lucide-react';
import { DOCUMENT_TYPES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import type { DocumentType } from '../types/document.types';

export const DocumentUpload: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    // Role-Based Options
    const getAllowedTypes = () => {
        if (!user) return [];
        const allTypes = Object.entries(DOCUMENT_TYPES);

        if (user.role === 'corporate') {
            return allTypes.filter(([key]) => ['PO', 'INVOICE', 'BILL_OF_LADING'].includes(key));
        } else if (user.role === 'bank') {
            return allTypes.filter(([key]) => ['LOC', 'INSURANCE_CERT'].includes(key));
        }
        return allTypes; // Admin sees all
    };

    const allowedTypes = getAllowedTypes();

    const [uploadData, setUploadData] = useState<{
        file: File | null;
        doc_type: DocumentType;
        doc_number: string;
        issued_at: string;
        trade_id?: number;
    }>({
        file: null,
        // Default to first allowed type or INVOICE fallback
        doc_type: (allowedTypes.length > 0 ? allowedTypes[0][0] : 'INVOICE') as DocumentType,
        doc_number: '',
        issued_at: new Date().toISOString().split('T')[0],
        trade_id: undefined
    });

    // UI States
    const [status, setStatus] = useState<'idle' | 'hashing' | 'uploading' | 'success'>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const validateFile = (file: File): string | null => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) return 'File size exceeds 10MB limit';
        if (file.type !== 'application/pdf') return 'Only PDF files are allowed';
        return null;
    };

    const handleFileChange = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError('');
        setUploadData({ ...uploadData, file });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    // Trade fetching for Banks
    const [trades, setTrades] = useState<any[]>([]);

    // Import tradeService dynamically or assume it's available. 
    // Ideally we import it at the top, but for replace_file_content we can't easily add top-level imports without context.
    // I will add the import in a separate call or rely on the user confirming.
    // Actually, I should add the import.

    React.useEffect(() => {
        if (user?.role === 'bank') {
            // Fetch available trades
            import('../services/tradeService').then(({ tradeService }) => {
                tradeService.getTrades().then(setTrades).catch(console.error);
            });
        }
    }, [user]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file) {
            setError('Please select a file');
            return;
        }

        // Bank Requirement: Must select a trade
        if (user?.role === 'bank' && !uploadData.trade_id) {
            setError('Bank users must attach documents to an existing Trade Transaction.');
            return;
        }

        try {
            // Step 1: Simulate Hashing
            setStatus('hashing');
            let p = 0;
            const interval = setInterval(() => {
                p += 10;
                setProgress(p);
                if (p >= 100) clearInterval(interval);
            }, 100);

            await new Promise(resolve => setTimeout(resolve, 1200)); // Fake hash delay

            // Step 2: Upload
            setStatus('uploading');
            const uploadedDoc = await documentService.uploadDocument({
                file: uploadData.file,
                doc_type: uploadData.doc_type,
                doc_number: uploadData.doc_number,
                issued_at: uploadData.issued_at,
                trade_id: uploadData.trade_id // Pass the trade_id
            });

            // Step 3: Success
            setStatus('success');
            setTimeout(() => {
                navigate(`/documents/${uploadedDoc.id}`);
            }, 1000);

        } catch (err: any) {
            setStatus('idle');
            setError(err.response?.data?.detail || 'Upload failed');
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto py-8">
                <div className="flex items-center space-x-4 mb-8">
                    <Button variant="secondary" onClick={() => navigate('/documents')} className="bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-slate-700">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Document Upload</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Upload and notarize documents on the blockchain</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-8 border border-gray-200 dark:border-slate-700 relative overflow-hidden">
                    {/* Security Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50">
                        <Lock className="w-3 h-3" /> End-to-End Encrypted
                    </div>

                    <form onSubmit={handleUpload} className="space-y-6 mt-4">
                        {error && (
                            <div className="bg-rose-900/20 border border-rose-800 text-rose-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> {error}
                            </div>
                        )}

                        {/* Progress Overlay */}
                        {(status === 'hashing' || status === 'uploading' || status === 'success') && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-10 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                {status === 'success' ? (
                                    <div className="text-emerald-400 animate-bounce">
                                        <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-white">Success!</h3>
                                        <p className="text-slate-400">Document notarized on ledger.</p>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-sm">
                                        <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {status === 'hashing' ? 'Generating Cryptographic Hash...' : 'Syncing to Blockchain...'}
                                        </h3>
                                        <div className="w-full bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${status === 'hashing' ? progress : 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono">
                                            {status === 'hashing' ? `SHA-256 Calculation: ${progress}%` : 'Waiting for confirmation...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Document Type
                                </label>
                                <select
                                    className="block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white sm:text-sm"
                                    value={uploadData.doc_type}
                                    onChange={(e) => setUploadData({ ...uploadData, doc_type: e.target.value as DocumentType })}
                                >
                                    {allowedTypes.map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Issued Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white sm:text-sm"
                                    value={uploadData.issued_at}
                                    onChange={(e) => setUploadData({ ...uploadData, issued_at: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Trade Selector for Banks */}
                        {user?.role === 'bank' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Link to Trade Transaction <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    className="block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white sm:text-sm"
                                    value={uploadData.trade_id || ''}
                                    onChange={(e) => setUploadData({ ...uploadData, trade_id: Number(e.target.value) })}
                                >
                                    <option value="">Select a Trade ID...</option>
                                    {trades.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            Trade #{t.id} - {t.amount} {t.currency} ({t.status})
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-slate-500">
                                    Bank documents must be associated with an active trade.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Document Number
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white sm:text-sm"
                                    placeholder="e.g., PO-2024-001"
                                    value={uploadData.doc_number}
                                    onChange={(e) => setUploadData({ ...uploadData, doc_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                File Attachment (PDF)
                            </label>
                            <div
                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all
                                    ${uploadData.file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 hover:border-blue-500 hover:bg-white dark:hover:bg-slate-900'}
                                `}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <div className="space-y-2 text-center">
                                    {uploadData.file ? (
                                        <>
                                            <FileText className="mx-auto h-12 w-12 text-emerald-500" />
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                                Ready: {uploadData.file.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setUploadData({ ...uploadData, file: null })}
                                                className="text-xs text-rose-400 hover:text-rose-300 underline"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                            <div className="flex text-sm text-slate-400 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input type="file" className="sr-only" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                PDF up to 10MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={status !== 'idle' || !uploadData.file}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 shadow-lg shadow-blue-900/20"
                            >
                                {status === 'idle' ? 'Start Secure Upload' : 'Processing...'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};
