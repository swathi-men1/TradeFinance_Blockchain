import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';

interface LedgerEntry {
    id: number;
    action: string;
    actor_id: number;
    document_id: number;
    created_at: string;
    entry_hash: string;
    actor?: {
        name: string;
        role: string;
    };
    entry_metadata?: any;
}

export default function CorporateLedgerPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/corporate/ledger');
            setEntries(response.data);
            setError('');
        } catch (err: any) {
            console.error('Failed to fetch ledger:', err);
            setError(err.response?.data?.detail || 'Failed to load ledger activity');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading immutable ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-6xl mx-auto space-y-8 relative z-10">
            <div className="flex justify-between items-start md:items-center gap-6 flex-col md:flex-row">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                        Ledger Explorer
                    </h1>
                    <p className="text-slate-600">
                        Immutable history of all actions and document changes
                    </p>
                </div>
                <button
                    onClick={fetchLedger}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
                >
                    🔄 Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <span className="text-red-800 font-medium">{error}</span>
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Timestamp</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Action</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Actor</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Target Document</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Hash Proof</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-medium">
                                        📭 No ledger activity found.
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap font-mono">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                                entry.action.includes('UPLOAD') ? 'bg-blue-100 text-blue-700' :
                                                entry.action.includes('REJECT') ? 'bg-red-100 text-red-700' :
                                                entry.action.includes('VERIF') ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {entry.action.includes('UPLOAD') && '📤'}
                                                {entry.action.includes('REJECT') && '❌'}
                                                {entry.action.includes('VERIF') && '✓'}
                                                {!entry.action.includes('UPLOAD') && !entry.action.includes('REJECT') && !entry.action.includes('VERIF') && '⏳'}
                                                {entry.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
                                                    {entry.actor?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="font-medium">{entry.actor?.name || `User #${entry.actor_id}`}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {entry.document_id ? (
                                                <span className="font-mono bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                                                    Doc #{entry.document_id}
                                                </span>
                                            ) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 group cursor-pointer" title={entry.entry_hash}>
                                                <span className="text-xs font-mono text-slate-600 truncate max-w-[120px] group-hover:text-blue-600 transition-colors">
                                                    {entry.entry_hash?.substring(0, 12)}...
                                                </span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(entry.entry_hash)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-600 transition-all p-1 hover:bg-blue-50 rounded"
                                                    title="Copy to clipboard"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        </div>
    );
}
