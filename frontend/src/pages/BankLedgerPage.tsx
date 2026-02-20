import { useState, useEffect } from 'react';
import { bankService, BankLedgerEntry } from '../services/bankService';

/**
 * BankLedgerPage Component
 * 
 * Implements the "Ledger Explorer" view.
 * Fetches and displays the immutable audit log from the backend.
 * Columns: Timestamp, Action, Actor ID, Target Document ID, Metadata, Hash.
 */
export default function BankLedgerPage() {
    // augment the type locally if needed, or assume bankService returns it.
    // bankService.ts BankLedgerEntry definition has entry_hash but not metadata.
    // I will cast or assume it's there if the backend sends it.
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadLedger();
    }, []);

    const loadLedger = async () => {
        try {
            const data = await bankService.getLedger();
            setEntries(data);
            setError('');
        } catch (error) {
            console.error("Failed to load ledger", error);
            setError('Failed to load ledger activity');
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
                        Immutable Ledger
                    </h1>
                    <p className="text-slate-600">
                        Recorded transaction history and audit log
                    </p>
                </div>
                <div className="px-4 py-2 bg-blue-100 border-2 border-blue-200 rounded-lg text-sm font-bold text-blue-700">
                    {entries.length} Recorded Events
                </div>
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
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Actor ID</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Target Document</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Metadata</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Hash (Proof)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-medium">
                                        📭 No ledger entries found.
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
                                                entry.action === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                                entry.action === 'AMENDED' ? 'bg-blue-100 text-blue-700' :
                                                entry.action === 'DOCUMENT_UPLOADED' ? 'bg-purple-100 text-purple-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {entry.action === 'VERIFIED' && '✓'}
                                                {entry.action === 'AMENDED' && '✏️'}
                                                {entry.action === 'DOCUMENT_UPLOADED' && '📤'}
                                                {!['VERIFIED', 'AMENDED', 'DOCUMENT_UPLOADED'].includes(entry.action) && '⏳'}
                                                {entry.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 font-mono">
                                            User #{entry.actor_id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {entry.document_id ? (
                                                <span className="font-mono bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                                                    ##{entry.document_id}
                                                </span>
                                            ) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate" title={JSON.stringify(entry.entry_metadata || {}, null, 2)}>
                                            {entry.entry_metadata ? JSON.stringify(entry.entry_metadata) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 group cursor-pointer" title={entry.entry_hash}>
                                                <span className="text-xs font-mono text-blue-600 truncate max-w-[120px] group-hover:text-blue-800 transition-colors">
                                                    {entry.entry_hash?.substring(0, 12) || entry.entry_hash}
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

