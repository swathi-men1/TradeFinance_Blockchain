import { apiClient } from './api';

export interface ComplianceAlert {
  id: number;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  title: string;
  description: string;
  document_id?: number;
  trade_id?: number;
  user_id?: number;
  detected_at: string;
  resolved_at?: string;
}

export interface AlertListResponse {
  alerts: ComplianceAlert[];
  total_open: number;
  total_resolved: number;
  by_severity: Record<string, number>;
}

export interface DocumentVerificationResponse {
  document_id: number;
  stored_hash: string;
  current_hash: string;
  is_valid: boolean;
  message: string;
  verification_timestamp: string;
  flagged_for_investigation: boolean;
}

export interface LedgerLifecycleEvent {
  action: string;
  actor_id: number;
  actor_name: string;
  timestamp: string;
  metadata: Record<string, any>;
  is_valid: boolean;
  validation_notes?: string;
}

export interface LedgerEntry {
  id: number;
  action: string;
  actor_id: number;
  actor: { id: number; name: string };
  document_id: number | null;
  entry_metadata: Record<string, any>;
  created_at: string;
  previous_hash: string;
  entry_hash: string;
}

export interface LedgerLifecycleResponse {
  document_id: number;
  document_number: string;
  document_type: string;
  lifecycle_events: LedgerLifecycleEvent[];
  is_sequence_valid: boolean;
  missing_stages: string[];
  duplicate_actions: string[];
  validation_errors: string[];
}

export interface TradeReviewResponse {
  trade_id: number;
  buyer_id: number;
  buyer_name: string;
  seller_id: number;
  seller_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  timeline: Array<{
    event_type: string;
    timestamp: string;
    actor_id: number;
    actor_name: string;
    details: Record<string, any>;
  }>;
  associated_documents: Array<{
    id: number;
    doc_number: string;
    doc_type: string;
    hash: string;
  }>;
  compliance_flags: string[];
}

export interface RiskInsightResponse {
  user_id: number;
  user_name: string;
  user_role: string;
  organization: string;
  score: number | null;
  category: string;
  rationale: string;
  last_updated: string | null;
}

export interface AuditorDashboardSummary {
  summary: {
    total_documents: number;
    total_trades: number;
    unverified_documents: number;
    open_alerts: number;
    critical_alerts: number;
    high_alerts: number;
  };
  recent_alerts: Array<{
    id: number;
    type: string;
    severity: string;
    title: string;
    detected_at: string;
  }>;
  recent_activity: Array<{
    action: string;
    actor_id: number;
    timestamp: string;
    document_id: number | null;
  }>;
  auditor_info: {
    id: number;
    name: string;
    organization: string;
  };
}

export interface ReportSummary {
  total_documents: number;
  verified_documents: number;
  flagged_documents: number;
  total_trades: number;
  disputed_trades: number;
  total_alerts: number;
  open_alerts: number;
  high_risk_users: number;
}

export interface AuditReport {
  report_type: string;
  generated_at: string;
  generated_by: string;
  summary: ReportSummary;
  document_verifications: Array<{
    document_id: number;
    doc_number: string;
    verified_at: string;
    is_valid: boolean;
    flagged: boolean;
  }>;
  ledger_summary: {
    total_entries: number;
    action_breakdown: Record<string, number>;
  };
  integrity_alerts: Array<{
    id: number;
    type: string;
    severity: string;
    title: string;
    detected_at: string;
    status: string;
  }>;
  risk_overview: {
    total_scored_users: number;
    average_score: number;
    distribution: Record<string, number>;
  };
  transaction_summary: Array<{
    trade_id: number;
    buyer_id: number;
    seller_id: number;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    compliance_flags: number;
  }>;
}

const auditorService = {
  // Dashboard
  getDashboardSummary: async (): Promise<AuditorDashboardSummary> => {
    const response = await apiClient.get('/auditor/dashboard');
    return response.data;
  },

  // Document Verification
  getDocuments: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/auditor/documents?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  downloadDocument: async (documentId: number): Promise<Blob> => {
    const response = await apiClient.get(`/auditor/documents/${documentId}/content`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDocumentById: async (documentId: number) => {
    const response = await apiClient.get(`/auditor/documents/${documentId}`);
    return response.data;
  },

  verifyDocument: async (documentId: number): Promise<DocumentVerificationResponse> => {
    const response = await apiClient.post(`/auditor/documents/${documentId}/verify`);
    return response.data;
  },

  flagDocument: async (documentId: number, reason: string) => {
    const response = await apiClient.post(`/auditor/documents/${documentId}/flag`, { reason });
    return response.data;
  },

  // Ledger Lifecycle
  getFullLedger: async (skip = 0, limit = 100): Promise<LedgerEntry[]> => {
    const response = await apiClient.get(`/auditor/ledger?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getLedgerTimeline: async (documentId: number): Promise<LedgerLifecycleResponse> => {
    const response = await apiClient.get(`/auditor/ledger/${documentId}/timeline`);
    return response.data;
  },

  // Trade Review
  getTransactions: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/auditor/transactions?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getTransactionDetails: async (tradeId: number): Promise<TradeReviewResponse> => {
    const response = await apiClient.get(`/auditor/transactions/${tradeId}`);
    return response.data;
  },

  // Risk Insights
  getUserRiskInsight: async (userId: number): Promise<RiskInsightResponse> => {
    const response = await apiClient.get(`/auditor/risk/${userId}`);
    return response.data;
  },

  getAllRiskScores: async (): Promise<RiskInsightResponse[]> => {
    const response = await apiClient.get('/risk/all');
    return response.data;
  },

  // Compliance Alerts
  getAlerts: async (
    status?: string,
    severity?: string,
    skip = 0,
    limit = 100
  ): Promise<AlertListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/auditor/alerts?${params.toString()}`);
    return response.data;
  },

  updateAlertStatus: async (alertId: number, status: string, resolutionNotes?: string) => {
    const response = await apiClient.put(`/auditor/alerts/${alertId}/status`, {
      status,
      resolution_notes: resolutionNotes,
    });
    return response.data;
  },

  detectPatterns: async () => {
    const response = await apiClient.post('/auditor/alerts/detect-patterns');
    return response.data;
  },

  // Reports
  generateAuditReport: async (params: {
    report_type: string;
    start_date?: string;
    end_date?: string;
    document_id?: number;
    trade_id?: number;
    user_id?: number;
  }): Promise<AuditReport> => {
    const queryParams = new URLSearchParams();
    queryParams.append('report_type', params.report_type);

    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.document_id) queryParams.append('document_id', params.document_id.toString());
    if (params.trade_id) queryParams.append('trade_id', params.trade_id.toString());
    if (params.user_id) queryParams.append('user_id', params.user_id.toString());

    const response = await apiClient.get(`/auditor/reports?${queryParams.toString()}`);
    return response.data;
  },

  exportReport: async (reportType: string, format: 'JSON' | 'CSV' | 'PDF', filters?: Record<string, any>) => {
    const response = await apiClient.post('/auditor/reports/export', {
      report_type: reportType,
      format,
      filters,
    });
    return response.data;
  },

  exportReportCSV: async (reportType: string, filters?: Record<string, any>): Promise<Blob> => {
    const response = await apiClient.post('/auditor/reports/export', {
      report_type: reportType,
      format: 'CSV',
      filters,
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportReportPDF: async (reportType: string, filters?: Record<string, any>): Promise<Blob> => {
    const response = await apiClient.post('/auditor/reports/export', {
      report_type: reportType,
      format: 'PDF',
      filters,
    }, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default auditorService;
