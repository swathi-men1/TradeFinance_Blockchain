import hashlib
from datetime import datetime

ledger_db = []

def create_ledger_entry(document_id, doc_hash, action, user):
    previous_hash = ledger_db[-1]["document_hash"] if ledger_db else None

    entry = {
        "ledger_id": str(len(ledger_db) + 1),
        "document_id": document_id,
        "document_hash": doc_hash,
        "action": action,
        "performed_by": user["sub"],
        "role": user["role"],
        "timestamp": datetime.utcnow().isoformat(),
        "previous_hash": previous_hash
    }

    ledger_db.append(entry)
    return entry
