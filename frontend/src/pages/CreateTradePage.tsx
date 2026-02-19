/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { Document } from '../types/document.types';
import { formatDate } from '../utils';
import { Button } from '../components/common/Button';
import {
    Info,
    AlertTriangle,
    DollarSign,
    FileText,
    Upload,
    ClipboardList,
    CheckCircle,
    Plus,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';

export default function CreateTradePage() {
    const [buyerId, setBuyerId] = useState('');
    const [sellerId, setSellerId] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Load user's documents for bank and corporate users
    useEffect(() => {
        if (user && (user.role === 'bank' || user.role === 'corporate')) {
            loadUserDocuments();
        }
    }, [user]);

    const loadUserDocuments = async () => {
        try {
            setLoadingDocuments(true);
            const userDocs = await documentService.getDocuments();
            setDocuments(userDocs);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoadingDocuments(false);
        }
    };

    const handleDocumentToggle = (documentId: number) => {
        setSelectedDocuments(prev =>
            prev.includes(documentId)
                ? prev.filter(id => id !== documentId)
                : [...prev, documentId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!buyerId || !sellerId || !amount) {
            setError('All fields are required');
            return;
        }

        if (parseFloat(amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        if (buyerId === sellerId) {
            setError('Buyer and seller must be different users');
            return;
        }

        // Role validation: current user must be buyer or seller (unless admin)
        if (user?.role !== 'admin') {
            const currentUserId = user?.id?.toString();
            if (buyerId !== currentUserId && sellerId !== currentUserId) {
                setError(`You must be either the buyer or seller. Your User ID is: ${currentUserId}`);
                return;
            }
        }

        try {
            setLoading(true);
            const tradeData = await tradeService.createTrade({
                buyer_id: parseInt(buyerId),
                seller_id: parseInt(sellerId),
                amount: parseFloat(amount),
                currency: currency
            });

            // Attach selected documents to the trade
            if (selectedDocuments.length > 0) {
                for (const documentId of selectedDocuments) {
                    await tradeService.linkDocumentToTrade(tradeData.id, documentId);
                }
            }

            // Success - navigate to trade details
            navigate(`/trades/${tradeData.id}`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create trade';
            setError(errorMsg);
            console.error('Error creating trade:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in max-w-3xl">
            {/* Header */}
            <div className="mb-5">
                <button
                    onClick={() => navigate('/trades')}
                    className="text-secondary hover:text-white transition-colors mb-4 flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Trades</span>
                </button>
                <h1 className="text-2xl font-bold text-content-primary mb-2">
                    Create New Trade
                </h1>
                <p className="text-secondary">
                    Initiate a new trade transaction between parties
                </p>
            </div>

            {/* Current User Info - Important Notice */}
            <div className="alert alert-info mb-5 flex items-start gap-4">
                <Info size={24} className="mt-1" />
                <div>
                    <p className="font-semibold mb-2">Your Information</p>
                    <p className="text-sm">
                        You are creating this trade as: <strong>{user?.name}</strong>
                    </p>
                    <p className="text-sm mt-2">
                        <strong>Your User Code: <span className="text-mono font-bold">{user?.user_code}</span></strong>
                    </p>
                    {user?.role !== 'admin' && (
                        <div className="text-sm mt-2 flex items-start gap-2">
                            <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                            <span>
                                <strong>Important:</strong> You must be either the buyer or seller in this trade.
                                Reference your User Code: <span className="text-mono">{user?.user_code}</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Card */}
            <ElevatedPanel>
                {error && (
                    <div className="alert alert-error mb-6">
                        <AlertTriangle size={24} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Buyer ID */}
                    <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                            Buyer User ID *
                        </label>
                        <input
                            type="text"
                            value={buyerId}
                            onChange={(e) => setBuyerId(e.target.value)}
                            className="input-field"
                            placeholder={user?.role !== 'admin' ? `Enter ${user?.id} (your ID) or partner's ID` : 'Enter buyer user ID'}
                            required
                        />
                        <p className="mt-2 text-xs text-muted">
                            {user?.role === 'admin'
                                ? 'Must be a Corporate or Bank user ID'
                                : `Use your ID (${user?.id}) here if you're the buyer`}
                        </p>
                    </div>

                    {/* Seller ID */}
                    <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                            Seller User ID *
                        </label>
                        <input
                            type="text"
                            value={sellerId}
                            onChange={(e) => setSellerId(e.target.value)}
                            className="input-field"
                            placeholder={user?.role !== 'admin' ? `Enter ${user?.id} (your ID) or partner's ID` : 'Enter seller user ID'}
                            required
                        />
                        <p className="mt-2 text-xs text-muted">
                            {user?.role === 'admin'
                                ? 'Must be different from buyer and a Corporate or Bank user'
                                : `Use your ID (${user?.id}) here if you're the seller`}
                        </p>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                            Trade Amount *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input-field"
                            placeholder="Enter amount (e.g., 50000.00)"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-medium text-content-primary mb-2">
                            Currency *
                        </label>
                        <div className="relative">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="input-field pl-10"
                            >
                                <option value="USD">USD - US Dollar</option>
                            </select>
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        </div>
                    </div>

                    {/* Document Attachment Section for Bank and Corporate Users */}
                    {user && (user.role === 'bank' || user.role === 'corporate') && (
                        <div className="pt-4 border-t border-gray-700">
                            <label className="block text-sm font-medium text-content-primary mb-3">Related Documents</label>
                            <div className="bg-blue-900/10 rounded-xl p-6 border border-blue-500/20">
                                {loadingDocuments ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="spinner spinner-small border-t-white"></div>
                                        <Upload className="mx-auto h-12 w-12 text-lime-400 mb-4" />
                                        <span className="ml-3 text-secondary">Loading documents...</span>
                                    </div>
                                ) : documents.length > 0 ? (
                                    <>
                                        <div className="mb-4">
                                            <p className="text-sm text-secondary mb-3">
                                                Select documents to attach to this trade. These documents will be linked and available for verification.
                                            </p>
                                            <div className="text-sm font-semibold text-lime-400 mb-3">
                                                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {documents.map((doc) => (
                                                <div key={doc.id} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                    <input
                                                        type="checkbox"
                                                        id={`doc-${doc.id}`}
                                                        checked={selectedDocuments.includes(doc.id)}
                                                        onChange={() => handleDocumentToggle(doc.id)}
                                                        className="border-2 border-dashed border-lime-500/50 rounded-lg p-5 text-center cursor-pointer hover:bg-lime-500/10 transition-colors appearance-none"
                                                    />
                                                    <label htmlFor={`doc-${doc.id}`} className="flex-1 cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded font-mono">
                                                                {doc.doc_type.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-content-primary font-medium">{doc.doc_number}</span>
                                                        </div>
                                                        <div className="text-xs text-secondary mt-1">
                                                            {formatDate(doc.uploaded_at || doc.created_at)}
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mb-4 text-blue-500 flex justify-center">
                                            <FileText size={48} />
                                        </div>
                                        <p className="text-secondary mb-4">
                                            No documents found in your repository.
                                        </p>
                                        <p className="text-sm text-secondary mb-6">
                                            You need to upload documents first before creating a trade.
                                        </p>
                                        <Link to="/upload">
                                            <Button variant="primary" icon={<Upload size={18} />}>
                                                Upload Document First
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="panel-surface p-4">
                        <h4 className="text-sm font-semibold text-content-primary mb-3 flex items-center gap-2">
                            <ClipboardList size={18} />
                            <span>Trade Details</span>
                        </h4>
                        <ul className="text-sm text-secondary space-y-2">
                            <li className="flex items-start gap-2">
                                <CheckCircle size={16} className="text-green-500 mt-0.5" />
                                <span>Trade will start in PENDING status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle size={16} className="text-green-500 mt-0.5" />
                                <span>Blockchain ledger entry will be created automatically</span>
                            </li>
                            {user?.role !== 'admin' && (
                                <li className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                                    <span>You must be either the buyer (#{buyerId || '___'}) or seller (#{sellerId || '___'})</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            onClick={() => navigate('/trades')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            disabled={loading}
                            isLoading={loading}
                            icon={<Plus size={18} />}
                        >
                            Create Trade
                        </Button>
                    </div>
                </form>
            </ElevatedPanel>

            {/* Help Section */}
            <ElevatedPanel className="mt-8" hover={false}>
                <h3 className="text-lg font-bold text-content-primary mb-4 flex items-center gap-2">
                    <HelpCircle size={20} className="text-blue-400" />
                    <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-4 text-sm text-secondary">
                    <div>
                        <p className="text-content-primary font-semibold mb-1">Q: What IDs should I use?</p>
                        <p className="text-sm">
                            A: Your User Code is <span className="text-mono font-bold text-content-primary">{user?.user_code}</span>.
                            {user?.role !== 'admin' && ' Please provide this to your trading partner.'}
                            {' '}Contact your trading partner for their User Code for trade setup.
                        </p>
                    </div>

                    <div>
                        <p className="text-content-primary font-semibold mb-1">Q: Why am I getting "forbidden" errors?</p>
                        <p>
                            A: {user?.role === 'admin'
                                ? 'As admin, you can create any trade. Ensure buyer and seller are Corporate or Bank users.'
                                : `You must be either the buyer or seller. Your User Code is ${user?.user_code}.`}
                        </p>
                    </div>
                </div>
            </ElevatedPanel>
        </div>
    );
}
