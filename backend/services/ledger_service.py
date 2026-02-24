from sqlalchemy.orm import Session
import hashlib
from datetime import datetime
from models.ledger_entry import LedgerEntry

class LedgerService:
    @staticmethod
    def calculate_hash(data_string: str) -> str:
        return hashlib.sha256(data_string.encode()).hexdigest()

    @staticmethod
    def create_entry(db: Session, action: str, role: str, performed_by: int, document_id: str = None, transaction_id: int = None):
        """
        Creates a new immutable ledger entry linked to the previous one.
        """
        # 1. Get the last entry to link the hash
        last_entry = db.query(LedgerEntry).order_by(LedgerEntry.id.desc()).first()
        previous_hash = last_entry.entry_hash if last_entry else "0"

        # 2. Timestamp
        timestamp = datetime.utcnow()
        
        # 3. Calculate Hash
        # Structure: prev_hash + doc_id + txn_id + action + role + user_id + timestamp
        data_string = f"{previous_hash}{document_id or ''}{transaction_id or ''}{action}{role}{performed_by}{timestamp.isoformat()}"
        entry_hash = LedgerService.calculate_hash(data_string)

        new_entry = LedgerEntry(
            document_id=document_id,
            transaction_id=transaction_id,
            action=action,
            actor_role=role,
            performed_by=performed_by,
            timestamp=timestamp,
            previous_hash=previous_hash,
            entry_hash=entry_hash
        )

        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return new_entry

    @staticmethod
    def verify_integrity(db: Session) -> dict:
        """
        Traverses the entire ledger to verify hash links and data integrity.
        """
        entries = db.query(LedgerEntry).order_by(LedgerEntry.id.asc()).all()
        if not entries:
            return {"status": "ok", "message": "Ledger is empty"}

        expected_previous_hash = "0"
        
        for entry in entries:
            # Check Link
            if entry.previous_hash != expected_previous_hash:
                 return {
                     "status": "corrupted", 
                     "message": f"BROKEN LINK at ID {entry.id}. Expected Previous Hash {expected_previous_hash}, got {entry.previous_hash}"
                 }
            
            # Check Content (Recalculate Hash)
            data_string = f"{entry.previous_hash}{entry.document_id or ''}{entry.transaction_id or ''}{entry.action}{entry.actor_role}{entry.performed_by}{entry.timestamp.isoformat()}"
            recalculated_hash = LedgerService.calculate_hash(data_string)
            
            if recalculated_hash != entry.entry_hash:
                 return {
                     "status": "corrupted",
                     "message": f"DATA TAMPERING at ID {entry.id}. Hash mismatch. Data may have been altered."
                 }
            
            expected_previous_hash = entry.entry_hash
            
        return {"status": "ok", "message": "Ledger integrity verified. All blocks are valid."}
