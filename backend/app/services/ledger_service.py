from sqlalchemy.orm import Session
from typing import List
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.audit import AuditLog
from app.models.user import User, UserRole


from app.core.ledger_hash import LedgerHash
from app.services.risk_service import RiskService

class LedgerService:
    @staticmethod
    def create_entry(
        db: Session,
        document_id: int | None,
        action: LedgerAction,
        actor_id: int,
        entry_metadata: dict = None
    ) -> LedgerEntry:
        """Create a new ledger entry with hash chaining"""
        
        # 1. Fetch Previous Entry (for chaining)
        # Chains are per-document. If document_id is None, it forms a separate 'system/trade' chain.
        last_entry = db.query(LedgerEntry).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.desc()).first()
        
        previous_hash = last_entry.entry_hash if last_entry and last_entry.entry_hash else "GENESIS"
        
        # 2. Generate Hash
        entry_hash = LedgerHash.generate_hash(
            document_id=document_id,
            action=action.value,
            actor_id=actor_id,
            metadata=entry_metadata,
            previous_hash=previous_hash
        )
        
        # 3. Create Entry
        ledger_entry = LedgerEntry(
            document_id=document_id,
            action=action,
            actor_id=actor_id,
            entry_metadata=entry_metadata,
            previous_hash=previous_hash,
            entry_hash=entry_hash
        )
        
        db.add(ledger_entry)
        db.commit()
        db.refresh(ledger_entry)
        
        # Audit Log for Admin actions
        # We need to fetch the actor to check role, or pass actor object instead of ID.
        # Refactoring to take actor_id directly to avoid extra queries if not needed, 
        # but for audit we need role. 
        # For now, let's keep the signature close to original but efficient.
        # The original passed 'actor: User'. The proposed change passed 'actor_id'.
        # I should probably pass 'actor: User' OR query it. 
        # To strictly follow the "Refactoring" idea, I should update the signature.
        
        actor = db.query(User).filter(User.id == actor_id).first()
        if actor and actor.role == UserRole.ADMIN:
            audit_log = AuditLog(
                admin_id=actor.id,
                action=f"CREATE_LEDGER_ENTRY_{action.value}",
                target_type="LedgerEntry",
                target_id=ledger_entry.id
            )
            db.add(audit_log)
            db.commit()
        
            db.commit()
        
        # Trigger risk recalculation based on actor activity
        # (Input 2: User Activity - Ledger Based)
        RiskService.trigger_on_ledger_entry(db, actor_id, action.value)

        return ledger_entry
    
    @staticmethod
    def get_document_timeline(db: Session, document_id: int) -> List[LedgerEntry]:
        """Get chronological ledger entries for a document"""
        return db.query(LedgerEntry).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.asc()).all()
