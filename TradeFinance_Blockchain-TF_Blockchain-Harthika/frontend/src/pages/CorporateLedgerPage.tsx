import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-secondary">Loading immutable ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Ledger Explorer
                    </h1>
                    <p className="text-secondary">
                        Immutable history of all actions and document changes
                    </p>
                </div>
                <button
                    onClick={fetchLedger}
                    className="btn-secondary"
                >
                    🔄 Refresh
                </button>
            </div>

            {error && (
                <div className="alert alert-error mb-6">
                    <span className="text-2xl">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700 bg-white/5">
                                <th className="text-left p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Timestamp</th>
                                <th className="text-left p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Action</th>
                                <th className="text-left p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Actor</th>
                                <th className="text-left p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Target Document</th>
                                <th className="text-left p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Hash Proof</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-secondary">
                                        No ledger activity found.
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-white whitespace-nowrap font-mono">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${entry.action.includes('UPLOAD') ? 'badge-lime' :
                                                    entry.action.includes('REJECT') ? 'badge-error' :
                                                        entry.action.includes('VERIF') ? 'badge-info' :
                                                            'badge-warning'
                                                }`}>
                                                {entry.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                                                    {entry.actor?.name?.charAt(0) || '?'}
                                                </div>
                                                <span>{entry.actor?.name || `User #${entry.actor_id}`}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-secondary">
                                            {entry.document_id ? (
                                                <span className="font-mono bg-black/30 px-2 py-1 rounded">
                                                    Doc #{entry.document_id}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 group cursor-pointer" title={entry.entry_hash}>
                                                <span className="text-xs font-mono text-gray-500 truncate max-w-[100px] group-hover:text-lime transition-colors">
                                                    {entry.entry_hash?.substring(0, 10)}...
                                                </span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(entry.entry_hash)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
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
            </GlassCard>
        </div>
    );
}
