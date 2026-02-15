from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.compliance_alert import AlertType, AlertStatus, Severity
from app.models.ledger import LedgerAction


# Document Verification Schemas
class DocumentVerificationRequest(BaseModel):
    document_id: int


class DocumentVerificationResponse(BaseModel):
    document_id: int
    stored_hash: str
    current_hash: str
    is_valid: bool
    message: str
    verification_timestamp: datetime
    flagged_for_investigation: bool = False


class DocumentFlagRequest(BaseModel):
    document_id: int
    reason: str


class DocumentFlagResponse(BaseModel):
    document_id: int
    is_flagged: bool
    reason: str
    flagged_at: datetime


# Ledger Lifecycle Schemas
class LifecycleEvent(BaseModel):
    action: str
    actor_id: int
    actor_name: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    is_valid: bool
    validation_notes: Optional[str] = None


class LedgerLifecycleResponse(BaseModel):
    document_id: int
    document_number: str
    document_type: str
    lifecycle_events: List[LifecycleEvent]
    is_sequence_valid: bool
    missing_stages: List[str]
    duplicate_actions: List[str]
    validation_errors: List[str]


# Compliance Alert Schemas
class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    status: str
    title: str
    description: str
    document_id: Optional[int] = None
    trade_id: Optional[int] = None
    user_id: Optional[int] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total_open: int
    total_resolved: int
    by_severity: Dict[str, int]


class AlertStatusUpdateRequest(BaseModel):
    status: AlertStatus
    resolution_notes: Optional[str] = None


# Risk Insight Schemas
class RiskInsightResponse(BaseModel):
    user_id: int
    user_name: str
    user_role: str
    organization: str
    score: Optional[float]
    category: str
    rationale: str
    last_updated: Optional[datetime]
    historical_scores: Optional[List[Dict[str, Any]]] = None


# Trade Review Schemas
class TradeTimelineEvent(BaseModel):
    event_type: str
    timestamp: datetime
    actor_id: int
    actor_name: str
    details: Dict[str, Any]


class TradeReviewResponse(BaseModel):
    trade_id: int
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    amount: float
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime
    timeline: List[TradeTimelineEvent]
    associated_documents: List[Dict[str, Any]]
    compliance_flags: List[str]


# Report Schemas
class ReportType(str):
    AUDIT = "AUDIT"
    COMPLIANCE = "COMPLIANCE"
    RISK_SUMMARY = "RISK_SUMMARY"
    INTEGRITY_REPORT = "INTEGRITY_REPORT"


class ReportFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    document_id: Optional[int] = None
    trade_id: Optional[int] = None
    user_id: Optional[int] = None
    alert_types: Optional[List[AlertType]] = None


class ReportSummary(BaseModel):
    total_documents: int
    verified_documents: int
    flagged_documents: int
    total_trades: int
    disputed_trades: int
    total_alerts: int
    open_alerts: int
    high_risk_users: int


class ReportResponse(BaseModel):
    report_type: str
    generated_at: datetime
    generated_by: str
    summary: ReportSummary
    document_verifications: List[Dict[str, Any]]
    ledger_summary: Dict[str, Any]
    integrity_alerts: List[Dict[str, Any]]
    risk_overview: Dict[str, Any]
    transaction_summary: List[Dict[str, Any]]


class ReportExportRequest(BaseModel):
    report_type: str
    filters: Optional[ReportFilter] = None
    format: str = "JSON"  # JSON, CSV, PDF


class ReportExportResponse(BaseModel):
    download_url: str
    filename: str
    format: str
    expires_at: datetime

# Dashboard Schemas
class DashboardSummaryStats(BaseModel):
    total_documents: int
    total_trades: int
    unverified_documents: int
    open_alerts: int
    critical_alerts: int
    high_alerts: int

class RecentAlert(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    detected_at: datetime

class RecentActivity(BaseModel):
    action: str
    actor_id: Optional[int]
    timestamp: datetime
    document_id: Optional[int]

class AuditorInfo(BaseModel):
    id: int
    name: str
    organization: str

class AuditorDashboardSummary(BaseModel):
    summary: DashboardSummaryStats
    recent_alerts: List[RecentAlert]
    recent_activity: List[RecentActivity]
    auditor_info: AuditorInfo
