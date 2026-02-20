export type TransactionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';

export interface TradeTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: TransactionStatus;
  description: string | null;
  amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled'
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  DISPUTED: 'bg-red-500',
  CANCELLED: 'bg-muted-foreground'
};

export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskScore {
  id: string;
  user_id: string;
  score: number;
  category: RiskCategory;
  rationale: string;
  last_updated: string;
}

export const RISK_CATEGORY_COLORS: Record<RiskCategory, string> = {
  LOW: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-red-600'
};

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
