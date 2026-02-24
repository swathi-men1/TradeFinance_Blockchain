from sqlalchemy import func
from models.document import Document

def generate_analytics(db):
    total_docs = db.query(func.count(Document.id)).scalar() or 0
    avg_risk = db.query(func.avg(Document.risk_score)).scalar() or 0
    high_risk_count = db.query(func.count(Document.id)).filter(Document.risk_score > 70).scalar() or 0
    
    return {
        "total_documents": total_docs,
        "average_risk_score": round(float(avg_risk), 2),
        "high_risk_documents": high_risk_count
    }
