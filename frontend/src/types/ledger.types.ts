import { User } from './auth.types';

export type LedgerAction = 'ISSUED' | 'AMENDED' | 'SHIPPED' | 'RECEIVED' | 'PAID' | 'CANCELLED' | 'VERIFIED' | 'TRADE_CREATED' | 'TRADE_STATUS_UPDATED' | 'DOCUMENT_LINKED_TO_TRADE' | 'TRADE_DISPUTED';

export interface LedgerEntry {
    id: number;
    document_id: number | null;
    action: LedgerAction;
    actor_id: number | null;
    metadata: Record<string, any> | null;
    created_at: string;
    previous_hash?: string | null;
    entry_hash?: string | null;
    actor?: User | null;
}

export interface LedgerEntryCreate {
    document_id: number;
    action: LedgerAction;
    metadata?: Record<string, any>;
}
