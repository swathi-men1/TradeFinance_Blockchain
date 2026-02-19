/**
 * Risk Service - Frontend API client for Risk Scoring
 * 
 * IMPORTANT: Risk calculation happens ONLY in backend.
 * This service is for READ-ONLY display of risk data.
 */

import { apiClient } from './api';
import {
    RiskScore,
    RiskRecalculationResponse,
    RiskCategoryDistribution
} from '../types/risk.types';

// Re-export types for convenience
export type { RiskScore, RiskRecalculationResponse, RiskCategoryDistribution };

export const riskService = {
    /**
     * Get current user's risk score (Corporate/Bank only)
     * Triggers fresh calculation in backend
     */
    getMyScore: async (): Promise<RiskScore> => {
        const response = await apiClient.get<RiskScore>('/risk/my-score');
        return response.data;
    },

    /**
     * Get another user's risk score (Auditor/Admin only)
     * @param userId - Target user ID
     */
    getUserScore: async (userId: number): Promise<RiskScore> => {
        const response = await apiClient.get<RiskScore>(`/risk/user/${userId}`);
        return response.data;
    },

    /**
     * Get all risk scores (Auditor/Admin only)
     * Returns list sorted by risk (highest first)
     */
    getAllScores: async (): Promise<RiskScore[]> => {
        const response = await apiClient.get<RiskScore[]>('/risk/all');
        return response.data;
    },

    /**
     * Get high-risk users only (Auditor/Admin only)
     * Useful for risk monitoring dashboard
     */
    getHighRiskUsers: async (): Promise<RiskScore[]> => {
        const response = await apiClient.get<RiskScore[]>('/risk/high-risk');
        return response.data;
    },

    /**
     * Get risk category distribution (Auditor/Admin only)
     * Returns count of users in each category
     */
    getDistribution: async (): Promise<RiskCategoryDistribution> => {
        const response = await apiClient.get<RiskCategoryDistribution>('/risk/distribution');
        return response.data;
    },

    /**
     * Trigger bulk recalculation (Admin only)
     * Recalculates scores for all Corporate and Bank users
     */
    recalculateAll: async (): Promise<RiskRecalculationResponse> => {
        const response = await apiClient.post<RiskRecalculationResponse>('/risk/recalculate-all');
        return response.data;
    }
};
