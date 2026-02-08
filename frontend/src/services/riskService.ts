import { apiClient } from './api';
import { RiskScore, RiskRecalculationResponse } from '../types/risk.types';

export const riskService = {
    // Get current user's risk score (Corporate/Bank)
    getMyScore: async (): Promise<RiskScore> => {
        const response = await apiClient.get<RiskScore>('/risk/my-score');
        return response.data;
    },

    // Get another user's risk score (Auditor)
    getUserScore: async (userId: number): Promise<RiskScore> => {
        const response = await apiClient.get<RiskScore>(`/risk/user/${userId}`);
        return response.data;
    },

    // Trigger bulk recalculation (Admin)
    recalculateAll: async (): Promise<RiskRecalculationResponse> => {
        const response = await apiClient.post<RiskRecalculationResponse>('/risk/recalculate-all');
        return response.data;
    }
};
