from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.models.document import Document


from app.core.ledger_hash import LedgerHash

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
        
        # Audit log for ALL ledger entries (not just Admin actions)
        actor = db.query(User).filter(User.id == actor_id).first()
        audit_log = AuditLog(
            admin_id=actor.id if actor and actor.role == UserRole.ADMIN else None,
            action=f"CREATE_LEDGER_ENTRY_{action.value}",
            target_type="LedgerEntry",
            target_id=ledger_entry.id
        )
        db.add(audit_log)
        db.commit()
        
        # Trigger risk recalculation based on actor activity
        # (Input 2: User Activity - Ledger Based)
        from app.services.risk_service import RiskService
        RiskService.trigger_on_ledger_entry(db, actor_id, action.value)

        return ledger_entry
    
    @staticmethod
    def get_document_timeline(db: Session, document_id: int) -> List[LedgerEntry]:
        """Get chronological ledger entries for a document"""
        return db.query(LedgerEntry).options(
            joinedload(LedgerEntry.actor)
        ).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.asc()).all()

    @staticmethod
    def get_recent_activity(db: Session, user: User, limit: int = 10) -> List[LedgerEntry]:
        """Get recent ledger entries visible to the user"""
        query = db.query(LedgerEntry).options(joinedload(LedgerEntry.actor))
        
        # Admin and Auditors can see all activity
        if user.role in [UserRole.ADMIN, UserRole.AUDITOR]:
            pass
        else:
            # Corporate/Bank: See actions they performed OR actions on their documents
            query = query.outerjoin(Document, LedgerEntry.document_id == Document.id)
            query = query.filter(
                or_(
                    LedgerEntry.actor_id == user.id,
                    Document.owner_id == user.id
                )
            )
            
        return query.order_by(LedgerEntry.created_at.desc()).limit(limit).all()
