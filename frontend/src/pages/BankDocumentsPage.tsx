import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { bankService, BankDocument } from '../services/bankService';
import UploadDocumentModal from '../components/UploadDocumentModal';

/**
 * BankDocumentsPage Component
 * 
 * Implements "Document Oversight" view for Bank Users.
 * - Lists all bank documents.
 * - Allows verifying document integrity (SHA-256 hash check).
 * - Allows viewing documents with audit logging.
 * - Toggles the UploadDocumentModal.
 * - Links to Document Details page for full audit history.
 */
export default function BankDocumentsPage() {
    const [docs, setDocs] = useState<BankDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [verificationResults, setVerificationResults] = useState<Record<number, boolean | null>>({});
    const [viewingDocs, setViewingDocs] = useState<Record<number, boolean>>({});
    const [showUploadModal, setShowUploadModal] = useState(false);

    const loadDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await bankService.getDocuments();
            setDocs(data);
        } catch (error) {
            console.error(error);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    /**
     * Handles calls to the backend verification endpoint.
     * Updates local state to show 'Checking...' then 'PASS' or 'FAIL'.
     * The backend strictly compares the stored hash vs re-computed hash.
     */
    const handleVerify = async (id: number) => {
        // Set state to loading (null)
        setVerificationResults((prev: Record<number, boolean | null>) => ({ ...prev, [id]: null }));
        try {
            const result = await bankService.verifyDocument(id);
            // Update state with result (true=PASS, false=FAIL)
            setVerificationResults((prev: Record<number, boolean | null>) => ({ ...prev, [id]: result.verified }));
        } catch (e) {
            console.error(e);
            alert("Verification Error");
            // Reset on error
            setVerificationResults((prev: Record<number, boolean | null>) => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }
    };

    /**
     * Handles document viewing.
     * Fetches the document blob from the backend (which logs the VIEW action).
     * Opens it in a new browser tab.
     */
    const handleView = async (id: number) => {
        setViewingDocs((prev: Record<number, boolean>) => ({ ...prev, [id]: true }));
        try {
            const blob = await bankService.viewDocument(id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            window.open(url, '_blank');
        } catch (e) {
            console.error("View failed", e);
            alert("Failed to open document. Please try again.");
        } finally {
            setViewingDocs((prev: Record<number, boolean>) => ({ ...prev, [id]: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-6xl mx-auto space-y-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start md:items-center gap-6 flex-col md:flex-row">
                    <div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Document Oversight
                        </h1>
                        <p className="text-slate-600">
                            Secure repository • Hash verified • Audit logged
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadDocuments}
                            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-bold rounded-lg transition-colors"
                        >
                            🔄 Refresh
                        </button>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                        >
                            + Upload Document
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">⚠️</span>
                        <span className="text-red-800 font-medium">{error}</span>
                    </div>
                )}

                {/* Conditionally render the modal based on state */}
                {showUploadModal && (
                    <UploadDocumentModal
                        onClose={() => setShowUploadModal(false)}
                        onUploadSuccess={loadDocuments}
                    />
                )}

                {/* Documents Card */}
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] overflow-hidden">
                    {docs.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="text-5xl mb-4 inline-block">📄</span>
                            <p className="text-xl text-slate-900 font-bold mb-2">No Documents Yet</p>
                            <p className="text-slate-600 mb-6">
                                Your document repository is empty. Upload a document to get started.
                            </p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Upload Your First Document
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Table Header */}
                            <div className="grid grid-cols-12 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 bg-slate-50 px-6 py-4">
                                <div className="col-span-1">Doc ID</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-3">Filename</div>
                                <div className="col-span-2 text-right">Upload Date</div>
                                <div className="col-span-4 text-center">Actions</div>
                            </div>

                            {/* Table Rows */}
                            <div className="divide-y divide-slate-200">
                                {docs.map((doc: BankDocument) => {
                                    // Determine current verification status display
                                    let statusDisplay = null;
                                    const isChecking = verificationResults[doc.id] === null;
                                    const checkResult = verificationResults[doc.id];

                                    if (isChecking) {
                                        statusDisplay = (
                                            <span className="flex items-center justify-center gap-2 text-yellow-700 text-xs font-bold animate-pulse">
                                                <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                                                CHECKING...
                                            </span>
                                        );
                                    } else if (checkResult === true || (checkResult === undefined && doc.verification_status === 'VERIFIED')) {
                                        statusDisplay = (
                                            <span className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-bold px-3 py-1 bg-emerald-100 border-2 border-emerald-300 rounded-full">
                                                ✓ VERIFIED
                                            </span>
                                        );
                                    } else if (checkResult === false || (checkResult === undefined && doc.verification_status === 'FAILED')) {
                                        statusDisplay = (
                                            <span className="flex items-center justify-center gap-2 text-red-700 text-xs font-bold px-3 py-1 bg-red-100 border-2 border-red-300 rounded-full">
                                                ⚠ FAILED
                                            </span>
                                        );
                                    }

                                    return (
                                        <div key={doc.id} className="grid grid-cols-12 items-center hover:bg-blue-50 px-6 py-4 transition-colors">
                                            <div className="col-span-1 text-slate-900 font-mono text-sm font-bold">
                                                <Link to={`/documents/${doc.id}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                                                    #{doc.id}
                                                </Link>
                                            </div>
                                            <div className="col-span-2 text-slate-900 text-sm font-bold">
                                                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                                                    {doc.doc_type || 'DOC'}
                                                </span>
                                            </div>
                                            <div className="col-span-3 text-slate-700 text-sm truncate pr-4" title={doc.filename}>
                                                {doc.filename}
                                            </div>
                                            <div className="col-span-2 text-right text-slate-600 text-xs font-mono">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </div>

                                            <div className="col-span-4 flex items-center justify-end gap-2">
                                                {/* Verify Button */}
                                                {!statusDisplay ? (
                                                    <button
                                                        onClick={() => handleVerify(doc.id)}
                                                        disabled={isChecking}
                                                        className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 border-2 border-amber-300 hover:bg-amber-200 rounded-lg transition-all"
                                                        title="Check SHA-256 Hash Integrity"
                                                    >
                                                        🛡️ Verify
                                                    </button>
                                                ) : (
                                                    <div className="min-w-[120px] text-center">
                                                        {statusDisplay}
                                                    </div>
                                                )}

                                                {/* View Button */}
                                                <Link
                                                    to={`/documents/${doc.id}`}
                                                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 border-2 border-blue-300 hover:bg-blue-200 rounded-lg transition-all flex items-center gap-1"
                                                    title="Open Document Detail Page"
                                                >
                                                    👁️ View
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
