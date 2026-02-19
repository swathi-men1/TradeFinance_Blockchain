/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document, DocumentUpdate } from '../types/document.types';
import { useAuth } from '../context/AuthContext';
import { ledgerService } from '../services/ledgerService';
import { LedgerEntry } from '../types/ledger.types';
import { AuditChainTimeline } from '../components/audit/AuditChainTimeline';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { formatDateShortIST } from '../utils/dateFormat';
import {
    FileText,
    FileCheck,
    Receipt,
    ClipboardList,
    CheckCircle,
    ShieldCheck,
    AlertTriangle,
    Save,
    X,
    Pencil,
    Trash2,
    Eye,
    Download,
    Link as LinkIcon,
    GitCommit,
    FolderOpen,
    Lock,
    ArrowLeft
} from 'lucide-react';

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [verifying, setVerifying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<DocumentUpdate>({});
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleVerifyDocument = async () => {
        try {
            setVerifying(true);
            const result = await documentService.verifyDocument(parseInt(id!));
            const statusText = result.is_valid ? 'Verified' : 'Failed';
            if (result.is_valid) {
                toast.success(`Verification Result: ${statusText}\nMessage: ${result.message || 'Integrity Verified'}`);
            } else {
                toast.warning(`Verification Result: ${statusText}\nMessage: ${result.message || 'Check failed'}`);
            }
        } catch (err: any) {
            toast.error(`Verification Failed: ${err.response?.data?.detail || 'Unknown error'}`);
        } finally {
            setVerifying(false);
        }
    };

    const handleDelete = async () => {
        try {
            await documentService.deleteDocument(parseInt(id!));
            toast.success('Document deleted successfully');
            navigate('/documents');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete document');
        } finally {
            setShowDeleteModal(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadDocument();
            loadLedger();
        }
    }, [id]);

    const loadLedger = async () => {
        try {
            const data = await ledgerService.getDocumentLedger(parseInt(id!));
            setLedgerEntries(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadDocument = async () => {
        try {
            setLoading(true);
            const doc = await documentService.getDocumentById(parseInt(id!));
            setDocument(doc);
            setEditForm({
                doc_number: doc.doc_number,
                doc_type: doc.doc_type,
                issued_at: new Date(doc.issued_at).toISOString().split('T')[0]
            });
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load document');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updatedDoc = await documentService.updateDocument(parseInt(id!), editForm);
            setDocument(updatedDoc);
            setIsEditing(false);
            toast.success('Document updated successfully');
            loadLedger();
        } catch (err: any) {
            toast.error(`Update Failed: ${err.response?.data?.detail || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!document) return;
        try {
            await documentService.downloadDocument(document.id);
        } catch (err) {
            toast.error('Failed to download document');
        }
    };

    const handleViewFile = async () => {
        if (!document) return;
        try {
            await documentService.viewDocument(document.id);
        } catch (err) {
            toast.error('Failed to view document');
        }
    };

    const getDocIcon = (docType: string) => {
        const icons: Record<string, React.ReactNode> = {
            'LOC': <FileCheck size={48} />,
            'INVOICE': <Receipt size={48} />,
            'BILL_OF_LADING': <FileText size={48} />,
            'PO': <ClipboardList size={48} />,
            'COO': <CheckCircle size={48} />,
            'INSURANCE_CERT': <ShieldCheck size={48} />
        };
        return icons[docType] || <FileText size={48} />;
    };

    const formatDocType = (docType: string) => {
        const names: Record<string, string> = {
            'LOC': 'Letter of Credit',
            'INVOICE': 'Commercial Invoice',
            'BILL_OF_LADING': 'Bill of Lading',
            'PO': 'Purchase Order',
            'COO': 'Certificate of Origin',
            'INSURANCE_CERT': 'Insurance Certificate'
        };
        return names[docType] || docType;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-secondary">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ElevatedPanel className="text-center max-w-md">
                    <div className="mb-4 text-secondary flex justify-center">
                        <AlertTriangle size={64} />
                    </div>
                    <h2 className="text-2xl font-bold text-content-primary mb-4">
                        Document Not Found
                    </h2>
                    <p className="text-secondary mb-6">
                        {error || 'The document you are looking for does not exist'}
                    </p>
                    <button onClick={() => navigate('/documents')} className="btn-primary">
                        Back to Documents
                    </button>
                </ElevatedPanel>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-6xl">
            {/* Header */}
            <div className="mb-5">
                <button
                    onClick={() => navigate('/documents')}
                    className="text-secondary hover:text-white transition-colors mb-4 flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Documents</span>
                </button>

                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-blue-500">{getDocIcon(document.doc_type)}</div>
                        <div>
                            <h1 className="text-2xl font-bold text-content-primary mb-2">
                                {document.doc_number}
                            </h1>
                            <p className="text-secondary text-lg">
                                {formatDocType(document.doc_type)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {user?.role === 'admin' && (
                            <>
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSave} disabled={saving} className="btn-primary bg-lime-500 text-black hover:bg-white flex items-center gap-2">
                                            <Save size={16} />
                                            <span>{saving ? 'Saving...' : 'Save'}</span>
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center gap-2">
                                            <X size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="btn-secondary text-lime-400 border-lime-400 hover:bg-lime-400/10 flex items-center gap-2">
                                            <Pencil size={16} />
                                            <span>Edit</span>
                                        </button>
                                        <button onClick={() => setShowDeleteModal(true)} className="btn-secondary text-red-400 border-red-400 hover:bg-red-400/10 flex items-center gap-2">
                                            <Trash2 size={16} />
                                            <span>Delete</span>
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                        {!isEditing && (
                            <>
                                <button onClick={handleViewFile} className="btn-secondary text-cyan-400 border-cyan-400 hover:bg-cyan-400/10 flex items-center gap-2">
                                    <Eye size={16} />
                                    <span>View File</span>
                                </button>
                                <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
                                    <Download size={16} />
                                    <span>Download</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Metadata Card */}
            <ElevatedPanel className="mb-5">
                <h2 className="text-2xl font-bold text-content-primary mb-6 flex items-center gap-2">
                    <ClipboardList size={24} className="text-blue-400" />
                    <span>Document Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-muted text-sm block mb-1">Document ID</label>
                        <p className="text-content-primary font-semibold">#{document.id}</p>
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Document Number</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="input-field w-full"
                                value={editForm.doc_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, doc_number: e.target.value })}
                            />
                        ) : (
                            <p className="text-content-primary font-semibold">{document.doc_number}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Document Type</label>
                        {isEditing ? (
                            <select
                                className="input-field w-full"
                                value={editForm.doc_type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm({ ...editForm, doc_type: e.target.value as any })}
                            >
                                <option value="LOC">Letter of Credit</option>
                                <option value="INVOICE">Commercial Invoice</option>
                                <option value="BILL_OF_LADING">Bill of Lading</option>
                                <option value="PO">Purchase Order</option>
                                <option value="COO">Certificate of Origin</option>
                                <option value="INSURANCE_CERT">Insurance Certificate</option>
                            </select>
                        ) : (
                            <p className="text-content-primary font-semibold">{formatDocType(document.doc_type)}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Owner Organization</label>
                        <p className="text-content-primary font-semibold">{document.owner?.org_name || 'Unknown'}</p>
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Issued Date</label>
                        {isEditing ? (
                            <input
                                type="date"
                                className="input-field w-full"
                                value={editForm.issued_at ? new Date(editForm.issued_at).toISOString().split('T')[0] : ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, issued_at: e.target.value })}
                            />
                        ) : (
                            <p className="text-content-primary font-semibold">
                                {formatDateShortIST(document.issued_at)}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-muted text-sm block mb-1">Upload Date</label>
                        <p className="text-content-primary font-semibold">
                            {formatDateShortIST(document.created_at)}
                        </p>
                    </div>
                </div>
            </ElevatedPanel>

            {/* Blockchain Verification */}
            <ElevatedPanel className="mb-5">
                <h2 className="text-2xl font-bold text-content-primary mb-6 flex items-center gap-2">
                    <ShieldCheck size={24} className="text-green-500" />
                    <span>Blockchain Verification</span>
                </h2>

                <div className="space-y-6">
                    {/* SHA-256 Hash */}
                    <div>
                        <label className="text-muted text-sm block mb-2">Document Hash (SHA-256)</label>
                        <div className="panel-surface">
                            <p className="text-lime-400 text-lg font-mono tracking-wider break-all bg-black/30 p-3 rounded border border-white/10">                             {document.hash}
                            </p>
                        </div>
                        <p className="text-xs text-muted mt-2">
                            This unique cryptographic hash ensures document integrity on the blockchain
                        </p>
                    </div>

                    {/* Verification Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="panel-surface text-center">
                            <div className="mb-2 flex justify-center text-blue-500">
                                <GitCommit size={32} />
                            </div>
                            <p className="text-content-primary font-semibold mb-1">Blockchain</p>
                            <p className="text-green-500 text-sm font-semibold flex items-center justify-center gap-1">
                                <CheckCircle size={14} /> Verified
                            </p>
                        </div>

                        <div className="panel-surface text-center">
                            <div className="mb-2 flex justify-center text-blue-500">
                                <Lock size={32} />
                            </div>
                            <p className="text-content-primary font-semibold mb-1">Encryption</p>
                            <p className="text-lime-400 text-sm font-semibold">SHA-256</p>
                        </div>

                        <div className="panel-surface text-center">
                            <div className="mb-2 flex justify-center text-blue-500">
                                <CheckCircle size={32} />
                            </div>
                            <p className="text-content-primary font-semibold mb-1">Status</p>
                            <p className="text-green-500 text-sm font-semibold">Immutable</p>
                        </div>
                    </div>

                    {/* Verify Button for Banks and Admins */}
                    {(user?.role === 'bank' || user?.role === 'admin') && (
                        <div className="pt-4 border-t border-gray-700">
                            <button
                                onClick={handleVerifyDocument}
                                disabled={verifying}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {verifying ? (
                                    <>
                                        <div className="spinner spinner-small border-t-white" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        <span>Run Verification</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </ElevatedPanel>

            {/* Ledger Hash Chain Timeline */}
            <ElevatedPanel className="mb-5">
                <h2 className="text-2xl font-bold text-content-primary mb-6 flex items-center gap-2">
                    <LinkIcon size={24} className="text-blue-400" />
                    <span>Ledger Hash Chain</span>
                </h2>

                {ledgerEntries.length > 0 ? (
                    <AuditChainTimeline entries={ledgerEntries.map(entry => ({
                        id: entry.id,
                        action: entry.action,
                        actor: entry.actor?.name || (entry.actor_id ? `User #${entry.actor_id}` : 'System'),
                        timestamp: entry.created_at,
                        previousHash: entry.previous_hash || '',
                        entryHash: entry.entry_hash || '',
                        isValid: entry.entry_metadata?.is_valid
                    }))} />
                ) : (
                    <div className="text-center py-12">
                        <div className="mb-4 text-secondary flex justify-center">
                            <LinkIcon size={48} />
                        </div>
                        <p className="text-secondary">
                            No ledger entries found for this document
                        </p>
                    </div>
                )}
            </ElevatedPanel>

            {/* File Access */}
            <ElevatedPanel>
                <h2 className="text-2xl font-bold text-content-primary mb-6 flex items-center gap-2">
                    <FolderOpen size={24} className="text-blue-400" />
                    <span>File Access</span>
                </h2>

                <div className="panel-surface">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-blue-500">
                                <FileText size={48} />
                            </div>
                            <div>
                                <p className="text-content-primary font-semibold text-lg">Document File</p>
                                <p className="text-secondary text-sm">Securely stored and encrypted</p>
                            </div>
                        </div>

                        <button onClick={handleViewFile} className="btn-secondary flex items-center gap-2">
                            <Eye size={16} />
                            <span>View File</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 alert alert-info flex items-start gap-4">
                    <div className="mt-1">
                        <Lock size={24} />
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Access Control</p>
                        <p>Only authorized users can view and download this document. All access is logged and recorded on the blockchain for audit purposes.</p>
                    </div>
                </div>
            </ElevatedPanel>

            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Delete Document"
                message="Are you sure you want to delete this document? This action cannot be undone."
                confirmText="Delete"
                isDestructive={true}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}

