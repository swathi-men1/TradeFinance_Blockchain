export type LedgerAction = 'ISSUED' | 'AMENDED' | 'SHIPPED' | 'RECEIVED' | 'PAID' | 'CANCELLED' | 'VERIFIED';

export interface LedgerEntry {
    id: number;
    document_id: number;
    action: LedgerAction;
    actor_id: number | null;
    metadata: Record<string, any> | null;
    created_at: string;
    previous_hash?: string | null;
    entry_hash?: string | null;
}

export interface LedgerEntryCreate {
    document_id: number;
    action: LedgerAction;
    metadata?: Record<string, any>;
}
