/**
 * Risk Types - Frontend type definitions for Risk Scoring System
 * 
 * Note: Risk calculation happens ONLY in backend.
 * Frontend is read-only display only.
 */

// Risk categories as specified by mentor: 0-33 LOW, 34-66 MEDIUM, 67-100 HIGH
export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH';

// Main risk score response from backend
export interface RiskScore {
    user_id: number;
    score: number;  // 0-100
    category: RiskCategory;
    rationale: string;  // Human-readable explanation
    last_updated: string;  // ISO timestamp
}

// Response for bulk recalculation (Admin only)
export interface RiskRecalculationResponse {
    status: string;
    total_processed: number;
    message: string;
}

// Category distribution for admin dashboard
export interface RiskCategoryDistribution {
    low_count: number;
    medium_count: number;
    high_count: number;
    total_users: number;
}

// Helper to get color based on category
export const getRiskColor = (category: RiskCategory): string => {
    switch (category) {
        case 'LOW':
            return '#22c55e';  // Green
        case 'MEDIUM':
            return '#eab308';  // Yellow/Amber
        case 'HIGH':
            return '#ef4444';  // Red
        default:
            return '#6b7280';  // Gray
    }
};

// Helper to get badge class based on category
export const getRiskBadgeClass = (category: RiskCategory): string => {
    switch (category) {
        case 'LOW':
            return 'badge-success';
        case 'MEDIUM':
            return 'badge-warning';
        case 'HIGH':
            return 'badge-error';
        default:
            return 'badge';
    }
};
