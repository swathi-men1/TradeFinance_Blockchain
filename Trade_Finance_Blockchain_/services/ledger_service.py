from models.ledger_entry import LedgerEntry

def log_ledger(db, document_id: int, action: str, actor: str):
    entry = LedgerEntry(
        document_id=document_id,
        action=action,
        actor_role=actor
    )
    db.add(entry)
    db.commit()
