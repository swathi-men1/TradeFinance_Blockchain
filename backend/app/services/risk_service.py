from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Tuple, Optional
from app.models.user import User, UserRole
from app.models.trade import TradeTransaction, TradeStatus
from app.models.document import Document
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.risk import RiskScore
from app.core.risk_rules import RiskRules
from app.core.external_risk_mock import ExternalRiskMock
from app.services.audit_service import AuditService
from app.services.ledger_service import LedgerService
from datetime import datetime


class RiskService:
    """
    Risk Scoring Service - CORPORATE USER-based risk calculation.
    
    Mentor Requirements:
    1. Risk score is calculated for CORPORATE Users only
       - They are counterparties in trades (subject to evaluation)
       - Bank users are operators (not subject to counterparty risk assessment)
    2. Uses deterministic, rule-based calculation (NOT ML)
    3. Stores: score, category, rationale, timestamp
    4. Triggers recalculation on specific events
    
    This keeps the model clean:
    - Corporate users behavior affects risk score
    - Bank users actions (trade initiation, document upload) create audit trail
    - Risk focuses on counterparty reliability, not operational behavior
    """
    
    # ================== DATA COLLECTION METHODS ==================
    
    @staticmethod
    def get_user_trade_statistics(db: Session, user_id: int) -> Tuple[int, int, int, int]:
        """
        Get trade statistics for a user.
        Returns: (total_trades, disputed_trades, cancelled_trades, delayed_trades)
        
        User can be buyer or seller.
        """
        trades = db.query(TradeTransaction).filter(
            (TradeTransaction.buyer_id == user_id) | 
            (TradeTransaction.seller_id == user_id)
        ).all()
        
        total_trades = len(trades)
        disputed_trades = sum(1 for t in trades if t.status == TradeStatus.DISPUTED)
        # Note: If you have cancelled/delayed status, count them here
        cancelled_trades = 0  # Extended: Add status if available
        delayed_trades = 0  # Extended: Add status if available
        
        return total_trades, disputed_trades, cancelled_trades, delayed_trades

    @staticmethod
    def get_document_integrity_statistics(db: Session, user_id: int) -> Tuple[int, int]:
        """
        Get document integrity statistics for a user.
        Returns: (total_documents, tampered_documents)
        
        Tampered means there is a VERIFIED ledger entry with is_valid=False.
        """
        documents = db.query(Document).filter(Document.owner_id == user_id).all()
        total_documents = len(documents)
        
        tampered_count = 0
        for doc in documents:
            # Check for failed verification entries
            failed_entry = db.query(LedgerEntry).filter(
                LedgerEntry.document_id == doc.id,
                LedgerEntry.action == LedgerAction.VERIFIED,
                # JSONB query: metadata->>'is_valid' == 'false'
                func.jsonb_extract_path_text(LedgerEntry.entry_metadata, 'is_valid') == 'false'
            ).first()
            
            if failed_entry:
                tampered_count += 1
                
        return total_documents, tampered_count

    @staticmethod
    def get_user_activity_statistics(db: Session, user_id: int) -> Tuple[int, int, int]:
        """
        Get ledger activity statistics for a user.
        Returns: (total_entries, failed_verifications, corrections_count)
        
        Analyzes:
        - Failed ledger events
        - Abnormal action frequency
        - Repeated corrections/amendments
        """
        # Get all ledger entries where user is the actor
        entries = db.query(LedgerEntry).filter(
            LedgerEntry.actor_id == user_id
        ).all()
        
        total_entries = len(entries)
        
        # Count failed verifications
        failed_verifications = 0
        corrections_count = 0
        
        for entry in entries:
            if entry.entry_metadata:
                # Check for failed verification
                if entry.action == LedgerAction.VERIFIED:
                    is_valid = entry.entry_metadata.get('is_valid', True)
                    if is_valid == False or is_valid == 'false':
                        failed_verifications += 1
                
                # Check for corrections/amendments
                if entry.action in [LedgerAction.AMENDED]:
                    corrections_count += 1
        
        return total_entries, failed_verifications, corrections_count

    # ================== CORE CALCULATION METHOD ==================
    
    @staticmethod
    def calculate_user_risk(db: Session, user_id: int, trigger_source: str = "manual") -> Optional[RiskScore]:
        """
        Calculate and store risk score for a user.
        
        This is the main calculation method following mentor's formula:
        
        Formula:
        final_score = (doc_risk × 40) + (activity_risk × 25) + (transaction_risk × 25) + (external_risk × 10)
        
        Args:
            db: Database session
            user_id: User to calculate risk for
            trigger_source: What event triggered this calculation
            
        Returns:
            RiskScore record (created or updated)
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != UserRole.CORPORATE:
            return None
        
        # ===== Step 1: Collect Data =====
        
        # Document integrity data
        total_docs, tampered_docs = RiskService.get_document_integrity_statistics(db, user_id)
        
        # User activity data (ledger-based)
        total_entries, failed_verifications, corrections_count = RiskService.get_user_activity_statistics(db, user_id)
        
        # Transaction behavior data
        total_trades, disputed_trades, cancelled_trades, delayed_trades = RiskService.get_user_trade_statistics(db, user_id)
        
        # External risk data (stays backend only)
        external_raw = ExternalRiskMock.get_country_risk(user.org_name)
        
        # ===== Step 2: Calculate Sub-Scores (0-1 each) =====
        
        doc_risk, doc_explanation = RiskRules.calculate_document_risk(total_docs, tampered_docs)
        
        activity_risk, activity_explanation = RiskRules.calculate_activity_risk(
            total_entries, failed_verifications, corrections_count
        )
        
        transaction_risk, transaction_explanation = RiskRules.calculate_transaction_risk(
            total_trades, disputed_trades, cancelled_trades, delayed_trades
        )
        
        external_risk, external_explanation = RiskRules.calculate_external_risk(external_raw, "country")
        
        # ===== Step 3: Calculate Final Weighted Score =====
        
        final_score, category, rationale_list = RiskRules.calculate_final_score(
            doc_risk=doc_risk,
            activity_risk=activity_risk,
            transaction_risk=transaction_risk,
            external_risk=external_risk,
            doc_explanation=doc_explanation,
            activity_explanation=activity_explanation,
            transaction_explanation=transaction_explanation,
            external_explanation=external_explanation
        )
        
        # Add trigger source to rationale
        rationale_list.append(f"")
        rationale_list.append(f"Calculation triggered by: {trigger_source}")
        rationale_list.append(f"Timestamp: {datetime.utcnow().isoformat()}")
        
        rationale_text = "\n".join(rationale_list)
        
        # ===== Step 4: Store/Update in DB =====
        
        risk_score_record = db.query(RiskScore).filter(RiskScore.user_id == user_id).first()
        
        if risk_score_record:
            risk_score_record.score = final_score
            risk_score_record.category = category
            risk_score_record.rationale = rationale_text
            risk_score_record.last_updated = datetime.utcnow()
        else:
            risk_score_record = RiskScore(
                user_id=user_id,
                score=final_score,
                category=category,
                rationale=rationale_text
            )
            db.add(risk_score_record)
            
        db.commit()
        db.refresh(risk_score_record)
        
        # Log audit event
        AuditService.log_event(
            db=db,
            admin_id=None,  # System/automatic calculation
            action=f"RISK_CALCULATION_{trigger_source.upper()}",
            target_type="RiskScore",
            target_id=risk_score_record.id
        )
        
        return risk_score_record

    # ================== EVENT TRIGGER METHODS ==================
    # These are called by other services when specific events occur
    
    @staticmethod
    def trigger_on_document_verification(db: Session, document_id: int, is_valid: bool):
        """
        Trigger risk recalculation when document verification occurs.
        Called by DocumentService after verification.
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            RiskService.calculate_user_risk(
                db, document.owner_id, 
                trigger_source="document_verification_" + ("pass" if is_valid else "fail")
            )
    
    @staticmethod
    def trigger_on_ledger_entry(db: Session, actor_id: int, action: str):
        """
        Trigger risk recalculation when a ledger entry is created.
        Called by LedgerService after entry creation.
        """
        RiskService.calculate_user_risk(
            db, actor_id,
            trigger_source=f"ledger_entry_{action}"
        )
    
    @staticmethod
    def trigger_on_trade_status_change(db: Session, trade_id: int, new_status: str):
        """
        Trigger risk recalculation when trade status changes.
        Called by TradeService after status update.
        
        Recalculates for both buyer and seller.
        """
        trade = db.query(TradeTransaction).filter(TradeTransaction.id == trade_id).first()
        if trade:
            # Recalculate for buyer
            RiskService.calculate_user_risk(
                db, trade.buyer_id,
                trigger_source=f"trade_status_{new_status}"
            )
            # Recalculate for seller
            RiskService.calculate_user_risk(
                db, trade.seller_id,
                trigger_source=f"trade_status_{new_status}"
            )

    # ================== ADMIN BULK OPERATIONS ==================
    
    @staticmethod
    def recalculate_all_users(db: Session, admin_id: int) -> int:
        """
        Recalculate risk scores for all relevant users (Corporate, Bank).
        Returns number of processed users.
        
        Called by admin endpoint for bulk recalculation.
        """
        users = db.query(User).filter(
            User.role == UserRole.CORPORATE
        ).all()
        
        count = 0
        for user in users:
            RiskService.calculate_user_risk(db, user.id, trigger_source="admin_bulk_recalculation")
            count += 1
            
        # Log bulk action
        AuditService.log_event(
            db=db,
            admin_id=admin_id,
            action="BULK_RISK_RECALCULATION",
            target_type="System",
            target_id=0
        )
        
        # Create ledger entry for bulk risk recalculation
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.RISK_SCORE_RECALCULATED,
            actor_id=admin_id,
            entry_metadata={
                "bulk_operation": True,
                "users_processed": count,
                "trigger_source": "admin_bulk_recalculation"
            }
        )
        
        return count

    # ================== QUERY METHODS ==================
    
    @staticmethod
    def get_user_risk_score(db: Session, user_id: int) -> Optional[RiskScore]:
        """
        Get stored risk score for a user without recalculating.
        """
        return db.query(RiskScore).filter(RiskScore.user_id == user_id).first()
    
    @staticmethod
    def get_all_risk_scores(db: Session) -> List[RiskScore]:
        """
        Get all stored risk scores (for admin dashboard).
        """
        return db.query(RiskScore).order_by(RiskScore.score.desc()).all()
    
    @staticmethod
    def get_high_risk_users(db: Session) -> List[RiskScore]:
        """
        Get users with HIGH risk category.
        """
        return db.query(RiskScore).filter(RiskScore.category == "HIGH").all()
