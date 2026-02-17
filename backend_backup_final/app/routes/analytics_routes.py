from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import RiskScore, TradeTransaction
from ..routes.auth_routes import get_current_user
from pydantic import BaseModel
from datetime import datetime
from ..models import SystemLog
from ..utils import log_action

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# -------------------------
# SCHEMA
# -------------------------


class CreateRiskScoreRequest(BaseModel):
    user_id: int
    score: float
    rationale: str


# -------------------------
# CREATE RISK SCORE
# -------------------------


@router.post("/risk")
def create_risk_score(data: CreateRiskScoreRequest,
                      db: Session = Depends(get_db),
                      current_user=Depends(get_current_user)):

    risk = RiskScore(user_id=data.user_id,
                     score=data.score,
                     rationale=data.rationale,
                     last_updated=datetime.utcnow())

    db.add(risk)
    db.commit()
    db.refresh(risk)

    log_action(
        db=db,
        user_id=current_user.id,
        action_type="CREATE_RISK_SCORE",
        entity_type="RISK",
        entity_id=risk.id,
        description=f"Risk score {risk.score} created for user {risk.user_id}")

    return {"message": "Risk score created", "risk_id": risk.id}


# -------------------------
# LIST RISK SCORES
# -------------------------


@router.get("/risk")
def list_risk_scores(db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):

    risks = db.query(RiskScore).all()

    return [{
        "id": r.id,
        "user_id": r.user_id,
        "score": float(r.score),
        "rationale": r.rationale,
        "last_updated": r.last_updated
    } for r in risks]


# -------------------------
# DASHBOARD STATS
# -------------------------


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):

    transactions = db.query(TradeTransaction).all()
    risks = db.query(RiskScore).all()

    total_volume = sum(float(tx.amount) for tx in transactions)
    active_trades = len([tx for tx in transactions if tx.status == "pending"])
    high_risk_count = len([r for r in risks if float(r.score) > 70])

    return {
        "total_volume": total_volume,
        "active_trades": active_trades,
        "high_risk_entities": high_risk_count
    }


# -------------------------
# LIST SYSTEM LOGS
# -------------------------


@router.get("/logs")
def list_system_logs(db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):

    logs = db.query(SystemLog).order_by(SystemLog.created_at.desc()).all()

    return [{
        "id": log.id,
        "user_id": log.user_id,
        "action_type": log.action_type,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "description": log.description,
        "created_at": log.created_at
    } for log in logs]
