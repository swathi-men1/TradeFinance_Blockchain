import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { Document } from '../types/document.types';
import { formatDate } from '../utils';

export default function CreateTradePage() {
    const [buyerCode, setBuyerCode] = useState('');
    const [sellerCode, setSellerCode] = useState('');
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
        if (!buyerCode || !sellerCode || !amount) {
            setError('All fields are required');
            return;
        }

        if (parseFloat(amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        if (buyerCode.toUpperCase() === sellerCode.toUpperCase()) {
            setError('Buyer and seller must be different users');
            return;
        }

        // Role validation
        const currentUserCode = user?.user_code?.toUpperCase();
        const buyerCodeUpper = buyerCode.toUpperCase();
        const sellerCodeUpper = sellerCode.toUpperCase();

        if (user?.role === 'bank') {
            if (buyerCodeUpper === currentUserCode || sellerCodeUpper === currentUserCode) {
                setError("Bank users cannot be parties (buyer/seller) in a trade. Please enter Corporate User Codes (e.g., CORP-001, CORP-002).");
                return;
            }
        } else if (user?.role !== 'admin') {
            // Corporate users must be one of the parties
            if (buyerCodeUpper !== currentUserCode && sellerCodeUpper !== currentUserCode) {
                setError(`You must be either the buyer or seller. Your User Code is: ${currentUserCode}`);
                return;
            }
        }

        try {
            setLoading(true);
            const tradeData = await tradeService.createTrade({
                buyer_code: buyerCodeUpper,
                seller_code: sellerCodeUpper,
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
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-4xl relative z-10">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(user?.role === 'bank' ? '/bank/trades' : '/trades')}
                    className="text-blue-600 hover:text-blue-800 transition-colors mb-4 flex items-center gap-2 font-semibold"
                >
                    <span>←</span>
                    <span>Back to Trades</span>
                </button>
                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                    Create New Trade
                </h1>
                <p className="text-slate-600">
                    Initiate a new trade transaction between parties
                </p>
            </div>

            {/* Current User Info - Important Notice */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-[28px] p-6 mb-8">
                <div className="flex gap-4">
                    <span className="text-3xl flex-shrink-0">ℹ️</span>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 mb-2">Your Information</p>
                        <p className="text-slate-700 text-sm">
                            <strong>Name:</strong> {user?.name}
                        </p>
                        <p className="text-slate-700 text-sm mt-1">
                            <strong>Your Numeric User ID:</strong> <span className="font-mono bg-white px-3 py-1 rounded border-2 border-blue-300 font-bold text-base">{user?.id}</span>
                        </p>
                        <p className="text-slate-700 text-sm mt-1">
                            <strong>Your User Code:</strong> <span className="font-mono bg-white px-3 py-1 rounded border-2 border-blue-300 font-bold">{user?.user_code}</span>
                        </p>
                        {user?.role === 'bank' ? (
                            <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border-2 border-emerald-200">
                                <strong>Note:</strong> This trade will be created between two Corporate Users. You are acting as the facilitating bank. Use Corporate IDs (14, 15, or 16).
                            </div>
                        ) : user?.role !== 'admin' && (
                            <p className="text-slate-700 text-sm mt-3 flex items-start gap-2">
                                <span>⚠️</span>
                                <span><strong>Important:</strong> You must be either the buyer or seller in this trade. Use your numeric ID: <span className="font-mono bg-white px-2 py-1 rounded border border-amber-300 font-bold">{user?.id}</span> and your partner's ID (or another corporate user ID).</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-8 mb-8">
                {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3 mb-6">
                        <span className="text-2xl flex-shrink-0">⚠️</span>
                        <span className="text-red-800 font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Buyer ID */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Buyer User ID (Numeric) *
                        </label>
                        <input
                            type="text"
                            value={buyerId}
                            onChange={(e) => setBuyerId(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/95 transition-all"
                            placeholder={user?.role !== 'admin' ? `E.g., ${user?.id} (your ID) or partner's ID like 14, 15, 16` : 'E.g., 14, 15, 16 (corporate users)'}
                            required
                        />
                        <p className="mt-2 text-xs text-slate-600">
                            {user?.role === 'admin' || user?.role === 'bank'
                                ? 'Use Corporate User IDs: 14 (CORP-001), 15 (CORP-002), 16 (CORP-003)'
                                : `Use your ID (${user?.id}) here if you're the buyer`}
                        </p>
                    </div>

                    {/* Seller ID */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Seller User ID (Numeric) *
                        </label>
                        <input
                            type="text"
                            value={sellerId}
                            onChange={(e) => setSellerId(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/95 transition-all"
                            placeholder={user?.role !== 'admin' ? `E.g., ${user?.id} (your ID) or partner's ID like 14, 15, 16` : 'E.g., 14, 15, 16 (corporate users)'}
                            required
                        />
                        <p className="mt-2 text-xs text-slate-600">
                            {user?.role === 'admin' || user?.role === 'bank'
                                ? 'Use Corporate User IDs: 14 (CORP-001), 15 (CORP-002), 16 (CORP-003)'
                                : `Use your ID (${user?.id}) here if you're the seller`}
                        </p>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Trade Amount *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/95 transition-all"
                            placeholder="Enter amount (e.g., 50000.00)"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                            Currency *
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white/95 transition-all"
                        >
                            <option value="USD">💵 USD - US Dollar</option>
                            <option value="INR">₹ INR - Indian Rupees</option>
                            <option value="EUR">€ EUR - Euro</option>
                            <option value="GBP">£ GBP - British Pound</option>
                            <option value="JPY">¥ JPY - Japanese Yen</option>
                            <option value="AUD">$ AUD - Australian Dollar</option>
                            <option value="CAD">$ CAD - Canadian Dollar</option>
                            <option value="CHF">CHF - Swiss Franc</option>
                            <option value="CNY">¥ CNY - Chinese Yuan</option>
                            <option value="SGD">$ SGD - Singapore Dollar</option>
                        </select>
                    </div>

                    {/* Document Attachment Section for Bank and Corporate Users */}
                    {user && (user.role === 'bank' || user.role === 'corporate') && (
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-3">
                                📄 Related Documents
                            </label>
                            <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6">
                                {loadingDocuments ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="spinner mx-auto mb-4" />
                                        <span className="text-slate-600 ml-3">Loading documents...</span>
                                    </div>
                                ) : documents.length > 0 ? (
                                    <>
                                        <div className="mb-4">
                                            <p className="text-sm text-slate-700 mb-3">
                                                Select documents to attach to this trade. These documents will be linked and available for verification.
                                            </p>
                                            <div className="text-sm font-bold text-blue-600 mb-4">
                                                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {documents.map((doc) => (
                                                <div key={doc.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        id={`doc-${doc.id}`}
                                                        checked={selectedDocuments.includes(doc.id)}
                                                        onChange={() => handleDocumentToggle(doc.id)}
                                                        className="mt-1 w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <label htmlFor={`doc-${doc.id}`} className="flex-1 cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono font-bold">
                                                                {doc.doc_type.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-slate-900 font-semibold">{doc.doc_number}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-600 mt-1">
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
                                        <p className="text-slate-700 font-semibold mb-2">
                                            No documents found in your repository
                                        </p>
                                        <p className="text-sm text-slate-600 mb-6">
                                            You need to upload documents first before creating a trade.
                                        </p>
                                        <Link
                                            to="/upload"
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
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
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6">
                        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span>📋</span>
                            <span>Trade Details</span>
                        </h4>
                        <ul className="text-sm text-slate-700 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>Trade will start in PENDING status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>Blockchain ledger entry will be created automatically</span>
                            </li>
                            {user?.role === 'bank' && (
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">ℹ️</span>
                                    <span>Bank acts as facilitator (cannot be buyer/seller)</span>
                                </li>
                            )}
                            {user?.role !== 'admin' && user?.role !== 'bank' && (
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 font-bold">⚠️</span>
                                    <span>You must be either the buyer (#{buyerId || '___'}) or seller (#{sellerId || '___'})</span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>Status can be updated after creation</span>
                            </li>
                        </ul>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4 border-t-2 border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate('/trades')}
                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-lg transition-all disabled:opacity-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner w-4 h-4" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>➕</span>
                                    <span>Create Trade</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Help Section */}
            <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span>❓</span>
                    <span>User Directory & Reference</span>
                </h3>
                
                {/* User Code Reference Table */}
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span>👥</span>
                        <span>Available Users & Their IDs</span>
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-300 bg-slate-50">
                                    <th className="text-left px-4 py-3 font-bold text-slate-900">User Code</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-900">User ID</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-900">Name</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-900">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-blue-50">
                                    <td className="px-4 py-3 font-mono font-bold text-blue-600">ADM-001</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">11</td>
                                    <td className="px-4 py-3 text-slate-700">System Administrator</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">Admin</span></td>
                                </tr>
                                <tr className="hover:bg-blue-50">
                                    <td className="px-4 py-3 font-mono font-bold text-green-600">BANK-001</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">12</td>
                                    <td className="px-4 py-3 text-slate-700">Sarah Banking</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Bank</span></td>
                                </tr>
                                <tr className="hover:bg-blue-50">
                                    <td className="px-4 py-3 font-mono font-bold text-green-600">BANK-002</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">13</td>
                                    <td className="px-4 py-3 text-slate-700">David European Bank</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Bank</span></td>
                                </tr>
                                <tr className="hover:bg-cyan-50 border-2 border-cyan-300">
                                    <td className="px-4 py-3 font-mono font-bold text-cyan-600">CORP-001</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">14</td>
                                    <td className="px-4 py-3 text-slate-700">John Corporate</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-bold">Corporate</span></td>
                                </tr>
                                <tr className="hover:bg-cyan-50 border-2 border-cyan-300">
                                    <td className="px-4 py-3 font-mono font-bold text-cyan-600">CORP-002</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">15</td>
                                    <td className="px-4 py-3 text-slate-700">Emily Tech Trading</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-bold">Corporate</span></td>
                                </tr>
                                <tr className="hover:bg-cyan-50 border-2 border-cyan-300">
                                    <td className="px-4 py-3 font-mono font-bold text-cyan-600">CORP-003</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">16</td>
                                    <td className="px-4 py-3 text-slate-700">Lisa Asia Trade</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-bold">Corporate</span></td>
                                </tr>
                                <tr className="hover:bg-orange-50">
                                    <td className="px-4 py-3 font-mono font-bold text-orange-600">AUD-001</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">17</td>
                                    <td className="px-4 py-3 text-slate-700">Michael Auditor</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">Auditor</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQs */}
                <div className="space-y-6 text-sm text-slate-700 border-t-2 border-slate-200 pt-8">
                    <div>
                        <p className="text-slate-900 font-bold mb-2">Q: What IDs should I use?</p>
                        <p className="text-slate-700">
                            A: Use the <strong>numeric User ID</strong> (e.g., <span className="font-mono bg-blue-50 px-2 py-1 rounded border border-blue-300">14</span>), not the user code. Your User Code is <span className="font-mono bg-blue-50 px-2 py-1 rounded border border-blue-300">{user?.user_code}</span>.
                            {user?.role !== 'admin' && user?.role !== 'bank' && ' Please provide this to your trading partner.'}
                            {' '}See the table above to find user IDs.
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-900 font-bold mb-2">Q: Which users can participate in trades?</p>
                        <p className="text-slate-700">
                            <strong>Corporate users (CORP-001, CORP-002, CORP-003)</strong> can be buyers and sellers. 
                            {user?.role === 'bank' && ' As a Bank, you cannot be a party but you can create trades between corporates.'}
                            Use their numeric IDs: <span className="font-mono bg-cyan-50 px-2 py-1 rounded border border-cyan-300">14, 15, 16</span>
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-900 font-bold mb-2">Q: Why am I getting "forbidden" errors?</p>
                        <p className="text-slate-700">
                            A: {user?.role === 'admin' || user?.role === 'bank'
                                ? 'As Bank/Admin, ensure buyer and seller are valid Corporate User IDs (14, 15, or 16).'
                                : `You must be either the buyer or seller. Your User ID is ${user?.id}. Use your ID and a trading partner's ID.`}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-900 font-bold mb-2">Q: Can I modify a trade after creation?</p>
                        <p className="text-slate-700">You can update the trade status but not the parties or amount after creation.</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}
