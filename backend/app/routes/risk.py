from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.risk_engine import calculate_risk_score
from app.models.risk_score import RiskScore
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/risk",
    tags=["Risk"]
)


@router.get("/{user_id}")
def get_risk_score(
    user_id: int,   # ✅ MUST be int
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculates and stores risk score for a user.
    Only BANK, ADMIN, AUDITOR allowed.
    """

    # -------------------------------------------------
    # 🔐 Role Authorization
    # -------------------------------------------------
    if current_user.role.upper() not in ["BANK", "ADMIN", "AUDITOR"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access risk analysis"
        )

    # -------------------------------------------------
    # 🔎 Validate User Exists
    # -------------------------------------------------
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -------------------------------------------------
    # 🧠 Calculate Risk
    # -------------------------------------------------
    score, rationale = calculate_risk_score(db, user_id)

    # -------------------------------------------------
    # 💾 Store Risk Record
    # -------------------------------------------------
    risk_record = RiskScore(
        user_id=user_id,
        score=score,
        rationale=rationale
    )

    db.add(risk_record)
    db.commit()

    return {
        "user_id": user_id,
        "risk_score": score,
        "rationale": rationale
    }
