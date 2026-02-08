from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Tuple
from app.models.user import User, UserRole
from app.models.trade import TradeTransaction, TradeStatus
from app.models.document import Document
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.risk import RiskScore
from app.core.risk_rules import RiskRules
from app.core.external_risk_mock import ExternalRiskMock
from app.services.audit_service import AuditService
from datetime import datetime

class RiskService:
    
    @staticmethod
    def get_user_trade_statistics(db: Session, user_id: int) -> Tuple[int, int]:
        """
        Get total trades and disputed trades for a user.
        User can be buyer or seller.
        """
        trades = db.query(TradeTransaction).filter(
            (TradeTransaction.buyer_id == user_id) | 
            (TradeTransaction.seller_id == user_id)
        ).all()
        
        total_trades = len(trades)
        disputed_trades = sum(1 for t in trades if t.status == TradeStatus.DISPUTED)
        
        return total_trades, disputed_trades

    @staticmethod
    def get_document_integrity_statistics(db: Session, user_id: int) -> Tuple[int, int]:
        """
        Get total documents and tampered documents for a user.
        Tampered means there is a VERIFIED ledger entry with is_valid=False.
        """
        # Get user documents
        documents = db.query(Document).filter(Document.owner_id == user_id).all()
        total_documents = len(documents)
        
        tampered_count = 0
        for doc in documents:
            # Check for failed verification entries
            failed_entry = db.query(LedgerEntry).filter(
                LedgerEntry.document_id == doc.id,
                LedgerEntry.action == LedgerAction.VERIFIED,
                # We need to check metadata for is_valid=False
                # JSONB query: metadata->>'is_valid' == 'false'
                func.jsonb_extract_path_text(LedgerEntry.entry_metadata, 'is_valid') == 'false'
            ).first()
            
            if failed_entry:
                tampered_count += 1
                
        return total_documents, tampered_count

    @staticmethod
    def calculate_user_risk(db: Session, user_id: int) -> RiskScore:
        """
        Calculate and store risk score for a user.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
            
        # 1. Gather Data
        total_trades, disputed_trades = RiskService.get_user_trade_statistics(db, user_id)
        total_docs, tampered_docs = RiskService.get_document_integrity_statistics(db, user_id)
        
        # 2. Calculate Rates
        trade_fail_rate = RiskRules.calculate_trade_failure_rate(total_trades, disputed_trades)
        tamper_rate = RiskRules.calculate_tamper_rate(total_docs, tampered_docs)
        volume_risk = RiskRules.calculate_volume_risk(total_trades)
        external_risk = ExternalRiskMock.get_country_risk(user.org_name)
        
        # 3. Calculate Final Score
        final_score, rationale_list = RiskRules.calculate_final_score(
            trade_fail_rate, tamper_rate, volume_risk, external_risk
        )
        
        rationale_text = "\n".join(rationale_list)
        
        # 4. Store/Update in DB
        risk_score_record = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()
        
        if risk_score_record:
            risk_score_record.score = final_score
            risk_score_record.rationale = rationale_text
            risk_score_record.last_updated = datetime.utcnow()
        else:
            risk_score_record = RiskScore(
                user_id=user_id,
                score=final_score,
                rationale=rationale_text
            )
            db.add(risk_score_record)
            
        db.commit()
        db.refresh(risk_score_record)
        
        # Log audit event (System action, admin_id=None or derived?)
        # For automatic calculation, admin_id might be None (System).
        AuditService.log_event(
            db=db,
            admin_id=None,
            action="RISK_CALCULATION",
            target_type="RiskScore",
            target_id=risk_score_record.id
        )
        
        return risk_score_record

    @staticmethod
    def recalculate_all_users(db: Session, admin_id: int) -> int:
        """
        Recalculate risk scores for all relevant users (Corporate, Bank).
        Returns number of processed users.
        """
        users = db.query(User).filter(
            User.role.in_([UserRole.CORPORATE, UserRole.BANK])
        ).all()
        
        count = 0
        for user in users:
            RiskService.calculate_user_risk(db, user.id)
            count += 1
            
        # Log bulk action
        AuditService.log_event(
            db=db,
            admin_id=admin_id,
            action="BULK_RISK_RECALCULATION",
            target_type="System",
            target_id=0
        )
            
        return count
