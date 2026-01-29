from app.models.trade_transaction import TradeTransaction
from app.models.risk_score import RiskScore

def calculate_risk_score(db, user_id):
    score = 100
    reasons = []

    disputed_trades = db.query(TradeTransaction)\
        .filter_by(buyer_id=user_id, status="disputed")\
        .count()

    if disputed_trades > 0:
        score -= 30
        reasons.append("Disputed trades detected")

    incomplete_trades = db.query(TradeTransaction)\
        .filter_by(buyer_id=user_id, status="pending")\
        .count()

    if incomplete_trades > 3:
        score -= 20
        reasons.append("High number of incomplete trades")

    return max(score, 0), ", ".join(reasons)
