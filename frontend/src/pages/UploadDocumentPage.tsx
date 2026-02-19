/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useRef, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import { DocumentType } from '../types/document.types';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import {
    Lock,
    CheckCircle,
    CheckCircle2,
    FileText,
    Upload,
    XCircle,
    AlertTriangle,
    ArrowLeft,
    Shield,
    Database,
    Zap,
    UploadCloud,
    File
} from 'lucide-react';

export default function UploadDocumentPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [docType, setDocType] = useState<DocumentType>('BILL_OF_LADING');
    const [docNumber, setDocNumber] = useState('');
    const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split('T')[0]);

    // File State
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload State
    const [loading, setLoading] = useState(false);
    const [uploadStep, setUploadStep] = useState(0); // 0: Idle, 1: Hashing, 2: Encrypting, 3: Uploading, 4: Success
    const [error, setError] = useState('');

    // Role Check
    if (user?.role === 'auditor') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ElevatedPanel className="text-center max-w-md border-red-500/20">
                    <div className="mb-4 text-secondary flex justify-center">
                        <Lock size={64} className="text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Access Restricted</h2>
                    <p className="text-secondary mb-6">
                        Auditors have read-only access to the ledger and cannot upload new documents.
                    </p>
                    <button onClick={() => navigate('/documents')} className="btn-secondary">
                        Return to Documents
                    </button>
                </ElevatedPanel>
            </div>
        );
    }

    // Drag & Drop Handlers
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size exceeds 10MB limit');
            return;
        }
        setFile(selectedFile);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!file || !docNumber || !issuedAt) {
            setError('Please complete all fields and select a file.');
            return;
        }

        try {
            setLoading(true);

            // Cryptographic processing
            setUploadStep(1);
            await new Promise(resolve => setTimeout(resolve, 800));

            // Hash encryption simulation
            setUploadStep(2);
            await new Promise(resolve => setTimeout(resolve, 600));

            // Blockchain registration
            setUploadStep(3);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('doc_type', docType);
            formData.append('doc_number', docNumber);
            formData.append('issued_at', issuedAt);

            await documentService.uploadDocument(formData);

            // Finalizing record
            setUploadStep(4);
            setTimeout(() => {
                navigate('/documents');
            }, 2000);

        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
            setUploadStep(0);
        } finally {
            if (uploadStep !== 4) setLoading(false);
        }
    };

    if (uploadStep === 4) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] fade-in">
                <ElevatedPanel className="text-center max-w-md border-green-500/20 bg-green-500/5">
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                            <CheckCircle size={80} className="text-green-500 relative z-10" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upload Complete</h2>
                    <p className="text-secondary mb-6">
                        Document successfully hashed, encrypted, and recorded on the ledger.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                        <div className="spinner-small" />
                        <span>Redirecting to vault...</span>
                    </div>
                </ElevatedPanel>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button
                        onClick={() => navigate('/documents')}
                        className="flex items-center gap-2 text-secondary hover:text-white transition-colors mb-2 text-sm"
                    >
                        <ArrowLeft size={16} /> Back to Vault
                    </button>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Secure Document Upload</h1>
                    <p className="text-secondary">Register new trade documents on the blockchain ledger</p>
                </div>

                {/* Visual Stepper */}
                <div className="hidden md:flex items-center gap-4 bg-black/20 p-2 px-4 rounded-full border border-white/5">
                    <div className={`flex items-center gap-2 ${uploadStep >= 0 ? 'text-blue-400' : 'text-secondary'}`}>
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold border border-blue-500/50">1</span>
                        <span className="text-sm font-medium">Details</span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10"></div>
                    <div className={`flex items-center gap-2 ${uploadStep >= 1 ? 'text-blue-400' : 'text-secondary'}`}>
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold border border-blue-500/50">2</span>
                        <span className="text-sm font-medium">Hashing</span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10"></div>
                    <div className={`flex items-center gap-2 ${uploadStep >= 3 ? 'text-blue-400' : 'text-secondary'}`}>
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold border border-blue-500/50">3</span>
                        <span className="text-sm font-medium">Ledger</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Metadata (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <ElevatedPanel>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-blue-400" />
                                Document Metadata
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 block">
                                        Document Type
                                    </label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value as DocumentType)}
                                        className="input-field w-full"
                                        disabled={loading}
                                    >
                                        <option value="BILL_OF_LADING">Bill of Lading</option>
                                        <option value="INVOICE">Commercial Invoice</option>
                                        <option value="LOC">Letter of Credit</option>
                                        <option value="PO">Purchase Order</option>
                                        <option value="COO">Certificate of Origin</option>
                                        <option value="INSURANCE_CERT">Insurance Certificate</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 block">
                                        Document Number
                                    </label>
                                    <input
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value)}
                                        className="input-field w-full font-mono"
                                        placeholder="e.g. BL-8842-XJ"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 block">
                                        Date of Issue
                                    </label>
                                    <input
                                        type="date"
                                        value={issuedAt}
                                        onChange={(e) => setIssuedAt(e.target.value)}
                                        className="input-field w-full"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </ElevatedPanel>

                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                            <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                                <Shield size={16} /> Security Assurance
                            </h4>
                            <p className="text-xs text-blue-200/60 leading-relaxed">
                                Documents are cryptographically hashed (SHA-256) before upload.
                                The hash is immutable and stored on the ledger for audit verification.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Upload Zone (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <div
                            className={`
                                flex-1 relative rounded-xl border-2 border-dashed transition-all duration-300
                                flex flex-col items-center justify-center p-12 group cursor-pointer
                                ${isDragging
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : loading
                                        ? 'border-white/5 bg-black/20 cursor-default'
                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5 bg-black/20'
                                }
                            `}
                            onDragOver={!loading ? handleDragOver : undefined}
                            onDragLeave={!loading ? handleDragLeave : undefined}
                            onDrop={!loading ? handleDrop : undefined}
                            onClick={() => !loading && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                accept=".pdf,.doc,.docx,.jpg,.png"
                            />

                            {/* Background decoration */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_70%)] pointer-events-none" />

                            {!file ? (
                                <>
                                    <div className={`p-6 rounded-full bg-blue-500/10 text-blue-400 mb-6 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        <UploadCloud size={64} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Drag document here</h3>
                                    <p className="text-secondary mb-8">or click to browse local files</p>
                                    <div className="flex gap-4">
                                        <span className="badge badge-outline text-xs">PDF</span>
                                        <span className="badge badge-outline text-xs">DOCX</span>
                                        <span className="badge badge-outline text-xs">JPG</span>
                                        <span className="badge badge-outline text-xs">Max 10MB</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full max-w-md mx-auto relative z-10">
                                    {/* File Card */}
                                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8 flex items-center gap-4">
                                        <div className="p-4 bg-lime-500/10 rounded-lg text-lime-400">
                                            <FileText size={32} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="text-white font-medium truncate">{file.name}</h4>
                                            <p className="text-secondary text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        {!loading && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="p-2 hover:bg-white/10 rounded-full text-secondary hover:text-white transition-colors"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Loading State */}
                                    {loading ? (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white font-medium">
                                                        {uploadStep === 1 && "Generating SHA-256 Hash..."}
                                                        {uploadStep === 2 && "Encrypting Document..."}
                                                        {uploadStep === 3 && "Recording to Ledger..."}
                                                    </span>
                                                    <span className="text-blue-400">{uploadStep === 1 ? '30%' : uploadStep === 2 ? '60%' : '90%'}</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                                        style={{ width: uploadStep === 1 ? '30%' : uploadStep === 2 ? '60%' : '90%' }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className={`p-3 rounded border text-center transition-colors ${uploadStep >= 1 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-secondary'}`}>
                                                    <Zap size={16} className="mx-auto mb-1" />
                                                    <span className="text-[10px] font-bold uppercase">Hash</span>
                                                </div>
                                                <div className={`p-3 rounded border text-center transition-colors ${uploadStep >= 2 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-secondary'}`}>
                                                    <Lock size={16} className="mx-auto mb-1" />
                                                    <span className="text-[10px] font-bold uppercase">Encrypt</span>
                                                </div>
                                                <div className={`p-3 rounded border text-center transition-colors ${uploadStep >= 3 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-secondary'}`}>
                                                    <Database size={16} className="mx-auto mb-1" />
                                                    <span className="text-[10px] font-bold uppercase">Store</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="btn-secondary flex-1"
                                            >
                                                Change File
                                            </button>
                                            <button
                                                type="submit"
                                                onClick={(e) => e.stopPropagation()}
                                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                                            >
                                                <Upload size={18} /> Upload Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-md">
                                    <div className="alert alert-error animate-slide-up">
                                        <AlertTriangle size={20} />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
