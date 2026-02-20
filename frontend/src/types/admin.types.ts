export type UserRole = 'bank' | 'corporate' | 'auditor' | 'admin';

export interface Organization {
    id: number;
    org_name: string;
    status: 'active' | 'suspended' | 'pending';
    created_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    org_name: string;
    is_active: boolean;
    user_code?: string;
}

export interface AuditLog {
    id: number;
    admin_id: number | null; // Can be null for system actions
    admin?: User; // Details of the actor
    action: string;
    target_type: string;
    target_id: string;
    timestamp: string;
}

export interface SystemAnalytics {
    total_organizations: number;
    total_users: number;
    total_transactions: number;
    total_documents: number;
    risk_distribution: Record<string, number>;
    compliance_violations: number;
}

export interface IntegrityAlert {
    type: string;
    severity: string;
    details: string;
    timestamp: string;
}
