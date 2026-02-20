import { apiClient } from './api';

export interface BankTrade {
    id: number;
    buyer_id: number;
    buyer_name: string;
    seller_id: number;
    seller_name: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface BankDocument {
    id: number;
    filename: string;
    description: string;
    doc_type: string;
    owner_id: number;
    created_at: string;
    hash: string;
    verification_status?: 'VERIFIED' | 'PENDING' | 'FAILED';
}

export interface BankRiskScore {
    id: number;
    user_id: number;
    user_name?: string;
    org_name?: string;
    score: number;
    category: string;
    rationale: string;
    last_updated: string;
}

export interface DocumentVerificationResult {
    verified: boolean;
    stored_hash: string;
    current_hash: string;
}

export interface BankLedgerEntry {
    id: number;
    action: string;
    actor_id: number;
    document_id: number | null;
    created_at: string;
    entry_hash: string;
    entry_metadata?: any;
}

export const bankService = {
    getTrades: async (skip = 0, limit = 100) => {
        const response = await apiClient.get<BankTrade[]>(`/bank/trades?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    updateTradeStatus: async (tradeId: number, status: string) => {
        const response = await apiClient.put(`/bank/trades/${tradeId}/status?status=${status}`);
        return response.data;
    },

    getDocuments: async (skip = 0, limit = 100) => {
        const response = await apiClient.get<BankDocument[]>(`/bank/documents?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    verifyDocument: async (documentId: number) => {
        const response = await apiClient.get<DocumentVerificationResult>(`/bank/documents/${documentId}/verify`);
        return response.data;
    },

    getRiskMonitor: async () => {
        const response = await apiClient.get<BankRiskScore[]>('/bank/risk-monitor');
        return response.data;
    },

    getLedger: async (skip = 0, limit = 100) => {
        const response = await apiClient.get<BankLedgerEntry[]>(`/bank/ledger?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    uploadDocument: async (file: File, docType: string, docNumber: string, tradeId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', docType);
        formData.append('doc_number', docNumber);
        if (tradeId) formData.append('trade_id', tradeId);

        const response = await apiClient.post('/bank/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    viewDocument: async (documentId: number) => {
        const response = await apiClient.get(`/bank/documents/${documentId}/view`, {
            responseType: 'blob'
        });
        return response.data;
    }
};
