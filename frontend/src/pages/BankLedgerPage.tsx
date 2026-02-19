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

    useEffect(() => {
        loadLedger();
    }, []);

    const loadLedger = async () => {
        try {
            const data = await bankService.getLedger();
            setEntries(data);
        } catch (error) {
            console.error("Failed to load ledger", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-400">Loading ledger...</div>;

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-gray-100 font-mono">
            <header className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
                <h1 className="text-xl font-bold uppercase tracking-widest text-emerald-400">Immutable Ledger</h1>
                <span className="text-xs text-gray-500">{entries.length} Recorded Events</span>
            </header>

            <div className="overflow-hidden border border-gray-800 rounded">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Actor ID</th>
                            <th className="p-4">Target Document ID</th>
                            <th className="p-4">Metadata</th>
                            <th className="p-4 text-right">Hash (Proof)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-800 transition-colors">
                                <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                                    {new Date(entry.created_at).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${entry.action === 'VERIFIED' ? 'bg-green-900/50 text-green-200' :
                                        entry.action === 'AMENDED' ? 'bg-blue-900/50 text-blue-200' :
                                            entry.action === 'DOCUMENT_UPLOADED' ? 'bg-purple-900/50 text-purple-200' :
                                                'bg-gray-700 text-gray-300'
                                        }`}>
                                        {entry.action}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-300">User #{entry.actor_id}</td>
                                <td className="p-4 text-gray-400">
                                    {entry.document_id ? `#${entry.document_id}` : '-'}
                                </td>
                                <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={JSON.stringify(entry.entry_metadata || {}, null, 2)}>
                                    {entry.entry_metadata ? JSON.stringify(entry.entry_metadata) : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2" title={entry.entry_hash}>
                                        <span className="text-xs font-mono text-emerald-600 truncate max-w-[100px]">
                                            {entry.entry_hash}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {entries.length === 0 && (
                    <div className="p-8 text-center text-gray-600 italic">No ledger entries found.</div>
                )}
            </div>
        </div>
    );
}

