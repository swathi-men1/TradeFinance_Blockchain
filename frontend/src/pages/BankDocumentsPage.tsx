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
    const [verificationResults, setVerificationResults] = useState<Record<number, boolean | null>>({});
    const [viewingDocs, setViewingDocs] = useState<Record<number, boolean>>({});
    const [showUploadModal, setShowUploadModal] = useState(false);

    const loadDocuments = async () => {
        try {
            const data = await bankService.getDocuments();
            setDocs(data);
        } catch (error) {
            console.error(error);
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

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-gray-100 font-mono fade-in">
            <header className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-widest text-purple-400">Document Oversight</h1>
                    <p className="text-gray-500 text-xs mt-1">
                        Secure Repository • Hash Verified • Audit Logged
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={loadDocuments}
                        className="cursor-pointer px-4 py-2 border border-gray-700 text-gray-400 text-xs uppercase font-bold tracking-wider hover:bg-gray-800 transition-colors"
                    >
                        REFRESH
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="cursor-pointer px-4 py-2 bg-purple-900 text-purple-200 text-xs uppercase font-bold tracking-wider hover:bg-purple-800 transition-colors shadow-lg shadow-purple-900/20"
                    >
                        + UPLOAD BANK DOC
                    </button>
                </div>
            </header>

            {/* Conditionally render the modal based on state */}
            {showUploadModal && (
                <UploadDocumentModal
                    onClose={() => setShowUploadModal(false)}
                    onUploadSuccess={loadDocuments}
                />
            )}

            <div className="grid gap-1">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-xs uppercase text-gray-500 border-b border-gray-700 pb-3 px-4 font-semibold tracking-wider">
                    <div className="col-span-1">Doc ID</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Filename</div>
                    <div className="col-span-2 text-right">Upload Date</div>
                    <div className="col-span-4 text-center">Actions / Verification</div>
                </div>

                {docs.length === 0 && (
                    <div className="p-12 text-center text-gray-600 italic border-b border-gray-800/50">
                        No documents found in the secure repository.
                    </div>
                )}

                {docs.map((doc: BankDocument) => {
                    // Determine current verification status display
                    // Priority: 1. Current check result 2. Historical status 3. Default
                    let statusDisplay = null;
                    const isChecking = verificationResults[doc.id] === null;
                    const checkResult = verificationResults[doc.id];

                    if (isChecking) {
                        statusDisplay = (
                            <span className="flex items-center justify-center gap-2 text-yellow-500 text-xs animate-pulse">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                CHECKING HASH...
                            </span>
                        );
                    } else if (checkResult === true || (checkResult === undefined && doc.verification_status === 'VERIFIED')) {
                        statusDisplay = (
                            <span className="flex items-center justify-center gap-2 text-green-400 text-xs font-bold tracking-wider px-3 py-1 border border-green-800 rounded bg-green-900/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                ✓ PASS
                            </span>
                        );
                    } else if (checkResult === false || (checkResult === undefined && doc.verification_status === 'FAILED')) {
                        statusDisplay = (
                            <span className="flex items-center justify-center gap-2 text-red-500 text-xs font-bold tracking-wider px-3 py-1 border border-red-800 rounded bg-red-900/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                ⚠ FAIL
                            </span>
                        );
                    }

                    return (
                        <div key={doc.id} className="grid grid-cols-12 items-center hover:bg-gray-800 p-4 transition-all duration-200 border-b border-gray-800/50 group">
                            <div className="col-span-1 text-gray-500 font-mono text-xs">
                                <Link to={`/documents/${doc.id}`} className="hover:text-blue-400 hover:underline">
                                    #{doc.id}
                                </Link>
                            </div>
                            <div className="col-span-2 text-gray-400 text-xs font-semibold">{doc.doc_type || 'DOC'}</div>
                            <div className="col-span-3 font-medium text-gray-300 truncate pr-4 text-sm" title={doc.filename}>
                                {doc.filename}
                            </div>
                            <div className="col-span-2 text-right text-gray-500 text-xs font-mono">
                                {new Date(doc.created_at).toLocaleDateString()}
                            </div>

                            <div className="col-span-4 flex items-center justify-end gap-3 pl-4">
                                {/* Verify Button (Only show if not already verified/checking, OR provide re-verify option) */}
                                {!statusDisplay ? (
                                    <button
                                        onClick={() => handleVerify(doc.id)}
                                        disabled={isChecking}
                                        className="px-3 py-1.5 text-xs font-bold text-amber-100 bg-amber-900/50 border border-amber-700 hover:bg-amber-800/50 rounded transition-all uppercase tracking-wider flex items-center gap-2"
                                        title="Check SHA-256 Hash Integrity"
                                    >
                                        <span>🛡️ Verify</span>
                                    </button>
                                ) : (
                                    <div className="min-w-[80px] text-center">
                                        {statusDisplay}
                                    </div>
                                )}

                                {/* View Button → navigate to document detail page */}
                                <Link
                                    to={`/documents/${doc.id}`}
                                    className="px-3 py-1.5 text-xs font-bold text-blue-100 bg-blue-900/30 border border-blue-700 hover:bg-blue-800/50 rounded transition-all uppercase tracking-wider flex items-center gap-2 min-w-[80px] justify-center"
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
    );
}
