import { apiClient as api } from './api';

export interface BankAnalytics {
    summary: {
        total_trades: number;
        total_volume: number;
        average_transaction_value: number;
    };
    status_breakdown: Record<string, number>;
    counterparty_performance: Record<string, { total: number; completed: number; disputed: number }>;
}

export const bankService = {
    getAnalytics: async (): Promise<BankAnalytics> => {
        const response = await api.get('/bank/analytics');
        return response.data;
    },

    createLedgerEntry: async (entryData: {
        document_id: number;
        action: string;
        entry_metadata?: any;
    }) => {
        const response = await api.post('/bank/ledger/create-entry', entryData);
        return response.data;
    },

    getCounterpartyRisk: async (counterpartyId: number) => {
        const response = await api.get(`/bank/risk/${counterpartyId}`);
        return response.data;
    }
};
