import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';

export default function CreateTradePage() {
    const [buyerId, setBuyerId] = useState('');
    const [sellerId, setSellerId] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-dark">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/trades')}
                        className="text-lime hover:underline mb-4 flex items-center gap-2"
                    >
                        ← Back to Trades
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Create New Trade
                    </h1>
                    <p className="text-secondary">
                        Initiate a new trade transaction between parties
                    </p>
                </div>

                {/* Current User Info */}
                <div className="modern-card bg-dark-elevated mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Your Information</h3>
                            <p className="text-secondary text-sm">You are creating this trade as: <span className="text-white">{user?.name}</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted">Your User ID</p>
                            <p className="text-3xl font-bold text-lime" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                #{user?.id}
                            </p>
                        </div>
                    </div>
                    {user?.role !== 'admin' && (
                        <div className="mt-4 p-3 bg-dark border border-lime/30 rounded-lg">
                            <p className="text-xs text-secondary">
                                ℹ️ <strong className="text-white">Important:</strong> You must be either the buyer or seller in this trade.
                                Use <strong className="text-lime">#{user?.id}</strong> as either Buyer ID or Seller ID.
                            </p>
                        </div>
                    )}
                </div>

                {/* Form Card */}
                <div className="modern-card-lime">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Buyer ID */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Buyer User ID *
                            </label>
                            <input
                                type="number"
                                value={buyerId}
                                onChange={(e) => setBuyerId(e.target.value)}
                                className="modern-input"
                                placeholder={user?.role !== 'admin' ? `Enter ${user?.id} (your ID) or partner's ID` : 'Enter buyer user ID'}
                                required
                                min="1"
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
                                type="number"
                                value={sellerId}
                                onChange={(e) => setSellerId(e.target.value)}
                                className="modern-input"
                                placeholder={user?.role !== 'admin' ? `Enter ${user?.id} (your ID) or partner's ID` : 'Enter seller user ID'}
                                required
                                min="1"
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
                                className="modern-input"
                                placeholder="Enter amount (e.g., 1000.00)"
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
                                className="modern-input"
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                                <option value="CNY">CNY - Chinese Yuan</option>
                                <option value="INR">INR - Indian Rupee</option>
                            </select>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-dark-elevated border border-border-dark rounded-xl">
                            <h4 className="text-sm font-semibold text-white mb-2">Trade Details</h4>
                            <ul className="text-sm text-secondary space-y-1">
                                <li>✓ Trade will start in PENDING status</li>
                                <li>✓ Blockchain ledger entry will be created automatically</li>
                                {user?.role !== 'admin' && (
                                    <li>✓ You must be either the buyer (#{buyerId || '___'}) or seller (#{sellerId || '___'})</li>
                                )}
                                <li>✓ Status can be updated after creation</li>
                            </ul>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/trades')}
                                className="btn-dark flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-lime flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner w-5 h-5 border-dark" />
                                        Creating...
                                    </span>
                                ) : (
                                    '➕ Create Trade'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Help Section */}
                <div className="mt-8 modern-card">
                    <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Need Help?
                    </h3>
                    <div className="space-y-2 text-sm text-secondary">
                        <p><strong className="text-white">Q: What IDs should I use?</strong></p>
                        <p>A: Your User ID is <strong className="text-lime">#{user?.id}</strong>.
                            {user?.role !== 'admin' && ' You MUST use this as either Buyer ID or Seller ID.'}
                            {' '}Contact your trading partner for their User ID.</p>

                        <p className="mt-4"><strong className="text-white">Q: Why am I getting "forbidden" errors?</strong></p>
                        <p>A: {user?.role === 'admin'
                            ? 'As admin, you can create any trade. Ensure buyer and seller are Corporate or Bank users.'
                            : `You must be either the buyer or seller. Use your ID (${user?.id}) in one of the fields.`}
                        </p>

                        <p className="mt-4"><strong className="text-white">Q: Can I modify a trade after creation?</strong></p>
                        <p>A: You can update the trade status but not the parties or amount</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
