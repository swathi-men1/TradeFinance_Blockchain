/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { apiClient } from './api';

export interface SystemStats {
    total_users: number;
    total_trades: number;
    total_documents: number;
    total_ledger_entries: number;
    risk_distribution: Record<string, number>;
}

export interface TradeAnalytics {
    success_rate: number;
    total_volume_by_currency: Record<string, number>;
    status_distribution: Record<string, number>;
}

export const monitoringService = {
    // Get system-wide stats
    getSystemStats: async (): Promise<SystemStats> => {
        const response = await apiClient.get<SystemStats>('/admin/system-stats');
        return response.data;
    },

    // Get trade analytics
    getTradeAnalytics: async (): Promise<TradeAnalytics> => {
        const response = await apiClient.get<TradeAnalytics>('/admin/trade-analytics');
        return response.data;
    },

    // Get risk summary
    getRiskSummary: async (): Promise<Record<string, number>> => {
        const response = await apiClient.get<Record<string, number>>('/admin/risk-summary');
        return response.data;
    },

    // Get integrity report
    getIntegrityReport: async (): Promise<any> => {
        const response = await apiClient.get('/admin/integrity-report');
        return response.data;
    },

    // Verify data consistency
    verifyConsistency: async (): Promise<any> => {
        const response = await apiClient.get('/admin/verify-consistency');
        return response.data;
    }
};
