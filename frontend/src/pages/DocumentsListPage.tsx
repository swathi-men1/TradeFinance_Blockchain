/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { Document } from '../types/document.types';
import { useAuth } from '../context/AuthContext';
import { CertificateCard } from '../components/audit/CertificateCard';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { Button } from '../components/common/Button';
import { FilterTabs } from '../components/common/FilterTabs';
import {
    Upload,
    Search,
    FileText,
    FileCheck,
    Receipt,
    ClipboardList,
    AlertTriangle,
    Inbox,
    Filter
} from 'lucide-react';

export default function DocumentsListPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const { user } = useAuth();
    const toast = useToast();
    const [deleteDocId, setDeleteDocId] = useState<number | null>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

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

    const handleDelete = async (id: number) => {
        try {
            await documentService.deleteDocument(id);
            setDocuments(documents.filter(d => d.id !== id));
            toast.success('Document deleted successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete document');
        } finally {
            setDeleteDocId(null);
        }
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

    // Color-coded filter options
    const filterOptions = [
        { label: 'All Documents', value: 'all', icon: <Filter size={14} />, activeColor: 'bg-slate-600' },
        { label: 'Bill of Lading', value: 'BILL_OF_LADING', icon: <FileText size={14} />, activeColor: 'bg-blue-600' }, // Ocean Blue
        { label: 'Letter of Credit', value: 'LOC', icon: <FileCheck size={14} />, activeColor: 'bg-green-600' }, // Success Green
        { label: 'Invoice', value: 'INVOICE', icon: <Receipt size={14} />, activeColor: 'bg-purple-600' }, // Royal Purple
        { label: 'Purchase Order', value: 'PO', icon: <ClipboardList size={14} />, activeColor: 'bg-amber-600' }, // Warning Amber
    ];

    return (
        <>
            <div className="fade-in space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary mb-1">
                            Trade Documents
                        </h1>
                        <p className="text-sm text-secondary">
                            Manage and track your secured trade documentation ({documents.length} total)
                        </p>
                    </div>
                    {user?.role !== 'auditor' && (
                        <Link to="/upload">
                            <Button icon={<Upload size={18} />}>
                                Upload Document
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by document number, type, or organization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    </div>

                    {/* Standardized Filter Tabs with Color Coding */}
                    <div className="flex overflow-x-auto pb-2 -mx-2 px-2 md:pb-0 md:mx-0 md:px-0">
                        <FilterTabs
                            options={filterOptions}
                            currentValue={typeFilter}
                            onChange={setTypeFilter}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error">
                        <AlertTriangle size={24} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Documents Grid */}
                {filteredDocuments.length === 0 ? (
                    <ElevatedPanel className="text-center py-16">
                        <div className="mb-4 text-secondary flex justify-center">
                            <div className="p-4 bg-white/5 rounded-full">
                                <Inbox size={40} className="opacity-50" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-content-primary mb-2">
                            No Documents Found
                        </h3>
                        <p className="text-sm text-secondary mb-6 max-w-md mx-auto">
                            {searchTerm || typeFilter !== 'all'
                                ? 'We couldn\'t find any documents matching your current filters. Try adjusting your search criteria.'
                                : 'You haven\'t uploaded any documents yet. Upload a Bill of Lading, Invoice, or Purchase Order to get started.'}
                        </p>
                        {user?.role !== 'auditor' && !searchTerm && typeFilter === 'all' && (
                            <Link to="/upload">
                                <Button variant="secondary" icon={<Upload size={16} />}>
                                    Upload First Document
                                </Button>
                            </Link>
                        )}
                    </ElevatedPanel>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments.map((doc) => (
                            <CertificateCard
                                key={doc.id}
                                id={doc.id}
                                docType={doc.doc_type}
                                docNumber={doc.doc_number}
                                ownerName={doc.owner?.name || 'Unknown'}
                                ownerOrg={doc.owner?.org_name}
                                uploadedAt={doc.created_at}
                                status="verified"
                                onDelete={user?.role === 'admin' ? () => setDeleteDocId(doc.id) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteDocId !== null}
                title="Delete Document"
                message="Are you sure you want to delete this document? This action cannot be undone."
                confirmText="Delete"
                isDestructive={true}
                onConfirm={() => deleteDocId !== null && handleDelete(deleteDocId)}
                onCancel={() => setDeleteDocId(null)}
            />
        </>
    );
}
