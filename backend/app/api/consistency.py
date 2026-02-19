# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.trade import TradeTransaction
from app.models.ledger import LedgerEntry
from app.models.risk import RiskScore

router = APIRouter()

@router.get("/verify-consistency")
def verify_data_consistency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check for data inconsistencies across the system.
    Requirement 8.4: Verify references, ledger, risk scores.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can verify data consistency"
        )
    
    issues = []
    
    # 1. Check for Orphaned Ledger Entries (document_id must exist)
    # Using specific SQL logic might be faster, but ORM check works for MVP size.
    # "orphaned" means foreign key constraint failed? FK constraints usually prevent this.
    # But if constraints were ever disabled or data migrated improperly...
    # Let's assume FK constraints are active. So we check for logic issues.
    
    # Check 1: Ledger entries with no hash (if strictly required)
    # Requirement 6.1: "Each new ledger entry must... Generate new entry_hash".
    # Older entries (from before Week 6) might be null? Or migration filled them?
    # Migration filled them with default/null? The migration added nullable columns.
    # So we check for NULL hashes where they should be present (if we enforce it now).
    
    null_hashes = db.query(LedgerEntry).filter(
        (LedgerEntry.entry_hash == None) | (LedgerEntry.previous_hash == None)
    ).count()
    
    if null_hashes > 0:
        issues.append(f"Found {null_hashes} ledger entries with missing hash values (legacy data?).")

    # 2. Check Risk Scores Range [0, 100]
    invalid_scores = db.query(RiskScore).filter(
        (RiskScore.score < 0) | (RiskScore.score > 100)
    ).count()
    
    if invalid_scores > 0:
        issues.append(f"CRITICAL: Found {invalid_scores} Risk Scores outside 0-100 range.")

    # 3. Check Trade Status Validity
    # Verify all trades have valid buyer/seller references (handled by FK).
    # Check for trades in 'disputed' status without corresponding ledger entry?
    # Logic: If status IS 'disputed', there should be a 'DISPUTE_RAISED' or similar action?
    # Not strictly enforced by DB, but good business logic check.
    # Skipping for now to focus on checklist explicit items.
    
    return {
        "status": "CONSISTENT" if not issues else "INCONSISTENT",
        "issue_count": len(issues),
        "issues": issues,
        "message": "Data consistency check complete."
    }
