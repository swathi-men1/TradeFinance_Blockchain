export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskScore {
    user_id: number;
    score: number;
    category: RiskCategory;
    rationale: string;
    last_updated: string;
}

export interface RiskRecalculationResponse {
    status: string;
    total_processed: number;
    message: string;
}
