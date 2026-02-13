from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.models.trade_transaction import TradeTransaction
from app.models.risk_score import RiskScore
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    System-wide analytics dashboard summary.
    Only BANK, ADMIN, AUDITOR allowed.
    """

    # 🔐 Authorization Check
    if current_user.role.upper() not in ["BANK", "ADMIN", "AUDITOR"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    total_documents = db.query(Document).count()

    ledger_events = db.query(LedgerEntry).count()

    total_trades = db.query(TradeTransaction).count()

    completed_trades = db.query(TradeTransaction).filter(
        TradeTransaction.status == "completed"
    ).count()

    disputed_trades = db.query(TradeTransaction).filter(
        TradeTransaction.status == "disputed"
    ).count()

    pending_trades = db.query(TradeTransaction).filter(
        TradeTransaction.status == "pending"
    ).count()

    total_risk_scores = db.query(RiskScore).count()

    return {
        "triggered_by": {
            "user_id": current_user.id,
            "role": current_user.role
        },
        "documents": {
            "total": total_documents
        },
        "ledger": {
            "events": ledger_events
        },
        "trades": {
            "total": total_trades,
            "completed": completed_trades,
            "pending": pending_trades,
            "disputed": disputed_trades
        },
        "risk_scores": {
            "total_calculated": total_risk_scores
        }
    }
