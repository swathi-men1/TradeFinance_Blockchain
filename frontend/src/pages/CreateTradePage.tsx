import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { GlassCard } from '../components/GlassCard';
import { Document } from '../types/document.types';
import { formatDate } from '../utils';

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
            <div className="mb-8">
                <button
                    onClick={() => navigate('/trades')}
                    className="text-secondary hover:text-lime transition-colors mb-4 flex items-center gap-2"
                >
                    <span>←</span>
                    <span>Back to Trades</span>
                </button>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Create New Trade
                </h1>
                <p className="text-secondary">
                    Initiate a new trade transaction between parties
                </p>
            </div>

            {/* Current User Info - Important Notice */}
            <div className="alert alert-info mb-8">
                <span className="text-3xl">ℹ️</span>
                <div>
                    <p className="font-semibold mb-2">Your Information</p>
                    <p className="text-sm">
                        You are creating this trade as: <strong>{user?.name}</strong>
                    </p>
                    <p className="text-sm mt-2">
                        <strong>Your User Code: <span className="user-code user-code-large">{user?.user_code}</span></strong>
                    </p>
                    {user?.role !== 'admin' && (
                        <p className="text-sm mt-2">
                            ⚠️ <strong>Important:</strong> You must be either the buyer or seller in this trade.
                            Reference your User Code: <span className="user-code">{user?.user_code}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Form Card */}
            <GlassCard>
                {error && (
                    <div className="alert alert-error mb-6">
                        <span className="text-2xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Buyer ID */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
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
                        <label className="block text-sm font-medium text-white mb-2">
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
                        <label className="block text-sm font-medium text-white mb-2">
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
                        <label className="block text-sm font-medium text-white mb-2">
                            Currency *
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="input-field"
                        >
                            <option value="USD">💵 USD - US Dollar</option>
                        </select>
                    </div>

                    {/* Document Attachment Section for Bank and Corporate Users */}
                    {user && (user.role === 'bank' || user.role === 'corporate') && (
                        <div className="form-section">
                            <label className="form-label">Related Documents</label>
                            <div className="bg-secondary bg-opacity-20 rounded-xl p-6 border border-secondary border-opacity-30">
                                {loadingDocuments ? (
                                    <div className="flex-center py-4">
                                        <div className="loading-spinner"></div>
                                        <span className="ml-3 text-secondary">Loading documents...</span>
                                    </div>
                                ) : documents.length > 0 ? (
                                    <>
                                        <div className="mb-4">
                                            <p className="text-sm text-secondary mb-3">
                                                Select documents to attach to this trade. These documents will be linked and available for verification.
                                            </p>
                                            <div className="text-sm font-semibold text-lime mb-3">
                                                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {documents.map((doc) => (
                                                <div key={doc.id} className="flex items-start gap-3 p-3 bg-primary bg-opacity-10 rounded-lg border border-primary border-opacity-20">
                                                    <input
                                                        type="checkbox"
                                                        id={`doc-${doc.id}`}
                                                        checked={selectedDocuments.includes(doc.id)}
                                                        onChange={() => handleDocumentToggle(doc.id)}
                                                        className="mt-1 w-4 h-4 text-lime bg-secondary border-secondary rounded focus:ring-lime focus:ring-2"
                                                    />
                                                    <label htmlFor={`doc-${doc.id}`} className="flex-1 cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2 py-1 bg-neon-purple bg-opacity-20 text-neon-purple rounded font-mono">
                                                                {doc.doc_type.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-white font-medium">{doc.doc_number}</span>
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
                                        <div className="text-4xl mb-4">📄</div>
                                        <p className="text-secondary mb-4">
                                            No documents found in your repository.
                                        </p>
                                        <p className="text-sm text-secondary mb-6">
                                            You need to upload documents first before creating a trade.
                                        </p>
                                        <Link
                                            to="/upload"
                                            className="btn-primary inline-flex items-center gap-2"
                                        >
                                            <span>📤</span>
                                            Upload Document First
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="glass-card-flat">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <span>📋</span>
                            <span>Trade Details</span>
                        </h4>
                        <ul className="text-sm text-secondary space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Trade will start in PENDING status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Blockchain ledger entry will be created automatically</span>
                            </li>
                            {user?.role !== 'admin' && (
                                <li className="flex items-start gap-2">
                                    <span className="text-warning">⚠️</span>
                                    <span>You must be either the buyer (#{buyerId || '___'}) or seller (#{sellerId || '___'})</span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Status can be updated after creation</span>
                            </li>
                        </ul>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/trades')}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="spinner spinner-small" style={{ borderTopColor: 'var(--bg-primary)' }} />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>➕</span>
                                    <span>Create Trade</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </GlassCard>

            {/* Help Section */}
            <GlassCard className="mt-8" hover={false}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span>❓</span>
                    <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-4 text-sm text-secondary">
                    <div>
                        <p className="text-white font-semibold mb-1">Q: What IDs should I use?</p>
                        <p className="text-sm">
                            A: Your User Code is <span className="user-code">{user?.user_code}</span>.
                            {user?.role !== 'admin' && ' Please provide this to your trading partner.'}
                            {' '}Contact your trading partner for their User Code for trade setup.
                        </p>
                    </div>

                    <div>
                        <p className="text-white font-semibold mb-1">Q: Why am I getting "forbidden" errors?</p>
                        <p>
                            A: {user?.role === 'admin'
                                ? 'As admin, you can create any trade. Ensure buyer and seller are Corporate or Bank users.'
                                : `You must be either the buyer or seller. Your User Code is ${user?.user_code}.`}
                        </p>
                    </div>

                    <div>
                        <p className="text-white font-semibold mb-1">Q: Can I modify a trade after creation?</p>
                        <p>A: You can update the trade status but not the parties or amount after creation.</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
