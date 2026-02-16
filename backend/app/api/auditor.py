from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.compliance_alert import ComplianceAlert, AlertStatus, Severity
from app.models.document import Document
from app.models.trade import TradeTransaction
from app.models.ledger import LedgerEntry, LedgerAction
from app.services.auditor_service import AuditorService
from app.schemas.auditor import (
    DocumentVerificationResponse,
    DocumentFlagRequest,
    DocumentFlagResponse,
    LedgerLifecycleResponse,
    AlertResponse,
    AlertListResponse,
    AlertStatusUpdateRequest,
    RiskInsightResponse,
    TradeReviewResponse,
    ReportResponse,
    ReportExportRequest,
    ReportFilter,
    AuditorDashboardSummary,
    DashboardSummaryStats,
    RecentAlert,
    RecentActivity,
    AuditorInfo
)
from app.schemas.document import DocumentResponse
from app.schemas.trade import TradeResponse

router = APIRouter(prefix="/auditor", tags=["Auditor"])


# Document Verification Endpoints
@router.get("/documents", response_model=List[DocumentResponse])
def list_documents_for_auditor(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get all documents for auditor review.
    
    - **AUDITOR** only
    - View document list with full access
    - Read-only access for compliance review
    """
    documents = AuditorService.get_all_documents(db, skip=skip, limit=limit)
    return documents


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document_details(
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get detailed document information.
    
    - **AUDITOR** only
    - View document metadata and details
    - Used for verification preparation
    """
    document = AuditorService.get_document_by_id(db, document_id)
    return document


@router.get("/documents/{document_id}/content")
def get_document_content(
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get document content for viewing.
    
    - **AUDITOR** only
    - Streams file content from storage
    """
    file_data = AuditorService.get_document_file(db, document_id)
    
    return StreamingResponse(
        file_data["body"],
        media_type=file_data["content_type"],
        headers={"Content-Disposition": f"inline; filename={file_data['filename']}"}
    )


@router.post("/documents/{document_id}/verify", response_model=DocumentVerificationResponse)
def verify_document(
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Verify document integrity by recalculating SHA-256 hash.
    
    - **AUDITOR** only
    - Downloads document from storage
    - Recalculates hash and compares with stored hash
    - Creates ledger entry for verification
    - Triggers alert if hash mismatch detected
    - Flags document for investigation if tampered
    """
    result = AuditorService.verify_document_integrity(db, current_user, document_id)
    return DocumentVerificationResponse(**result)


@router.post("/documents/{document_id}/flag", response_model=DocumentFlagResponse)
def flag_document(
    document_id: int,
    flag_data: DocumentFlagRequest,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Flag a document for compliance investigation.
    
    - **AUDITOR** only
    - Creates compliance alert
    - Adds ledger entry
    - Used when auditor suspects issues with document
    """
    result = AuditorService.flag_document_for_investigation(
        db, current_user, document_id, flag_data.reason
    )
    return DocumentFlagResponse(**result)


# Ledger Lifecycle Endpoints
@router.get("/ledger/{document_id}/timeline", response_model=LedgerLifecycleResponse)
def get_ledger_timeline(
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get complete ledger timeline for a document with lifecycle validation.
    
    - **AUDITOR** only
    - Shows all lifecycle events in chronological order
    - Validates lifecycle sequence (ISSUED → AMENDED → SHIPPED → RECEIVED → PAID)
    - Detects missing stages
    - Identifies duplicate actions
    - Flags unauthorized actors
    """
    result = AuditorService.get_document_ledger_timeline(db, document_id)
    return LedgerLifecycleResponse(**result)


# Trade Transaction Review Endpoints
@router.get("/transactions", response_model=List[TradeResponse])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get all trade transactions for auditor review.
    
    - **AUDITOR** only
    - View all trades in the system
    - Read-only access for compliance review
    """
    trades = AuditorService.get_all_trades(db, skip=skip, limit=limit)
    return trades


@router.get("/transactions/{trade_id}", response_model=TradeReviewResponse)
def get_transaction_details(
    trade_id: int,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get detailed trade information with timeline and compliance flags.
    
    - **AUDITOR** only
    - View transaction details
    - View buyer and seller information
    - View transaction timeline
    - View associated documents
    - Identify compliance flags
    """
    result = AuditorService.get_trade_details(db, trade_id)
    return TradeReviewResponse(**result)


# Risk Insight Endpoints
@router.get("/risk/{user_id}", response_model=RiskInsightResponse)
def get_user_risk_insight(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get risk score insight for a specific user.
    
    - **AUDITOR** only
    - View counterparty risk score
    - View risk rationale
    - Read-only access (auditors cannot modify risk scores)
    """
    result = AuditorService.get_user_risk_insight(db, user_id)
    return RiskInsightResponse(**result)


# Compliance Monitoring Endpoints
@router.get("/alerts", response_model=AlertListResponse)
def get_compliance_alerts(
    status: Optional[AlertStatus] = Query(None, description="Filter by alert status"),
    severity: Optional[Severity] = Query(None, description="Filter by severity level"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get compliance alerts with optional filtering.
    
    - **AUDITOR** only
    - View all compliance alerts
    - Filter by status (OPEN, INVESTIGATING, RESOLVED, DISMISSED)
    - Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
    - Includes summary statistics
    """
    result = AuditorService.get_compliance_alerts(
        db, status=status, severity=severity, skip=skip, limit=limit
    )

    # Convert alerts to response schema
    alert_responses = [
        AlertResponse(
            id=alert.id,
            alert_type=alert.alert_type.value if hasattr(alert.alert_type, 'value') else str(alert.alert_type),
            severity=alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
            status=alert.status.value if hasattr(alert.status, 'value') else str(alert.status),
            title=alert.title,
            description=alert.description,
            document_id=alert.document_id,
            trade_id=alert.trade_id,
            user_id=alert.user_id,
            detected_at=alert.detected_at,
            resolved_at=alert.resolved_at
        )
        for alert in result["alerts"]
    ]

    return AlertListResponse(
        alerts=alert_responses,
        total_open=result["total_open"],
        total_resolved=result["total_resolved"],
        by_severity=result["by_severity"]
    )


@router.put("/alerts/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(
    alert_id: int,
    status_update: AlertStatusUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Update the status of a compliance alert.
    
    - **AUDITOR** only
    - Can change alert status (OPEN → INVESTIGATING → RESOLVED/DISMISSED)
    - Add resolution notes
    """
    alert = AuditorService.update_alert_status(
        db, current_user, alert_id, status_update.status, status_update.resolution_notes
    )

    return AlertResponse(
        id=alert.id,
        alert_type=alert.alert_type.value if hasattr(alert.alert_type, 'value') else str(alert.alert_type),
        severity=alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
        status=alert.status.value if hasattr(alert.status, 'value') else str(alert.status),
        title=alert.title,
        description=alert.description,
        document_id=alert.document_id,
        trade_id=alert.trade_id,
        user_id=alert.user_id,
        detected_at=alert.detected_at,
        resolved_at=alert.resolved_at
    )


@router.post("/alerts/detect-patterns")
def detect_suspicious_patterns(
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Trigger detection of suspicious patterns and create alerts.
    
    - **AUDITOR** only
    - Scans for suspicious transaction patterns
    - Detects unverified documents
    - Creates alerts for anomalies
    - Returns newly created alerts
    """
    new_alerts = AuditorService.detect_suspicious_patterns(db)

    return {
        "message": f"Pattern detection completed. {len(new_alerts)} new alerts created.",
        "new_alerts_count": len(new_alerts),
        "alerts": [
            {
                "id": alert.id,
                "type": alert.alert_type.value if hasattr(alert.alert_type, 'value') else str(alert.alert_type),
                "severity": alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
                "title": alert.title
            }
            for alert in new_alerts
        ]
    }


# Compliance Reporting Endpoints
@router.get("/reports", response_model=ReportResponse)
def generate_audit_report(
    report_type: Optional[str] = Query(None, description="Type of report to generate"),
    start_date: Optional[date] = Query(None, description="Report start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Report end date (YYYY-MM-DD)"),
    document_id: Optional[int] = Query(None, description="Filter by specific document"),
    trade_id: Optional[int] = Query(None, description="Filter by specific trade"),
    user_id: Optional[int] = Query(None, description="Filter by specific user"),
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Generate comprehensive audit report.
    
    - **AUDITOR** only
    - Document verification results
    - Ledger lifecycle summary
    - Integrity alert summary
    - Risk overview
    - Transaction review summary
    - Optional date range filtering
    - Optional entity filtering (document, trade, user)
    """
    filters = {
        "report_type": report_type,
        "start_date": start_date,
        "end_date": end_date,
        "document_id": document_id,
        "trade_id": trade_id,
        "user_id": user_id
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None}

    result = AuditorService.generate_audit_report(db, current_user, filters)
    return ReportResponse(**result)


@router.post("/reports/export")
def export_report(
    export_request: ReportExportRequest,
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Export audit report in specified format (CSV, PDF, or JSON).
    
    - **AUDITOR** only
    - Generate report with filters
    - Export in requested format
    - Returns download URL and metadata
    """
    filters = export_request.filters.dict() if export_request.filters else {}
    filters = {k: v for k, v in filters.items() if v is not None}

    result = AuditorService.export_report(
        db, current_user, export_request.report_type, export_request.format, filters
    )

    if export_request.format.upper() == "CSV":
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content=result["content"],
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={result['filename']}"
            }
        )
    elif export_request.format.upper() == "PDF":
        from fastapi.responses import Response
        return Response(
            content=result["content"],
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={result['filename']}"
            }
        )
    elif export_request.format.upper() == "TXT":
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content=result["content"],
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename={result['filename']}"
            }
        )

    return result


# Auditor Dashboard Summary
@router.get("/dashboard", response_model=AuditorDashboardSummary)
def get_auditor_dashboard(
    current_user: User = Depends(require_roles([UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get auditor dashboard summary with key metrics.
    
    - **AUDITOR** only
    - Overview of system compliance status
    - Quick access to critical alerts
    - Summary statistics
    """
    try:
        total_documents = db.query(Document).count()
        total_trades = db.query(TradeTransaction).count()

        # Get open alerts query
        open_alerts_query = db.query(ComplianceAlert).filter(
            ComplianceAlert.status == AlertStatus.OPEN
        )
        
        open_alerts_count = open_alerts_query.count()
        
        # Get critical and high severity alert counts
        critical_alerts_count = open_alerts_query.filter(
            ComplianceAlert.severity == Severity.CRITICAL
        ).count()

        high_alerts_count = open_alerts_query.filter(
            ComplianceAlert.severity == Severity.HIGH
        ).count()

        # Get verified doc IDs
        verified_doc_ids = db.query(LedgerEntry.document_id).filter(
            LedgerEntry.action == LedgerAction.VERIFIED
        ).distinct()
        
        # Count documents that are NOT in the verified list
        unverified_documents_count = db.query(Document).filter(
            ~Document.id.in_(verified_doc_ids)
        ).count()

        # Construct Summary Stats
        summary_stats = DashboardSummaryStats(
            total_documents=total_documents,
            total_trades=total_trades,
            unverified_documents=unverified_documents_count,
            open_alerts=open_alerts_count,
            critical_alerts=critical_alerts_count,
            high_alerts=high_alerts_count
        )

        # Get recent alerts for display
        recent_alerts_db = open_alerts_query.order_by(
            ComplianceAlert.severity.asc(),  # CRITICAL (if sorting works) or fallback logic
            ComplianceAlert.detected_at.desc()
        ).limit(5).all()
        
        recent_alerts = []
        for alert in recent_alerts_db:
            # Safe enum conversion
            a_type = alert.alert_type.value if hasattr(alert.alert_type, 'value') else str(alert.alert_type)
            a_severity = alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity)
            
            recent_alerts.append(
                RecentAlert(
                    id=alert.id,
                    type=a_type,
                    severity=a_severity,
                    title=alert.title,
                    detected_at=alert.detected_at
                )
            )

        # Get recent ledger activity
        recent_activity_db = db.query(LedgerEntry).order_by(
            LedgerEntry.created_at.desc()
        ).limit(10).all()

        recent_activity = []
        for entry in recent_activity_db:
            # Safe enum conversion
            action_str = entry.action.value if hasattr(entry.action, 'value') else str(entry.action)
            recent_activity.append(
                RecentActivity(
                    action=action_str,
                    actor_id=entry.actor_id,
                    timestamp=entry.created_at,
                    document_id=entry.document_id
                )
            )

        return AuditorDashboardSummary(
            summary=summary_stats,
            recent_alerts=recent_alerts,
            recent_activity=recent_activity,
            auditor_info=AuditorInfo(
                id=current_user.id,
                name=current_user.name,
                organization=current_user.org_name or "Unknown Organization"
            )
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard data: {str(e)}"
        )
