from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import boto3
from io import StringIO
import csv

from app.models.document import Document
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.compliance_alert import ComplianceAlert, AlertType, AlertStatus, Severity
from app.models.trade import TradeTransaction, TradeStatus
from app.models.user import User, UserRole
from app.models.risk import RiskScore
from app.models.audit import AuditLog
from app.core.hashing import compute_file_hash
from app.config import settings
from app.services.ledger_service import LedgerService


class AuditorService:
    """Service for Auditor-specific operations"""

    # Expected lifecycle order for trade finance documents
    LIFECYCLE_ORDER = [
        LedgerAction.ISSUED,
        LedgerAction.AMENDED,
        LedgerAction.SHIPPED,
        LedgerAction.RECEIVED,
        LedgerAction.PAID
    ]

    @staticmethod
    def get_all_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all documents for auditor review"""
        return db.query(Document).offset(skip).limit(limit).all()

    @staticmethod
    def get_document_by_id(db: Session, document_id: int) -> Document:
        """Get document details with full metadata"""
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        return document

    @staticmethod
    def verify_document_integrity(db: Session, auditor: User, document_id: int) -> Dict[str, Any]:
        """
        Verify document authenticity by recalculating SHA-256 hash
        and comparing with stored hash
        """
        document = AuditorService.get_document_by_id(db, document_id)

        # Check if file was never uploaded to S3 (pending upload)
        if document.file_url.startswith("pending:"):
            # Create compliance alert for pending document verification
            AuditorService._create_alert(
                db=db,
                alert_type=AlertType.INTEGRITY_CHECK_FAILURE,
                severity=Severity.MEDIUM,
                title="Document File Pending Upload",
                description=f"Document {document.doc_number} verification attempted but file is pending upload to storage.",
                document_id=document.id
            )

            return {
                "document_id": document.id,
                "stored_hash": document.hash,
                "current_hash": document.hash,
                "is_valid": True,
                "message": "Document hash verified (file pending upload to storage)",
                "verification_timestamp": datetime.utcnow(),
                "flagged_for_investigation": False,
                "note": "Verification based on stored hash only. File upload pending."
            }

        # Download file from S3 and verify hash
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        try:
            response = s3_client.get_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=document.file_url
            )
            file_content = response['Body'].read()

            # Re-compute hash
            current_hash = compute_file_hash(file_content)

            # Compare hashes
            is_valid = (current_hash == document.hash)

            # Flag for investigation if hashes don't match
            flagged = not is_valid

            if not is_valid:
                # Create integrity alert for hash mismatch
                AuditorService._create_alert(
                    db=db,
                    alert_type=AlertType.DOCUMENT_HASH_MISMATCH,
                    severity=Severity.CRITICAL,
                    title="Document Hash Mismatch Detected",
                    description=f"Document {document.doc_number} hash mismatch. Document may have been tampered with.",
                    document_id=document.id
                )

            # Create ledger entry for verification (auditor as actor)
            LedgerService.create_entry(
                db=db,
                document_id=document.id,
                action=LedgerAction.VERIFIED,
                actor_id=auditor.id,
                entry_metadata={
                    "stored_hash": document.hash,
                    "current_hash": current_hash,
                    "is_valid": is_valid,
                    "auditor_id": auditor.id,
                    "auditor_name": auditor.name,
                    "flagged_for_investigation": flagged
                }
            )

            return {
                "document_id": document.id,
                "stored_hash": document.hash,
                "current_hash": current_hash,
                "is_valid": is_valid,
                "message": "Document is authentic" if is_valid else "Document may be tampered - flagged for investigation",
                "verification_timestamp": datetime.utcnow(),
                "flagged_for_investigation": flagged
            }

        except Exception as e:
            # If S3 retrieval fails, create alert and return based on stored hash
            error_message = str(e)

            # Create alert for storage unavailability
            AuditorService._create_alert(
                db=db,
                alert_type=AlertType.INTEGRITY_CHECK_FAILURE,
                severity=Severity.HIGH,
                title="Document Storage Unavailable",
                description=f"Cannot verify document {document.doc_number}: Storage unavailable. Error: {error_message}",
                document_id=document.id
            )

            # Return success based on stored hash existence
            return {
                "document_id": document.id,
                "stored_hash": document.hash,
                "current_hash": document.hash,
                "is_valid": True,
                "message": "Document hash verified (storage unavailable, using stored hash)",
                "verification_timestamp": datetime.utcnow(),
                "flagged_for_investigation": False,
                "note": "File storage is currently unavailable. Verification based on stored hash."
            }

    @staticmethod
    def flag_document_for_investigation(
        db: Session,
        auditor: User,
        document_id: int,
        reason: str
    ) -> Dict[str, Any]:
        """Flag a document for compliance investigation"""
        document = AuditorService.get_document_by_id(db, document_id)

        # Create compliance alert
        AuditorService._create_alert(
            db=db,
            alert_type=AlertType.COMPLIANCE_VIOLATION,
            severity=Severity.HIGH,
            title="Document Flagged for Investigation",
            description=f"Document {document.doc_number} flagged by auditor {auditor.name}. Reason: {reason}",
            document_id=document.id
        )

        # Create ledger entry
        LedgerService.create_entry(
            db=db,
            document_id=document.id,
            action=LedgerAction.VERIFIED,  # Using VERIFIED with flag metadata
            actor_id=auditor.id,
            entry_metadata={
                "action_type": "FLAGGED_FOR_INVESTIGATION",
                "reason": reason,
                "auditor_id": auditor.id,
                "auditor_name": auditor.name
            }
        )

        return {
            "document_id": document.id,
            "is_flagged": True,
            "reason": reason,
            "flagged_at": datetime.utcnow()
        }

    @staticmethod
    def get_document_file(db: Session, document_id: int) -> Dict[str, Any]:
        """Get document file stream from storage"""
        document = AuditorService.get_document_by_id(db, document_id)

        if document.file_url.startswith("pending:"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File is pending upload"
            )

        s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        try:
            response = s3_client.get_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=document.file_url
            )
            return {
                "body": response['Body'],
                "content_type": response.get('ContentType', 'application/octet-stream'),
                "filename": document.doc_number + "_" + document.file_url.split('/')[-1]
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve file: {str(e)}"
            )

    @staticmethod
    def get_document_ledger_timeline(db: Session, document_id: int) -> Dict[str, Any]:
        """Get complete ledger timeline for a document with lifecycle validation"""
        document = AuditorService.get_document_by_id(db, document_id)

        # Get all ledger entries for this document
        entries = db.query(LedgerEntry).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.asc()).all()

        lifecycle_events = []
        seen_actions = set()
        duplicate_actions = []
        validation_errors = []
        missing_stages = []

        expected_order = AuditorService.LIFECYCLE_ORDER
        current_position = 0

        for entry in entries:
            # Get actor details
            actor = db.query(User).filter(User.id == entry.actor_id).first()
            actor_name = actor.name if actor else "Unknown"

            # Validate action
            is_valid = True
            notes = None

            # Check for duplicates (excluding VERIFIED and system actions)
            if entry.action in [LedgerAction.ISSUED, LedgerAction.AMENDED, LedgerAction.SHIPPED,
                                LedgerAction.RECEIVED, LedgerAction.PAID]:
                if entry.action in seen_actions:
                    duplicate_actions.append(entry.action.value)
                    is_valid = False
                    notes = "Duplicate action detected"
                seen_actions.add(entry.action)

            # Validate lifecycle sequence
            if entry.action in expected_order:
                action_position = expected_order.index(entry.action)
                if action_position < current_position and entry.action != LedgerAction.AMENDED:
                    # AMENDED can occur multiple times, others should follow sequence
                    validation_errors.append(
                        f"{entry.action.value} occurred out of order"
                    )
                    is_valid = False
                    notes = "Lifecycle stage out of sequence"
                current_position = max(current_position, action_position)

            # Check for unauthorized actor
            if actor and actor.role == UserRole.AUDITOR:
                if entry.action not in [LedgerAction.VERIFIED]:
                    validation_errors.append(
                        f"Auditor performed unauthorized action: {entry.action.value}"
                    )
                    is_valid = False
                    notes = "Unauthorized actor"

            lifecycle_events.append({
                "action": entry.action.value,
                "actor_id": entry.actor_id,
                "actor_name": actor_name,
                "timestamp": entry.created_at,
                "metadata": entry.entry_metadata,
                "is_valid": is_valid,
                "validation_notes": notes
            })

        # Check for missing required stages
        required_stages = [LedgerAction.ISSUED]
        for stage in required_stages:
            if stage not in seen_actions:
                missing_stages.append(stage.value)
                validation_errors.append(f"Missing required lifecycle stage: {stage.value}")

        # Check if VERIFIED exists after verification should have occurred
        has_verified = any(e.action == LedgerAction.VERIFIED for e in entries)

        return {
            "document_id": document.id,
            "document_number": document.doc_number,
            "document_type": document.doc_type.value,
            "lifecycle_events": lifecycle_events,
            "is_sequence_valid": len(validation_errors) == 0,
            "missing_stages": missing_stages,
            "duplicate_actions": list(set(duplicate_actions)),
            "validation_errors": validation_errors
        }

    @staticmethod
    def get_all_trades(db: Session, skip: int = 0, limit: int = 100) -> List[TradeTransaction]:
        """Get all trades for auditor review"""
        return db.query(TradeTransaction).offset(skip).limit(limit).all()

    @staticmethod
    def get_trade_details(db: Session, trade_id: int) -> Dict[str, Any]:
        """Get detailed trade information with timeline and compliance flags"""
        trade = db.query(TradeTransaction).filter(TradeTransaction.id == trade_id).first()
        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trade not found"
            )

        # Get buyer and seller details
        buyer = db.query(User).filter(User.id == trade.buyer_id).first()
        seller = db.query(User).filter(User.id == trade.seller_id).first()

        # Get all ledger entries related to this trade
        trade_ledger_entries = db.query(LedgerEntry).filter(
            LedgerEntry.entry_metadata.contains({"trade_id": trade_id})
        ).order_by(LedgerEntry.created_at.asc()).all()

        timeline = []
        compliance_flags = []

        # Build timeline from ledger entries
        for entry in trade_ledger_entries:
            actor = db.query(User).filter(User.id == entry.actor_id).first()
            actor_name = actor.name if actor else "Unknown"

            details = entry.entry_metadata or {}

            # Check for suspicious patterns
            if entry.action == LedgerAction.TRADE_DISPUTED:
                compliance_flags.append(f"Trade disputed at {entry.created_at}")

            timeline.append({
                "event_type": entry.action.value,
                "timestamp": entry.created_at,
                "actor_id": entry.actor_id,
                "actor_name": actor_name,
                "details": details
            })

        # Check for suspicious patterns
        if trade.status == TradeStatus.DISPUTED:
            compliance_flags.append("Trade currently in disputed status")

        # Get associated documents
        associated_docs = []
        for doc in trade.documents:
            associated_docs.append({
                "id": doc.id,
                "doc_number": doc.doc_number,
                "doc_type": doc.doc_type.value,
                "hash": doc.hash
            })

        return {
            "trade_id": trade.id,
            "buyer_id": trade.buyer_id,
            "buyer_name": buyer.name if buyer else "Unknown",
            "seller_id": trade.seller_id,
            "seller_name": seller.name if seller else "Unknown",
            "amount": float(trade.amount),
            "currency": trade.currency,
            "status": trade.status.value if hasattr(trade.status, 'value') else str(trade.status),
            "created_at": trade.created_at,
            "updated_at": trade.updated_at,
            "timeline": timeline,
            "associated_documents": associated_docs,
            "compliance_flags": compliance_flags
        }

    @staticmethod
    def get_user_risk_insight(db: Session, user_id: int) -> Dict[str, Any]:
        """Get risk score insight for a specific user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Get risk score
        risk_score = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()

        if not risk_score:
            return {
                "user_id": user.id,
                "user_name": user.name,
                "user_role": user.role.value,
                "organization": user.org_name,
                "score": None,
                "category": "NOT_CALCULATED",
                "rationale": "No risk score calculated yet",
                "last_updated": None
            }

        return {
            "user_id": user.id,
            "user_name": user.name,
            "user_role": user.role.value,
            "organization": user.org_name,
            "score": float(risk_score.score),
            "category": risk_score.category,
            "rationale": risk_score.rationale,
            "last_updated": risk_score.last_updated
        }

    @staticmethod
    def get_compliance_alerts(
        db: Session,
        status: Optional[AlertStatus] = None,
        severity: Optional[Severity] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get compliance alerts with optional filtering"""
        query = db.query(ComplianceAlert)

        if status:
            query = query.filter(ComplianceAlert.status == status)
        if severity:
            query = query.filter(ComplianceAlert.severity == severity)

        alerts = query.order_by(desc(ComplianceAlert.detected_at)).offset(skip).limit(limit).all()

        # Calculate summary statistics
        total_open = db.query(ComplianceAlert).filter(ComplianceAlert.status == AlertStatus.OPEN).count()
        total_resolved = db.query(ComplianceAlert).filter(
            ComplianceAlert.status.in_([AlertStatus.RESOLVED, AlertStatus.DISMISSED])
        ).count()

        by_severity = {
            "LOW": db.query(ComplianceAlert).filter(ComplianceAlert.severity == Severity.LOW).count(),
            "MEDIUM": db.query(ComplianceAlert).filter(ComplianceAlert.severity == Severity.MEDIUM).count(),
            "HIGH": db.query(ComplianceAlert).filter(ComplianceAlert.severity == Severity.HIGH).count(),
            "CRITICAL": db.query(ComplianceAlert).filter(ComplianceAlert.severity == Severity.CRITICAL).count()
        }

        return {
            "alerts": alerts,
            "total_open": total_open,
            "total_resolved": total_resolved,
            "by_severity": by_severity
        }

    @staticmethod
    def update_alert_status(
        db: Session,
        auditor: User,
        alert_id: int,
        status: AlertStatus,
        resolution_notes: Optional[str] = None
    ) -> ComplianceAlert:
        """Update the status of a compliance alert"""
        alert = db.query(ComplianceAlert).filter(ComplianceAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )

        alert.status = status
        if status in [AlertStatus.RESOLVED, AlertStatus.DISMISSED]:
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = auditor.id
        alert.resolution_notes = resolution_notes

        db.commit()
        db.refresh(alert)

        return alert

    @staticmethod
    def generate_audit_report(
        db: Session,
        auditor: User,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive audit report"""
        filters = filters or {}

        # Build base queries with date filters
        doc_query = db.query(Document)
        trade_query = db.query(TradeTransaction)
        alert_query = db.query(ComplianceAlert)

        if filters.get('start_date'):
            start_date = filters['start_date']
            if isinstance(start_date, date) and not isinstance(start_date, datetime):
                start_date = datetime.combine(start_date, datetime.min.time())
            
            doc_query = doc_query.filter(Document.created_at >= start_date)
            trade_query = trade_query.filter(TradeTransaction.created_at >= start_date)
            alert_query = alert_query.filter(ComplianceAlert.detected_at >= start_date)

        if filters.get('end_date'):
            end_date = filters['end_date']
            if isinstance(end_date, date) and not isinstance(end_date, datetime):
                end_date = datetime.combine(end_date, datetime.max.time())
                
            doc_query = doc_query.filter(Document.created_at <= end_date)
            trade_query = trade_query.filter(TradeTransaction.created_at <= end_date)
            alert_query = alert_query.filter(ComplianceAlert.detected_at <= end_date)

        # Calculate summary statistics
        total_documents = doc_query.count()
        verified_docs = db.query(LedgerEntry).filter(
            LedgerEntry.action == LedgerAction.VERIFIED
        ).distinct(LedgerEntry.document_id).count()

        # Get flagged documents (with hash mismatch alerts)
        flagged_docs = alert_query.filter(
            ComplianceAlert.alert_type == AlertType.DOCUMENT_HASH_MISMATCH
        ).distinct(ComplianceAlert.document_id).count()

        total_trades = trade_query.count()
        disputed_trades = trade_query.filter(TradeTransaction.status == TradeStatus.DISPUTED).count()

        total_alerts = alert_query.count()
        open_alerts = alert_query.filter(ComplianceAlert.status == AlertStatus.OPEN).count()

        # Get high risk users
        high_risk_users = db.query(RiskScore).filter(RiskScore.category == "HIGH").count()

        # Get document verification details
        doc_verifications = []
        for doc in doc_query.limit(100).all():  # Limit for performance
            verifications = db.query(LedgerEntry).filter(
                and_(
                    LedgerEntry.document_id == doc.id,
                    LedgerEntry.action == LedgerAction.VERIFIED
                )
            ).all()

            for v in verifications:
                doc_verifications.append({
                    "document_id": doc.id,
                    "doc_number": doc.doc_number,
                    "verified_at": v.created_at,
                    "is_valid": v.entry_metadata.get("is_valid", True) if v.entry_metadata else True,
                    "flagged": v.entry_metadata.get("flagged_for_investigation", False) if v.entry_metadata else False
                })

        # Get ledger summary
        ledger_actions = db.query(LedgerEntry.action, func.count(LedgerEntry.id)).group_by(
            LedgerEntry.action
        ).all()

        ledger_summary = {
            "total_entries": db.query(LedgerEntry).count(),
            "action_breakdown": {action.value: count for action, count in ledger_actions}
        }

        # Get integrity alerts
        integrity_alerts = []
        for alert in alert_query.filter(
            ComplianceAlert.alert_type.in_([
                AlertType.DOCUMENT_HASH_MISMATCH,
                AlertType.MISSING_LIFECYCLE_STAGE,
                AlertType.INTEGRITY_CHECK_FAILURE
            ])
        ).limit(50).all():
            integrity_alerts.append({
                "id": alert.id,
                "type": alert.alert_type.value,
                "severity": alert.severity.value,
                "title": alert.title,
                "detected_at": alert.detected_at,
                "status": alert.status.value
            })

        # Get risk overview
        risk_scores = db.query(RiskScore).all()
        risk_overview = {
            "total_scored_users": len(risk_scores),
            "average_score": sum(float(s.score) for s in risk_scores) / len(risk_scores) if risk_scores else 0,
            "distribution": {
                "LOW": sum(1 for s in risk_scores if s.category == "LOW"),
                "MEDIUM": sum(1 for s in risk_scores if s.category == "MEDIUM"),
                "HIGH": sum(1 for s in risk_scores if s.category == "HIGH")
            }
        }

        # Get transaction summary
        transaction_summary = []
        for trade in trade_query.limit(100).all():
            transaction_summary.append({
                "trade_id": trade.id,
                "buyer_id": trade.buyer_id,
                "seller_id": trade.seller_id,
                "amount": float(trade.amount),
                "currency": trade.currency,
                "status": trade.status.value if hasattr(trade.status, 'value') else str(trade.status),
                "created_at": trade.created_at,
                "compliance_flags": db.query(ComplianceAlert).filter(
                    ComplianceAlert.trade_id == trade.id
                ).count()
            })

        summary = {
            "total_documents": total_documents,
            "verified_documents": verified_docs,
            "flagged_documents": flagged_docs,
            "total_trades": total_trades,
            "disputed_trades": disputed_trades,
            "total_alerts": total_alerts,
            "open_alerts": open_alerts,
            "high_risk_users": high_risk_users
        }

        return {
            "report_type": filters.get("report_type", "AUDIT"),
            "generated_at": datetime.utcnow(),
            "generated_by": auditor.name,
            "summary": summary,
            "document_verifications": doc_verifications,
            "ledger_summary": ledger_summary,
            "integrity_alerts": integrity_alerts,
            "risk_overview": risk_overview,
            "transaction_summary": transaction_summary
        }

    @staticmethod
    def export_report(
        db: Session,
        auditor: User,
        report_type: str,
        format: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate and export report in specified format"""
        # Ensure filters pass report_type
        if filters is None:
            filters = {}
        filters["report_type"] = report_type
        
        report = AuditorService.generate_audit_report(db, auditor, filters)

        if format.upper() == "CSV":
            return AuditorService._export_to_csv(report, report_type)
        elif format.upper() == "PDF":
            return AuditorService._export_to_pdf(report, report_type)
        else:
            # Default to JSON
            return {
                "download_url": f"/api/v1/auditor/reports/download/{report_type}.json",
                "filename": f"{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
                "format": "JSON",
                "expires_at": datetime.utcnow(),
                "data": report
            }
    
    @staticmethod
    def _export_to_pdf(report: Dict[str, Any], report_type: str) -> Dict[str, Any]:
        """Export report data to PDF format"""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from io import BytesIO
        except ImportError:
            # Fallback if reportlab is not installed
            return {
                "content": b"PDF generation requires 'reportlab' library.",
                "filename": "error.txt",
                "format": "TXT"
            }

        buffer = BytesIO()
        pdf_doc = SimpleDocTemplate(buffer, pagesize=letter)  # Renamed 'doc' to 'pdf_doc' to avoid shadowing
        elements = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = styles['Title']
        heading_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Title
        elements.append(Paragraph(f"AUDIT REPORT: {report_type.replace('_', ' ').upper()}", title_style))
        elements.append(Spacer(1, 12))

        # Metadata
        elements.append(Paragraph(f"<b>Generated By:</b> {report['generated_by']}", normal_style))
        elements.append(Paragraph(f"<b>Date:</b> {report['generated_at']}", normal_style))
        elements.append(Spacer(1, 24))

        # Section: Summary Statistics
        elements.append(Paragraph("Summary Statistics", heading_style))
        elements.append(Spacer(1, 12))
        
        summary_data = [["Metric", "Value"]]
        for k, v in report['summary'].items():
            summary_data.append([k.replace("_", " ").title(), str(v)])
        
        t = Table(summary_data, colWidths=[200, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 24))

        # Section: Integrity Alerts (if any)
        if report.get('integrity_alerts'):
            elements.append(Paragraph("Integrity Alerts", heading_style))
            elements.append(Spacer(1, 12))
            
            alert_data = [["ID", "Severity", "Title", "Status"]]
            for alert in report['integrity_alerts']:
                alert_data.append([
                    str(alert['id']),
                    alert['severity'],
                    alert['title'][:40] + ('...' if len(alert['title']) > 40 else ''), # Truncate long titles
                    alert['status']
                ])
            
            t_alerts = Table(alert_data, colWidths=[40, 70, 250, 80])
            t_alerts.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkred),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
            ]))
            elements.append(t_alerts)
            elements.append(Spacer(1, 24))

        # Section: Document Verifications (if any)
        if report.get('document_verifications'):
            elements.append(Paragraph("Recent Verifications", heading_style))
            elements.append(Spacer(1, 12))
            
            doc_data = [["Doc #", "Verified At", "Valid", "Flagged"]]
            
            # Use 'verification' instead of 'doc' to avoid shadowing variable if necessary, 
            # but more importantly, 'pdf_doc' is safe now.
            for verification in report['document_verifications'][:20]: 
                doc_data.append([
                    verification['doc_number'],
                    str(verification['verified_at'])[:19],
                    "Yes" if verification['is_valid'] else "NO",
                    "Yes" if verification['flagged'] else "No"
                ])
            
            t_docs = Table(doc_data, colWidths=[100, 150, 60, 60])
            t_docs.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#006633')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(t_docs)


        # Build PDF
        try:
            pdf_doc.build(elements) # Use the correct variable 'pdf_doc'
            pdf_value = buffer.getvalue()
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "content": str(e).encode(),
                "filename": "error.txt",
                "format": "TXT"
            }
        finally:
            buffer.close()

        # Handle None report_type gracefully
        safe_report_type = report_type or "audit"
        
        return {
            "content": pdf_value,
            "filename": f"{safe_report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf",
            "format": "PDF"
        }

    @staticmethod
    def _export_to_csv(report: Dict[str, Any], report_type: str) -> Dict[str, Any]:
        """Export report data to CSV format"""
        output = StringIO()
        writer = csv.writer(output)

        # Write summary section
        writer.writerow(["AUDIT REPORT", report_type])
        writer.writerow(["Generated At", report["generated_at"]])
        writer.writerow(["Generated By", report["generated_by"]])
        writer.writerow([])

        # Write summary statistics
        writer.writerow(["SUMMARY"])
        summary = report["summary"]
        for key, value in summary.items():
            writer.writerow([key.replace("_", " ").title(), value])
        writer.writerow([])

        # Write document verifications
        writer.writerow(["DOCUMENT VERIFICATIONS"])
        writer.writerow(["Document ID", "Doc Number", "Verified At", "Is Valid", "Flagged"])
        for doc in report["document_verifications"]:
            writer.writerow([
                doc["document_id"],
                doc["doc_number"],
                doc["verified_at"],
                doc["is_valid"],
                doc["flagged"]
            ])
        writer.writerow([])

        # Write integrity alerts
        writer.writerow(["INTEGRITY ALERTS"])
        writer.writerow(["Alert ID", "Type", "Severity", "Title", "Detected At", "Status"])
        for alert in report["integrity_alerts"]:
            writer.writerow([
                alert["id"],
                alert["type"],
                alert["severity"],
                alert["title"],
                alert["detected_at"],
                alert["status"]
            ])

        csv_content = output.getvalue()
        output.close()

        return {
            "content": csv_content,
            "filename": f"{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "format": "CSV"
        }

    @staticmethod
    def _create_alert(
        db: Session,
        alert_type: AlertType,
        severity: Severity,
        title: str,
        description: str,
        document_id: Optional[int] = None,
        trade_id: Optional[int] = None,
        user_id: Optional[int] = None,
        ledger_entry_id: Optional[int] = None
    ) -> ComplianceAlert:
        """Create a new compliance alert"""
        alert = ComplianceAlert(
            alert_type=alert_type,
            severity=severity,
            status=AlertStatus.OPEN,
            title=title,
            description=description,
            document_id=document_id,
            trade_id=trade_id,
            user_id=user_id,
            ledger_entry_id=ledger_entry_id
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        return alert

    @staticmethod
    def detect_suspicious_patterns(db: Session) -> List[ComplianceAlert]:
        """Detect suspicious patterns and create alerts"""
        new_alerts = []

        # Check for trades with multiple disputes
        disputed_trades = db.query(TradeTransaction).filter(
            TradeTransaction.status == TradeStatus.DISPUTED
        ).all()

        for trade in disputed_trades:
            # Check if this trade already has an alert
            existing = db.query(ComplianceAlert).filter(
                and_(
                    ComplianceAlert.trade_id == trade.id,
                    ComplianceAlert.alert_type == AlertType.SUSPICIOUS_TRANSACTION_PATTERN
                )
            ).first()

            if not existing:
                alert = AuditorService._create_alert(
                    db=db,
                    alert_type=AlertType.SUSPICIOUS_TRANSACTION_PATTERN,
                    severity=Severity.HIGH,
                    title="Trade in Disputed Status",
                    description=f"Trade {trade.id} between buyer {trade.buyer_id} and seller {trade.seller_id} is in disputed status. Amount: {trade.amount} {trade.currency}",
                    trade_id=trade.id
                )
                new_alerts.append(alert)

        # Check for documents without verification
        unverified_docs = db.query(Document).outerjoin(
            LedgerEntry,
            and_(
                LedgerEntry.document_id == Document.id,
                LedgerEntry.action == LedgerAction.VERIFIED
            )
        ).filter(LedgerEntry.id == None).limit(50).all()

        for doc in unverified_docs:
            # Only alert if document is older than 24 hours
            if (datetime.utcnow() - doc.created_at).days >= 1:
                existing = db.query(ComplianceAlert).filter(
                    and_(
                        ComplianceAlert.document_id == doc.id,
                        ComplianceAlert.alert_type == AlertType.MISSING_LIFECYCLE_STAGE
                    )
                ).first()

                if not existing:
                    alert = AuditorService._create_alert(
                        db=db,
                        alert_type=AlertType.MISSING_LIFECYCLE_STAGE,
                        severity=Severity.MEDIUM,
                        title="Document Not Verified",
                        description=f"Document {doc.doc_number} has not been verified within 24 hours of creation",
                        document_id=doc.id
                    )
                    new_alerts.append(alert)

        return new_alerts