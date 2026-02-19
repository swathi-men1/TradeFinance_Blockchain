/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { apiClient as api } from './api';

export interface CorporateAnalytics {
    participation: {
        total_trades: number;
        as_buyer: number;
        as_seller: number;
    };
    status_summary: {
        completed: number;
        active: number;
        disputed: number;
    };
    documents: {
        total_submitted: number;
    };
    total_volume_value: number;
}

export const corporateService = {
    getAnalytics: async (): Promise<CorporateAnalytics> => {
        const response = await api.get('/corporate/analytics');
        return response.data;
    },

    getOwnRiskScore: async () => {
        const response = await api.get('/corporate/risk/self');
        return response.data;
    },

    getCounterpartyRisk: async (counterpartyId: number) => {
        const response = await api.get(`/corporate/risk/${counterpartyId}`);
        return response.data;
    },

    // Transaction participation endpoints
    getTransactions: async () => {
        const response = await api.get('/corporate/transactions');
        return response.data;
    },

    getTransaction: async (id: number) => {
        const response = await api.get(`/corporate/transactions/${id}`);
        return response.data;
    }
};
