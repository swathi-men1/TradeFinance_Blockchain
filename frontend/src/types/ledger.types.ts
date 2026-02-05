/* Author: Abdul Samad | */
export type LedgerAction = 'ISSUED' | 'AMENDED' | 'SHIPPED' | 'RECEIVED' | 'PAID' | 'CANCELLED' | 'VERIFIED' | 'FINANCED';

export interface LedgerEntry {
    id: number;
    document_id: number;
    action: LedgerAction;
    actor_id: number;
    metadata?: Record<string, any>; // Used in frontend as metadata
    metadata_info?: Record<string, any>; // Helper for API alias matching
    created_at: string;
}

export interface LedgerEntryCreate {
    document_id: number;
    action: LedgerAction;
    metadata_info?: Record<string, any>;
}
