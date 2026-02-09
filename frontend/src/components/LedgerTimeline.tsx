interface LedgerEntry {
    id: number;
    action: string;
    actor: string;
    timestamp: string;
    previousHash: string;
    entryHash: string;
    isValid?: boolean;
}

interface LedgerTimelineProps {
    entries: LedgerEntry[];
}

export function LedgerTimeline({ entries }: LedgerTimelineProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateHash = (hash: string) => {
        if (!hash) return "Pending";
        if (hash.length <= 16) return hash;
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    };

    return (
        <div className="timeline">
            {entries.map((entry, index) => (
                <div
                    key={entry.id}
                    className={`timeline-item ${entry.isValid === false
                        ? 'timeline-invalid'
                        : entry.isValid === true
                            ? 'timeline-valid'
                            : ''
                        }`}
                >
                    <div className="timeline-content">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white text-lg">
                                {entry.action}
                            </h4>
                            {entry.isValid !== undefined && (
                                <span
                                    className={`badge ${entry.isValid ? 'badge-success' : 'badge-error'
                                        }`}
                                >
                                    {entry.isValid ? '✓ Valid' : '✗ Invalid'}
                                </span>
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted w-24">Actor</span>
                                <span className="text-secondary font-medium">{entry.actor}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted w-24">Timestamp</span>
                                <span className="text-secondary font-medium">
                                    {formatDate(entry.timestamp)}
                                </span>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-muted w-24 flex-shrink-0">Prev Hash</span>
                                <code className="text-mono text-xs text-secondary bg-black bg-opacity-30 px-2 py-1 rounded">
                                    {truncateHash(entry.previousHash)}
                                </code>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-muted w-24 flex-shrink-0">Entry Hash</span>
                                <code className="text-mono text-xs text-lime bg-black bg-opacity-30 px-2 py-1 rounded">
                                    {truncateHash(entry.entryHash)}
                                </code>
                            </div>
                        </div>

                        {/* Chain Connector Glow */}
                        {index < entries.length - 1 && entry.isValid && (
                            <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: 'var(--accent-lime)' }}>
                                <div className="flex items-center gap-2 text-xs text-success">
                                    <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                    <span>Chain Connected</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
