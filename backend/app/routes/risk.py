from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.risk_engine import calculate_risk_score
from app.models.risk_score import RiskScore

router = APIRouter(
    prefix="/risk",
    tags=["Risk"]
)

@router.get("/{user_id}")
def get_risk_score(user_id: str, db: Session = Depends(get_db)):
    score, rationale = calculate_risk_score(db, user_id)

    risk = RiskScore(
        user_id=user_id,
        score=score,
        rationale=rationale
    )

    db.add(risk)
    db.commit()

    return {
        "user_id": user_id,
        "risk_score": score,
        "rationale": rationale
    }
