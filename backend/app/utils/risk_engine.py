from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.document import Document
from app.models.trade_transaction import TradeTransaction
from app.models.ledger import LedgerEntry


def calculate_risk_score(db: Session, user_id: int):
    """
    Rule-based weighted risk scoring.
    Final score between 0–100.
    Higher score = Higher risk.
    """

    total_score = 0
    rationale_parts = []

    # =====================================================
    # 1️⃣ DOCUMENT INTEGRITY (Weight: 40)
    # =====================================================
    total_docs = db.query(Document).filter(
        Document.uploaded_by == user_id
    ).count()

    tampered_docs = db.query(Document).filter(
        Document.uploaded_by == user_id,
        Document.status == "TAMPERED"
    ).count()

    if total_docs > 0:
        integrity_ratio = tampered_docs / total_docs
        integrity_score = integrity_ratio * 40
        total_score += integrity_score

        if tampered_docs > 0:
            rationale_parts.append(
                f"{tampered_docs} tampered document(s)"
            )

    # =====================================================
    # 2️⃣ TRADE BEHAVIOR (Weight: 30)
    # =====================================================
    disputed_trades = db.query(TradeTransaction).filter(
        or_(
            TradeTransaction.buyer_id == user_id,
            TradeTransaction.seller_id == user_id
        ),
        TradeTransaction.status == "disputed"
    ).count()

    pending_trades = db.query(TradeTransaction).filter(
        or_(
            TradeTransaction.buyer_id == user_id,
            TradeTransaction.seller_id == user_id
        ),
        TradeTransaction.status == "pending"
    ).count()

    trade_score = min(disputed_trades * 10, 30)
    total_score += trade_score

    if disputed_trades > 0:
        rationale_parts.append(
            f"{disputed_trades} disputed trade(s)"
        )

    if pending_trades > 3:
        total_score += 10
        rationale_parts.append("High number of pending trades")

    # =====================================================
    # 3️⃣ LEDGER ACTIVITY (Weight: 20)
    # =====================================================
    integrity_failures = db.query(LedgerEntry).filter(
        LedgerEntry.actor_id == user_id,
        LedgerEntry.action == "INTEGRITY_FAILURE"
    ).count()

    ledger_score = min(integrity_failures * 5, 20)
    total_score += ledger_score

    if integrity_failures > 0:
        rationale_parts.append(
            f"{integrity_failures} integrity failure action(s)"
        )

    # =====================================================
    # 4️⃣ BASE RISK (Weight: 10)
    # =====================================================
    total_score += 10

    # =====================================================
    # FINAL SCORE (Clamp 0–100)
    # =====================================================
    final_score = min(round(total_score, 2), 100)

    rationale = (
        " | ".join(rationale_parts)
        if rationale_parts
        else "Low risk user"
    )

    return final_score, rationale
