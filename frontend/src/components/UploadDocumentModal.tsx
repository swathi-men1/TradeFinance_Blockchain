import { useState } from 'react';
import { bankService } from '../services/bankService';

interface UploadDocumentModalProps {
    onClose: () => void;
    onUploadSuccess: () => void;
}

export default function UploadDocumentModal({ onClose, onUploadSuccess }: UploadDocumentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('LOC');
    const [docNumber, setDocNumber] = useState('');
    const [tradeId, setTradeId] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file");
            return;
        }

        setProcessing(true);
        try {
            // Sanitize tradeId: trim whitespace, send undefined if empty
            const sanitizedTradeId = tradeId.trim() === '' ? undefined : tradeId.trim();

            await bankService.uploadDocument(file, docType, docNumber, sanitizedTradeId);
            onUploadSuccess();
            onClose();
        } catch (error: any) {
            console.error("Upload error details:", error);
            const msg = error.response?.data?.detail || "Upload Failed";
            alert(`Error: ${msg}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                    <h2 className="text-xl font-bold text-gray-100 uppercase tracking-wide">Upload Bank Document</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Document Type</label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                        >
                            <option value="LOC">Letter of Credit (LOC)</option>
                            <option value="INVOICE">Invoice</option>
                            <option value="BILL_OF_LADING">Bill of Lading</option>
                            <option value="PO">Purchase Order</option>
                            <option value="COO">Certificate of Origin</option>
                            <option value="INSURANCE_CERT">Insurance Certificate</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Document Number</label>
                        <input
                            type="text"
                            value={docNumber}
                            onChange={(e) => setDocNumber(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            placeholder="e.g. LOC-2024-001"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trade Transaction ID</label>
                        <input
                            type="text"
                            value={tradeId}
                            onChange={(e) => setTradeId(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            placeholder="Optional: Link to Trade #ID"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">File</label>
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded px-3 py-2 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-500 transition-colors uppercase tracking-wider ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {processing ? 'Processing...' : 'Upload & Hash'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
