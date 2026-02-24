from sqlalchemy.orm import Session
from models.document import Document
from models.risk_score import RiskScore
from datetime import datetime

class RiskService:
    @staticmethod
    def calculate_document_risk(document_type: str, uploaded_by: int, db: Session) -> int:
        """
        Calculate a risk score for a document (0-100, where 100 is highest risk).
        """
        score = 15  # Base risk
        
        # 1. Type-based risk
        doc_type = document_type.lower()
        if "invoice" in doc_type:
            score += 15
        elif "bill of lading" in doc_type:
            score += 5
        elif "contract" in doc_type:
            score += 25
        elif "letter of credit" in doc_type:
            score += 10
            
        # 2. User-based risk (historical)
        user_risk = db.query(RiskScore).filter(RiskScore.entity_id == uploaded_by).first()
        if user_risk:
            # If user has a high risk score, it impacts the document risk
            if user_risk.score > 50:
                score += int((user_risk.score - 50) // 2)
        
        return min(100, score)

    @staticmethod
    def update_entity_risk(entity_id: int, db: Session, change: float, rationale: str):
        """
        Update the cumulative risk score for a user or organization.
        """
        risk = db.query(RiskScore).filter(RiskScore.entity_id == entity_id).first()
        
        if not risk:
            new_score = max(0.0, min(100.0, 50.0 + change))
            risk = RiskScore(
                entity_id=entity_id,
                score=new_score,
                rationale=rationale,
                history=[{"date": datetime.utcnow().isoformat(), "score": new_score, "reason": rationale}]
            )
            db.add(risk)
        else:
            old_score = risk.score
            new_score = max(0.0, min(100.0, old_score + change))
            risk.score = new_score
            risk.rationale = rationale
            risk.updated_at = datetime.utcnow()
            
            # Update history
            history = list(risk.history) if risk.history else []
            history.append({
                "date": datetime.utcnow().isoformat(),
                "old_score": old_score,
                "new_score": new_score,
                "reason": rationale
            })
            risk.history = history
            
        db.commit()
        return risk
