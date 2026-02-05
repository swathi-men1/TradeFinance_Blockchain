/* Author: Abdul Samad | */
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { FileText, Upload, Search, Filter, ShieldCheck, Check, X, Trash2 } from 'lucide-react';
import { formatShortDate } from '../utils/formatDate';
import { DOCUMENT_TYPES } from '../utils/constants';
import type { Document, DocumentType } from '../types/document.types';

export const Documents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState<DocumentType | ''>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadData, setUploadData] = useState<{
        file: File | null;
        doc_type: DocumentType;
        doc_number: string;
        issued_at: string;
    }>({
        file: null,
        doc_type: 'INVOICE',
        doc_number: '',
        issued_at: new Date().toISOString().split('T')[0],
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentService.getDocuments();
            setDocuments(data);

            setDocuments(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file) {
            setError('Please select a file');
            return;
        }

        try {
            setUploading(true);
            setError('');
            const uploadedDoc = await documentService.uploadDocument({
                file: uploadData.file,
                doc_type: uploadData.doc_type,
                doc_number: uploadData.doc_number,
                issued_at: uploadData.issued_at,
            });
            setShowUploadForm(false);
            setUploadData({
                file: null,
                doc_type: 'INVOICE',
                doc_number: '',
                issued_at: new Date().toISOString().split('T')[0],
            });
            // Refresh list
            fetchDocuments();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleVerify = async (id: number) => {
        try {
            const result = await documentService.verifyIntegrity(id);
            alert(`Verification Result: ${result.status}\nMessage: ${result.message || 'Integrity Checked'}`);
        } catch (err: any) {
            alert('Verification Failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleStatusUpdate = async (id: number, status: 'ACCEPTED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${status} this document?`)) return;
        try {
            await documentService.updateStatus(id, status);
            fetchDocuments(); // Refresh to show new status
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Status update failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document? This action requires Admin/Bank privileges.')) return;
        try {
            await documentService.deleteDocument(id);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Delete failed');
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesType = !filterType || doc.doc_type === filterType;
        const matchesSearch = !searchQuery ||
            doc.doc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.doc_type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const canUpload = user && ['bank', 'corporate', 'admin'].includes(user.role);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    {canUpload && (
                        <Button
                            onClick={() => setShowUploadForm(!showUploadForm)}
                            className="flex items-center space-x-2"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Upload Document</span>
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {showUploadForm && canUpload && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload New Document</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    File
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                    className="block w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Document Type
                                    </label>
                                    <select
                                        value={uploadData.doc_type}
                                        onChange={(e) => setUploadData({ ...uploadData, doc_type: e.target.value as DocumentType })}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                                            <option key={value} value={value}>{key.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Document Number
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadData.doc_number}
                                        onChange={(e) => setUploadData({ ...uploadData, doc_number: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="INV-2026-001"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Issued Date
                                    </label>
                                    <input
                                        type="date"
                                        value={uploadData.issued_at}
                                        onChange={(e) => setUploadData({ ...uploadData, issued_at: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <Button type="submit" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => setShowUploadForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div className="flex items-center space-x-2 flex-1">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by document number or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as DocumentType | '')}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                                    <option key={value} value={value}>{key.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : filteredDocuments.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400">
                                {documents.length === 0
                                    ? 'No documents yet. Upload your first document to get started.'
                                    : 'No documents match your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Document
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Hash
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Issued Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {doc.doc_number}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={doc.doc_type} type="status" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={doc.status}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    {doc.hash.substring(0, 16)}...
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {formatShortDate(doc.issued_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {formatShortDate(doc.issued_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {['bank', 'auditor', 'admin'].includes(user?.role || '') && (
                                                        <button
                                                            onClick={() => handleVerify(doc.id)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                            title="Verify Integrity"
                                                        >
                                                            <ShieldCheck className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {user?.role === 'bank' && doc.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(doc.id, 'ACCEPTED')}
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                title="Accept Document"
                                                            >
                                                                <Check className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(doc.id, 'REJECTED')}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Reject Document"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {['admin', 'bank'].includes(user?.role || '') && (
                                                        <button
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
