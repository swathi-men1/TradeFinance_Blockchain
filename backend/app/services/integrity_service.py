# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.ledger import LedgerEntry, IntegrityReport
from app.models.document import Document
from app.core.ledger_hash import LedgerHash
from datetime import datetime

class IntegrityService:
    @staticmethod
    def verify_document_chain(db: Session, document_id: int | None) -> Dict[str, Any]:
        """
        Verify the hash chain for a specific document (or the system chain if document_id is None).
        Returns status and errors.
        """
        entries = db.query(LedgerEntry).filter(
            LedgerEntry.document_id == document_id
        ).order_by(LedgerEntry.created_at.asc()).all()
        
        if not entries:
            return {"status": "VALID", "errors": [], "message": "No entries found"}
            
        params = {
            "status": "VALID",
            "errors": []
        }
        
        previous_entry_hash = "GENESIS"
        
        for entry in entries:
            # 1. Check previous hash
            if entry.previous_hash != previous_entry_hash:
                error = f"Broken chain at ID {entry.id}: previous_hash mismatch. Expected {previous_entry_hash}, got {entry.previous_hash}"
                params["status"] = "TAMPERED"
                params["errors"].append(error)
                # We can't continue ensuring next entries are valid relative to *this* one easily if the chain is broken,
                # but we can try to recompute *this* entry's hash based on what *should* have been previous or what *is* claimed.
                # However, if previous_hash is wrong, the entry_hash presumably was calculated with the *wrong* previous hash OR the entry was modified.
                # The most robust check for entry_hash is using the *actual* previous hash column value (even if wrong) or the *expected*?
                # The formula uses the stored previous_hash (from the column).
                # But if we want to verify the *chain*, we should use the *calculated* hash of the previous one.
                # Standard blockchain verification: Calculate hash using `previous_hash` field. AND verify `previous_hash` == `calculated hash of previous block`.
            
            # 2. Re-calculate current hash
            # We use the `previous_hash` that is *stored* in the entry for self-consistency check,
            # BUT for chain consistency, we verified `entry.previous_hash == previous_entry_hash` above.
            # So if that passed, `previous_entry_hash` IS `entry.previous_hash`.
            # If it failed, we have a break.
            
            # Let's strictly follow: 
            # Calculated Hash = SHA256(..., previous_hash)
            # The previous_hash used in calculation must be the one *in the record* (entry.previous_hash).
            # The *validity* of the chain depends on entry.previous_hash matching the actual hash of previous entry.
            
            expected_hash = LedgerHash.generate_hash(
                document_id=entry.document_id,
                action=entry.action.value,
                actor_id=entry.actor_id,
                metadata=entry.entry_metadata,
                previous_hash=entry.previous_hash
            )
            
            if entry.entry_hash != expected_hash:
                error = f"Data integrity failure at ID {entry.id}: entry_hash mismatch. Data may have been modified."
                params["status"] = "TAMPERED"
                params["errors"].append(error)
            
            # Update for next iteration
            previous_entry_hash = entry.entry_hash
            
        # Store report
        report = IntegrityReport(
            document_id=document_id,
            status=params["status"],
            error_message="\n".join(params["errors"]) if params["errors"] else None,
            checked_at=datetime.utcnow()
        )
        db.add(report)
        db.commit()
        
        return params

    @staticmethod
    def verify_all_documents(db: Session) -> Dict[str, Any]:
        """
        Verify chains for ALL documents and the system chain.
        """
        # 1. Get all document IDs
        docs = db.query(Document.id).all()
        doc_ids = [d.id for d in docs]
        
        # 2. Verify each document chain
        results = {
            "total_documents": len(doc_ids),
            "valid_documents": 0,
            "failed_documents": 0,
            "failure_details": []
        }
        
        for doc_id in doc_ids:
            res = IntegrityService.verify_document_chain(db, doc_id)
            if res["status"] == "VALID":
                results["valid_documents"] += 1
            else:
                results["failed_documents"] += 1
                results["failure_details"].append({
                    "document_id": doc_id,
                    "errors": res["errors"]
                })
                
        # 3. Verify System/Trade Chain (document_id=None)
        # Check if there are any entries with null document_id
        system_entries_exist = db.query(LedgerEntry).filter(LedgerEntry.document_id == None).first()
        if system_entries_exist:
             res = IntegrityService.verify_document_chain(db, None)
             if res["status"] != "VALID":
                 results["failed_documents"] += 1 # Count system chain as a "document" failure for stats? Or separate?
                 results["failure_details"].append({
                     "document_id": "SYSTEM_CHAIN",
                     "errors": res["errors"]
                 })
        
        return results
