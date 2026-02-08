from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.ledger import IntegrityReport
from app.api.deps import get_current_user
from app.services.integrity_service import IntegrityService

router = APIRouter()

@router.get("/integrity-report", response_model=Dict[str, Any])
def get_integrity_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest integrity verification report.
    Only accessible by Admins.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access integrity reports"
        )
    
    # We can either return the stored reports or trigger a fresh run?
    # Requirement says "Integrity Report Storage" is used.
    # The scheduler runs periodically and stores reports.
    # But reports are per document.
    # The response format requested: { total, valid, failed, failure_details }
    
    # Option 1: Aggregate from latest IntegrityReport for each document
    # Option 2: Run fresh verification (might be slow if many docs)
    # Given requirements "Persist verification results", let's use the DB.
    
    # Fetch latest report for each document
    # This requires a slightly complex query (latest by group).
    # OR helper function in service.
    
    # For simplicity and real-time accuracy (if dataset is small), running verify_all_documents() is easiest
    # and ensures the report is up to date immediately when the admin asks.
    # BUT "Integrity Report Storage" implies we should use stored data.
    
    # If we use stored data, we need to handle "Stale" reports.
    # Let's try to fetch latest reports from DB.
    
    # For now, adhering to the "Admin API Endpoint" description in prompt:
    # "Run verify_all_documents()... Store results" in Scheduler.
    # "GET /admin/integrity-report" -> "total_documents, valid_documents..."
    
    # I'll implement a hybrid: Trigger a check if requested, OR just query.
    # Let's query recent reports.
    
    # Actually, verify_all_documents returns exactly the structure we need.
    # Let's just call it. It stores reports as side effect.
    return IntegrityService.verify_all_documents(db)
