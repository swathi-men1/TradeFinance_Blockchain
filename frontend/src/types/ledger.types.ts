import { User } from './auth.types';

export type LedgerAction =
  | 'ISSUED'
  | 'AMENDED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'PAID'
  | 'CANCELLED'
  | 'VERIFIED'
  | 'TRADE_CREATED'
  | 'TRADE_UPDATED'
  | 'TRADE_DELETED'
  | 'TRADE_STATUS_UPDATED'
  | 'DOCUMENT_LINKED_TO_TRADE'
  | 'TRADE_DISPUTED';

export interface LedgerEntry {
  id: number;
  document_id: number | null;
  action: string; // Changed from LedgerAction to string to match backend
  actor_id: number | null;
  entry_metadata: Record<string, any> | null; // Changed from metadata to entry_metadata
  created_at: string;
  previous_hash?: string | null;
  entry_hash?: string | null;
  actor?: User | null; // Nested user object with name, user_code, role, etc.
}

export interface LedgerEntryCreate {
  document_id?: number;
  action: LedgerAction;
  actor_id?: number;
  metadata?: Record<string, any>;
}
