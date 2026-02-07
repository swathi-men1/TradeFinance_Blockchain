from sqlalchemy.orm import Session
from typing import List
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.audit import AuditLog
from app.models.user import User, UserRole


class LedgerService:
    def create_entry(
        db: Session,
        document_id: int,
        action: LedgerAction,
        actor: User,
        entry_metadata: dict = None
    ) -> LedgerEntry:
        """Create a new ledger entry"""
        ledger_entry = LedgerEntry(
            document_id=document_id,
            action=action,
            actor_id=actor.id,
            entry_metadata=entry_metadata
        )
        
        db.add(ledger_entry)
        db.commit()
        db.refresh(ledger_entry)
        
        # Audit Log for Admin actions
        if actor.role == UserRole.ADMIN:
            audit_log = AuditLog(
                admin_id=actor.id,
                action=f"CREATE_LEDGER_ENTRY_{action.value}",
                target_type="LedgerEntry",
                target_id=ledger_entry.id
            )
            db.add(audit_log)
            db.commit()
        
        return ledger_entry
    
    @staticmethod
    def get_document_timeline(db: Session, document_id: int) -> List[LedgerEntry]:
        """Get chronological ledger entries for a document"""
        return db.query(LedgerEntry).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.asc()).all()
