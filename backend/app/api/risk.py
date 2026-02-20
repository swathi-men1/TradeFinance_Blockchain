from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.risk import RiskScore
from app.models.document import Document
from app.schemas.risk import (
    RiskScoreResponse, 
    RiskRecalculationResponse,
    RiskScoreSummary,
    RiskCategoryDistribution
)
from app.services.risk_service import RiskService

router = APIRouter()


@router.get("/my-score", response_model=RiskScoreResponse)
def get_my_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's risk score.
    
    CORPORATE users only - they are the subject of risk evaluation.
    Bank users do not have risk scores (they are operators, not counterparties).
    """
    if current_user.role != UserRole.CORPORATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Corporate users have risk scores. Bank users are operators, not counterparties."
        )
    
    # Calculate and store fresh score
    risk_score = RiskService.calculate_user_risk(db, current_user.id, trigger_source="self_query")
    
    if not risk_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not calculate risk score"
        )
    
    return RiskScoreResponse(
        user_id=risk_score.user_id,
        score=risk_score.score,
        category=risk_score.category,  # Now stored in DB
        rationale=risk_score.rationale,
        last_updated=risk_score.last_updated
    )


@router.get("/user/{user_id}", response_model=RiskScoreResponse)
def get_user_score(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get any user's risk score.
    
    Restricted to Auditors and Admins.
    """
    if current_user.role not in [UserRole.AUDITOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Auditors and Admins can view other users' risk scores"
        )
    
    # Calculate fresh score
    risk_score = RiskService.calculate_user_risk(db, user_id, trigger_source="auditor_query")
    
    if not risk_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk score not found for user"
        )
    
    return RiskScoreResponse(
        user_id=risk_score.user_id,
        score=risk_score.score,
        category=risk_score.category,
        rationale=risk_score.rationale,
        last_updated=risk_score.last_updated
    )


@router.post("/recalculate-all", response_model=RiskRecalculationResponse)
def recalculate_all_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger bulk recalculation of all risk scores.
    
    Restricted to Admins only.
    Processes all Corporate and Bank users.
    Returns summary response.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can trigger bulk recalculation"
        )
    
    count = RiskService.recalculate_all_users(db, admin_id=current_user.id)
    
    return RiskRecalculationResponse(
        status="SUCCESS",
        total_processed=count,
        message=f"Successfully recalculated risk scores for {count} users"
    )


@router.get("/all", response_model=List[RiskScoreResponse])
def get_all_risk_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all stored risk scores.
    
    Restricted to Admins and Auditors.
    Returns scores sorted by risk (highest first).
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Auditors can view all risk scores"
        )
    
    scores = RiskService.get_all_risk_scores(db)
    
    return [
        RiskScoreResponse(
            user_id=score.user_id,
            user_name=score.user.name if score.user else "Unknown",
            user_role=score.user.role.value if score.user and hasattr(score.user.role, 'value') else (str(score.user.role) if score.user else None),
            organization=score.user.org_name if score.user else None,
            score=score.score,
            category=score.category,
            rationale=score.rationale,
            last_updated=score.last_updated
        )
        for score in scores
    ]


@router.get("/high-risk", response_model=List[RiskScoreResponse])
def get_high_risk_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get users with HIGH risk category.
    
    Restricted to Admins and Auditors.
    Useful for risk monitoring dashboard.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Auditors can view high risk users"
        )
    
    scores = RiskService.get_high_risk_users(db)
    
    return [
        RiskScoreResponse(
            user_id=score.user_id,
            user_name=score.user.name if score.user else "Unknown",
            user_role=score.user.role.value if score.user and hasattr(score.user.role, 'value') else (str(score.user.role) if score.user else None),
            organization=score.user.org_name if score.user else None,
            score=score.score,
            category=score.category,
            rationale=score.rationale,
            last_updated=score.last_updated
        )
        for score in scores
    ]


@router.get("/distribution", response_model=RiskCategoryDistribution)
def get_risk_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get distribution of risk categories.
    
    Returns count of users in each risk category.
    Restricted to Admins and Auditors.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Auditors can view risk distribution"
        )
    
    all_scores = RiskService.get_all_risk_scores(db)
    
    low_count = sum(1 for s in all_scores if s.category == "LOW")
    medium_count = sum(1 for s in all_scores if s.category == "MEDIUM")
    high_count = sum(1 for s in all_scores if s.category == "HIGH")
    
    return RiskCategoryDistribution(
        low_count=low_count,
        medium_count=medium_count,
        high_count=high_count,
        total_users=len(all_scores)
    )


@router.post("/calculate-by-documents/{user_id}")
def calculate_risk_by_documents(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate and return detailed risk score analysis based on user's documents.
    
    This endpoint shows:
    - Document upload count & integrity metrics
    - Risk contributions from document analysis
    - Detailed breakdown of risk calculation
    
    Restricted to Admins and Auditors.
    Only Corporate/Bank users have risk scores.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Auditors can request risk calculations"
        )
    
    # Verify user exists and is corporate/bank
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role not in [UserRole.CORPORATE, UserRole.BANK]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Risk scores are only calculated for Corporate and Bank users"
        )
    
    # Get document statistics
    documents = db.query(Document).filter(Document.owner_id == user_id).all()
    total_docs = len(documents)
    
    # Count tampered documents
    tampered_docs = 0
    for doc in documents:
        from app.models.ledger import LedgerEntry, LedgerAction
        from sqlalchemy import func
        
        failed_entry = db.query(LedgerEntry).filter(
            LedgerEntry.document_id == doc.id,
            LedgerEntry.action == LedgerAction.VERIFIED,
            func.jsonb_extract_path_text(LedgerEntry.entry_metadata, 'is_valid') == 'false'
        ).first()
        
        if failed_entry:
            tampered_docs += 1
    
    # Calculate risk score
    risk_score = RiskService.calculate_user_risk(db, user_id, trigger_source="document_analysis")
    
    if not risk_score:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate risk score"
        )
    
    return {
        "user_id": user_id,
        "user_name": user.name,
        "user_role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "organization": user.org_name,
        "document_analysis": {
            "total_documents": total_docs,
            "tampered_documents": tampered_docs,
            "integrity_rate": f"{((total_docs - tampered_docs) / total_docs * 100):.1f}%" if total_docs > 0 else "N/A"
        },
        "risk_score": {
            "score": float(risk_score.score),
            "category": risk_score.category,
            "rationale": risk_score.rationale,
            "last_updated": risk_score.last_updated.isoformat() if risk_score.last_updated else None
        }
    }
