# /* Author: Abdul Samad | */
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import RiskAssessment, RoleEnum, TradeFlows, UserProfiles
from schemas import RiskAssessmentResponse
from api.modules.auth.routes import get_current_user
from core.permissions import RoleChecker
import random

router = APIRouter()

@router.get("/search", response_model=RiskAssessmentResponse,
    summary="Search Risk Score by User ID",
    description="Search for a user's risk score by ID. Bank/Auditor only.")
async def search_risk_score(
    target_id: int = Query(..., alias="user_id"),
    db: Session = Depends(get_db), 
    current_user: UserProfiles = Depends(get_current_user)
):
    # Only Bank/Auditor/Admin can search
    if current_user.role not in [RoleEnum.bank, RoleEnum.auditor, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Only Bank, Auditor, or Admin can search risk scores.")
    
    # Check if user exists
    target_user = db.query(UserProfiles).filter(UserProfiles.id == target_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User with ID {target_id} not found.")
    
    # Calculate/retrieve risk score
    from services.risk_engine import RiskEngine
    return RiskEngine.calculate_and_update(db, target_id)

@router.get(
    "/{target_user_id}", 
    response_model=RiskAssessmentResponse,
    summary="Get Risk Score (Intelligence Engine)",
    description="Calculates or retrieves the 70/30 Hybrid Risk Score."
)
async def get_risk_score(target_user_id: int, db: Session = Depends(get_db), current_user: UserProfiles = Depends(get_current_user)):
    # 1. Access Control Logic (Strict ACL)
    user_role = current_user.role
    
    # AUDITOR / BANK / ADMIN: Can view ANY target.
    # Requirement: "Bank ... Can view ANY user's risk." "Auditor ... High Risk Alert List" (Implies allowed to see details)
    if user_role in [RoleEnum.auditor, RoleEnum.bank, RoleEnum.admin]:
        pass # access granted
        
    # CORPORATE: Can ONLY view SELF.
    elif user_role == RoleEnum.corporate:
        if current_user.id != target_user_id:
             raise HTTPException(status_code=403, detail="You are not authorized to view other organizations' risk profiles.")
             
    else:
        # Default deny for any unknown role
        raise HTTPException(status_code=403, detail="Not authorized.")

    # 2. Logic
    from services.risk_engine import RiskEngine
    return RiskEngine.calculate_and_update(db, target_user_id)

@router.get("/summary/high-risk", response_model=list[RiskAssessmentResponse])
def get_high_risk_summary(db: Session = Depends(get_db), current_user: UserProfiles = Depends(get_current_user)):
    # AUDITOR ONLY
    if current_user.role != RoleEnum.auditor:
        raise HTTPException(status_code=403, detail="Only Auditors can view system-wide risk maps.")
        
    rankings = db.query(RiskAssessment).filter(RiskAssessment.score > 70).all()
    return rankings
