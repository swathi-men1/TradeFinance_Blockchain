export type TradeStatus = 'pending' | 'in_progress' | 'completed' | 'paid' | 'disputed';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    org_name?: string;
}

export interface Trade {
    id: number;
    buyer_id: number;
    seller_id: number;
    buyer?: User; // Optional: populated by backend sometimes
    seller?: User; // Optional: populated by backend sometimes
    amount: string;
    currency: string;
    status: TradeStatus;
    created_at: string;
    updated_at: string;
}

export interface TradeCreate {
    buyer_id: number;
    seller_id: number;
    amount: number;
    currency: string;
}

export interface TradeStatusUpdate {
    status: TradeStatus;
}

export interface TradeLinkDocument {
    document_id: number;
}
