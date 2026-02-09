import { useState } from 'react';
import { LedgerEntry } from '../types/ledger.types';

interface HashChainVisualizerProps {
    ledgerEntries: LedgerEntry[];
    documentHash: string;
}

export default function HashChainVisualizer({ ledgerEntries, documentHash }: HashChainVisualizerProps) {
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
    const [showFullHashes, setShowFullHashes] = useState(false);

    const formatHash = (hash: string | null | undefined, full: boolean = false): string => {
        if (!hash) return 'N/A';
        if (full || showFullHashes) return hash;
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getActionColor = (action: string): string => {
        const colors: Record<string, string> = {
            'ISSUED': 'text-green-400',
            'VERIFIED': 'text-blue-400',
            'AMENDED': 'text-yellow-400',
            'SHIPPED': 'text-purple-400',
            'RECEIVED': 'text-indigo-400',
            'PAID': 'text-lime',
            'CANCELLED': 'text-red-400'
        };
        return colors[action] || 'text-white';
    };

    const getActionIcon = (action: string): string => {
        const icons: Record<string, string> = {
            'ISSUED': '📝',
            'VERIFIED': '✅',
            'AMENDED': '✏️',
            'SHIPPED': '🚢',
            'RECEIVED': '📦',
            'PAID': '💰',
            'CANCELLED': '❌'
        };
        return icons[action] || '🔗';
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Blockchain Hash Chain
                    </h3>
                    <p className="text-secondary text-sm">
                        Cryptographic ledger ensuring tamper-proof document history
                    </p>
                </div>
                <button
                    onClick={() => setShowFullHashes(!showFullHashes)}
                    className="btn-outline-lime text-xs px-4 py-2"
                >
                    {showFullHashes ? 'Show Short Hashes' : 'Show Full Hashes'}
                </button>
            </div>

            {/* Document Hash Card */}
            <div className="modern-card bg-gradient-to-br from-lime/10 to-transparent border-lime/30">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Document Hash (SHA-256)</h4>
                        <p className="text-xs text-secondary">Original file integrity fingerprint</p>
                    </div>
                </div>
                <div className="bg-dark-elevated p-3 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                        <code className="text-lime text-xs break-all font-mono flex-1">
                            {formatHash(documentHash, true)}
                        </code>
                        <button
                            onClick={() => copyToClipboard(documentHash)}
                            className="text-secondary hover:text-lime transition-colors px-2 py-1 text-xs"
                            title="Copy hash"
                        >
                            📋
                        </button>
                    </div>
                </div>
            </div>

            {/* Chain Integrity Status */}
            <div className="grid grid-cols-3 gap-4">
                <div className="modern-card bg-dark-elevated text-center">
                    <div className="text-3xl mb-2">🔗</div>
                    <div className="text-2xl font-bold text-white">{ledgerEntries.length}</div>
                    <div className="text-xs text-secondary">Chain Entries</div>
                </div>
                <div className="modern-card bg-dark-elevated text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold text-lime">Valid</div>
                    <div className="text-xs text-secondary">Chain Status</div>
                </div>
                <div className="modern-card bg-dark-elevated text-center">
                    <div className="text-3xl mb-2">🛡️</div>
                    <div className="text-2xl font-bold text-white">256-bit</div>
                    <div className="text-xs text-secondary">Security</div>
                </div>
            </div>

            {/* Ledger Chain Visualization */}
            <div className="modern-card">
                <h4 className="text-lg font-bold text-white mb-4">Ledger Entry Chain</h4>

                {ledgerEntries.length === 0 ? (
                    <div className="text-center py-8 text-secondary">
                        <div className="text-5xl mb-3">📋</div>
                        <p>No ledger entries found</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical Chain Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-lime via-lime/50 to-transparent" />

                        <div className="space-y-6">
                            {ledgerEntries.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="relative pl-16"
                                >
                                    {/* Chain Link Icon */}
                                    <div className="absolute left-3 top-2 w-6 h-6 rounded-full bg-lime border-4 border-dark flex items-center justify-center shadow-lg shadow-lime/50">
                                        <span className="text-xs">{getActionIcon(entry.action)}</span>
                                    </div>

                                    {/* Entry Card */}
                                    <div
                                        className={`
                                            bg-dark-elevated rounded-xl border transition-all cursor-pointer
                                            ${expandedEntry === entry.id ? 'border-lime shadow-lg shadow-lime/20' : 'border-border-dark hover:border-lime/50'}
                                        `}
                                        onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                    >
                                        {/* Entry Header */}
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-bold ${getActionColor(entry.action)}`}>
                                                        {entry.action}
                                                    </span>
                                                    <span className="badge-lime text-xs">
                                                        Entry #{entry.id}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-secondary">
                                                    {new Date(entry.created_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            {/* Hash Preview */}
                                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                                <div>
                                                    <span className="text-secondary block mb-1">Previous Hash</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-lime/70 truncate flex-1">
                                                            {entry.previous_hash ? formatHash(entry.previous_hash) : '🌱 Genesis'}
                                                        </code>
                                                        {entry.previous_hash && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(entry.previous_hash!);
                                                                }}
                                                                className="text-secondary hover:text-lime transition-colors"
                                                                title="Copy"
                                                            >
                                                                📋
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-secondary block mb-1">Entry Hash</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-white truncate flex-1">
                                                            {entry.entry_hash ? formatHash(entry.entry_hash) : '⏳ Pending'}
                                                        </code>
                                                        {entry.entry_hash && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(entry.entry_hash!);
                                                                }}
                                                                className="text-secondary hover:text-lime transition-colors"
                                                                title="Copy"
                                                            >
                                                                📋
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedEntry === entry.id && (
                                            <div className="border-t border-border-dark p-4 space-y-3 bg-dark/50">
                                                {/* Full Hashes */}
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-xs text-secondary uppercase tracking-wide">Previous Hash (Full)</label>
                                                        <div className="mt-1 p-2 bg-dark rounded-lg">
                                                            <code className="text-lime/70 text-xs break-all font-mono block">
                                                                {entry.previous_hash || 'Genesis Block - No Previous Hash'}
                                                            </code>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-secondary uppercase tracking-wide">Entry Hash (Full)</label>
                                                        <div className="mt-1 p-2 bg-dark rounded-lg">
                                                            <code className="text-white text-xs break-all font-mono block">
                                                                {entry.entry_hash || 'Hash Pending Generation'}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metadata */}
                                                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                                    <div>
                                                        <label className="text-xs text-secondary uppercase tracking-wide">Metadata</label>
                                                        <div className="mt-1 p-2 bg-dark rounded-lg">
                                                            <pre className="text-xs text-white overflow-x-auto">
                                                                {JSON.stringify(entry.metadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actor Info */}
                                                {entry.actor_id && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-secondary">Performed by:</span>
                                                        <span className="text-white font-semibold">User #{entry.actor_id}</span>
                                                    </div>
                                                )}

                                                {/* Chain Link Indicator */}
                                                <div className="flex items-center gap-2 text-xs pt-2 border-t border-border-dark">
                                                    <div className="w-2 h-2 rounded-full bg-lime animate-pulse"></div>
                                                    <span className="text-lime font-semibold">
                                                        Cryptographically Linked to {index === 0 ? 'Genesis' : `Entry #${ledgerEntries[index - 1].id}`}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow to Next Entry */}
                                    {index < ledgerEntries.length - 1 && (
                                        <div className="absolute left-6 -bottom-3 transform -translate-x-1/2 text-lime text-xs">
                                            ↓
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Hash Explanation */}
            <div className="modern-card bg-dark-elevated">
                <div className="flex items-start gap-3">
                    <div className="text-3xl">ℹ️</div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold mb-2">How Hash Chain Works</h4>
                        <ul className="text-sm text-secondary space-y-1">
                            <li>• Each ledger entry contains a hash of the previous entry</li>
                            <li>• This creates an immutable chain - changing any entry breaks all subsequent entries</li>
                            <li>• Genesis entries have no previous hash (first in chain)</li>
                            <li>• Hash verification instantly detects any tampering</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
