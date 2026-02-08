from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.trade import TradeTransaction, TradeStatus
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.models.risk import RiskScore

router = APIRouter()

@router.get("/system-stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get high-level system statistics.
    Admin Only.
    Returns: Total Users, Total Trades, Total Documents, Ledger Count, Risk Dist.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can view system statistics"
        )
    
    total_users = db.query(User).count()
    total_trades = db.query(TradeTransaction).count()
    total_documents = db.query(Document).count()
    total_ledger_entries = db.query(LedgerEntry).count()
    
    # Risk Distribution
    risk_dist = {
        "LOW": 0,
        "MEDIUM": 0, 
        "HIGH": 0,
        "CRITICAL": 0 # Not explicitly mapped in RiskRules yet, but requested in checklist
    }
    
    # We can iterate and count or do aggregation query. Iteration is simpler for MVP logic.
    # Or use RiskRules.get_risk_category logic directly in query -> not easily doable with standard SQL unless function defined.
    # Let's count based on score ranges.
    # 0-30, 31-60, 61-80, 81-100 (from checklist)
    
    scores = db.query(RiskScore.score).all()
    for (score,) in scores:
        s = float(score)
        if s <= 30:
            risk_dist["LOW"] += 1
        elif s <= 60:
            risk_dist["MEDIUM"] += 1
        elif s <= 80:
            risk_dist["HIGH"] += 1
        else:
            risk_dist["CRITICAL"] += 1
            
    return {
        "total_users": total_users,
        "total_trades": total_trades,
        "total_documents": total_documents,
        "total_ledger_entries": total_ledger_entries,
        "risk_distribution": risk_dist
    }

@router.get("/trade-analytics")
def get_trade_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get trade analytics.
    Admin Only.
    Returns: Success Rate, Volume Summary, Status Distribution.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can view trade analytics"
        )
        
    total = db.query(TradeTransaction).count()
    completed = db.query(TradeTransaction).filter(TradeTransaction.status == TradeStatus.COMPLETED).count()
    disputed = db.query(TradeTransaction).filter(TradeTransaction.status == TradeStatus.DISPUTED).count()
    
    success_rate = (completed / total * 100) if total > 0 else 0
    
    # Volume Summary (Sum of amounts)
    # This might need currency normalization, but assuming single currency or raw sum for MVP stats.
    volume_summary = db.query(
        TradeTransaction.currency, 
        func.sum(TradeTransaction.amount).label('total_volume')
    ).group_by(TradeTransaction.currency).all()
    
    volume_data = {v[0]: float(v[1]) for v in volume_summary}
    
    # Status Distribution
    status_counts = db.query(
        TradeTransaction.status,
        func.count(TradeTransaction.id)
    ).group_by(TradeTransaction.status).all()
    
    status_dist = {s[0].value: s[1] for s in status_counts}
    
    return {
        "success_rate": round(success_rate, 2),
        "total_volume_by_currency": volume_data,
        "status_distribution": status_dist
    }

@router.get("/risk-summary")
def get_risk_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get specific risk summary distribution.
    Admin Only.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can view risk summary"
        )
        
    # Reuse logic from system stats or make specialized
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    scores = db.query(RiskScore.score).all()
    
    for (score,) in scores:
        s = float(score)
        if s <= 30:
            risk_dist["LOW"] += 1
        elif s <= 60:
            risk_dist["MEDIUM"] += 1
        elif s <= 80:
            risk_dist["HIGH"] += 1
        else:
            risk_dist["CRITICAL"] += 1
            
    return risk_dist
