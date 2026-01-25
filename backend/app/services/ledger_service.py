from sqlalchemy.orm import Session
from typing import List
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.user import User


class LedgerService:
    @staticmethod
    def create_entry(
        db: Session,
        document_id: int,
        action: LedgerAction,
        actor_id: int,
        meta_data: dict = None
    ) -> LedgerEntry:
        """Create a new ledger entry"""
        ledger_entry = LedgerEntry(
            document_id=document_id,
            action=action,
            actor_id=actor_id,
            meta_data=meta_data
        )
        
        db.add(ledger_entry)
        db.commit()
        db.refresh(ledger_entry)
        
        return ledger_entry
    
    @staticmethod
    def get_document_timeline(db: Session, document_id: int) -> List[LedgerEntry]:
        """Get chronological ledger entries for a document"""
        return db.query(LedgerEntry).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.asc()).all()
