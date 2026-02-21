from sqlalchemy.orm import Session
from sqlalchemy import func

from models.transaction import TradeTransaction
from models.ledger_entry import LedgerEntry


def generate_analytics(db: Session):
    """
    SAFE analytics that NEVER crashes dashboard
    (works even if DB schema is incomplete)
    """

    analytics = {
        "documents_by_type": {},     # disabled safely
        "trades_by_status": {},
        "ledger_activity_count": 0
    }

    # -------------------------------
    # TRANSACTIONS BY STATUS
    # -------------------------------
    try:
        trades = (
            db.query(
                TradeTransaction.status,
                func.count(TradeTransaction.id)
            )
            .group_by(TradeTransaction.status)
            .all()
        )

        analytics["trades_by_status"] = {
            status.lower(): count for status, count in trades
        }
    except Exception as e:
        print("TRADE ANALYTICS ERROR:", e)

    # -------------------------------
    # LEDGER COUNT
    # -------------------------------
    try:
        analytics["ledger_activity_count"] = (
            db.query(func.count(LedgerEntry.id)).scalar() or 0
        )
    except Exception as e:
        print("LEDGER ANALYTICS ERROR:", e)

    return analytics
