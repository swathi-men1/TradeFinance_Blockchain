export type LedgerAction = 'ISSUED' | 'AMENDED' | 'SHIPPED' | 'RECEIVED' | 'PAID' | 'CANCELLED' | 'VERIFIED' | 'RISK_RECALCULATED';

export interface LedgerEntry {
  id: string;
  action: LedgerAction;
  actor_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: {
    name: string;
    org_name: string;
  };
}

export const LEDGER_ACTION_LABELS: Record<LedgerAction, string> = {
  ISSUED: 'Document Issued',
  AMENDED: 'Amended',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  VERIFIED: 'Verified',
  RISK_RECALCULATED: 'Risk Recalculated'
};

export const LEDGER_ACTION_COLORS: Record<LedgerAction, string> = {
  ISSUED: 'bg-blue-500',
  AMENDED: 'bg-yellow-500',
  SHIPPED: 'bg-purple-500',
  RECEIVED: 'bg-green-500',
  PAID: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
  VERIFIED: 'bg-cyan-500',
  RISK_RECALCULATED: 'bg-orange-500'
};

export const MANUAL_ACTIONS: LedgerAction[] = ['AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED'];
