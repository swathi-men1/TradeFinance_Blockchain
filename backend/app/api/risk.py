from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.schemas.risk import RiskScoreResponse, RiskRecalculationResponse
from app.services.risk_service import RiskService
from app.core.risk_rules import RiskRules

router = APIRouter()

@router.get("/my-score", response_model=RiskScoreResponse)
def get_my_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's risk score.
    Corporate/Bank users can only see their own score.
    """
    if current_user.role not in [UserRole.CORPORATE, UserRole.BANK]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Corporate and Bank users have a personal risk score"
        )
    
    # Calculate score on the fly or fetch stored?
    # Requirement: "Risk score must be stored ... and updated using deterministic logic"
    # To ensure data is fresh, let's calculate-and-store on read, OR just fetch stored.
    # Given "recalculate-all" exists, implies scores are persistent.
    # However, for "MVP", fetching stored might show old data if no one triggered recalc.
    # Let's TRIGGER calculation on read to ensure freshness for the user.
    
    risk_score = RiskService.calculate_user_risk(db, current_user.id)
    
    # Format response
    return RiskScoreResponse(
        user_id=risk_score.user_id,
        score=risk_score.score,
        category=RiskRules.get_risk_category(risk_score.score),
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
    Restricted to Auditors.
    """
    if current_user.role != UserRole.AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Auditors can view other users' risk scores"
        )
    
    # Fetch/Calculate
    risk_score = RiskService.calculate_user_risk(db, user_id)
    
    if not risk_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk score not found for user"
        )
    
    return RiskScoreResponse(
        user_id=risk_score.user_id,
        score=risk_score.score,
        category=RiskRules.get_risk_category(risk_score.score),
        rationale=risk_score.rationale,
        last_updated=risk_score.last_updated
    )

@router.post("/recalculate-all", response_model=RiskRecalculationResponse)
def recalculate_all_scores(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger bulk recalculation of all risk scores.
    Restricted to Admins.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can trigger bulk recalculation"
        )
    
    # Run synchronously for MVP simplicity, or background task?
    # "Ensure idempotent recalculation... process all users"
    # Prompt implies immediate response summary? "Admin recalculation must: Process all users, Return summary response"
    # So synchronous is better to return the count.
    
    count = RiskService.recalculate_all_users(db, admin_id=current_user.id)
    
    return RiskRecalculationResponse(
        status="SUCCESS",
        total_processed=count,
        message=f"Successfully recalculated risk scores for {count} users"
    )
