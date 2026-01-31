from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.models.trade_transaction import TradeTransaction
from app.models.risk_score import RiskScore

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):
    return {
        "total_documents": db.query(Document).count(),
        "ledger_events": db.query(LedgerEntry).count(),
        "total_trades": db.query(TradeTransaction).count(),
        "completed_trades": db.query(TradeTransaction)
            .filter(TradeTransaction.status == "completed")
            .count(),
        "risk_scores": db.query(RiskScore).count()
    }
