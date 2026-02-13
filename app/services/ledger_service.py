import hashlib
import time
from app.models.ledger import LedgerEntry, ledger_db


def generate_hash(data: str):
    return hashlib.sha256(data.encode()).hexdigest()


def create_ledger_entry(
    action: str,
    user: dict,
    document_id: int = None,
    trade_id: int = None,
    related_user: str = None,
    doc_hash: str = None,
):

    previous_hash = ledger_db[-1].current_hash if ledger_db else None
    timestamp = str(time.time())

# user can be dict OR string
    if isinstance(user, dict):
        username = user.get("sub")
        role = user.get("role")
    else:
        username = user
        role = "UNKNOWN"


    raw_data = "|".join([
        str(document_id),
        str(trade_id),
        str(doc_hash),
        action,
        str(username),
        str(related_user),
        timestamp,
        str(previous_hash)
    ])

    current_hash = generate_hash(raw_data)

    entry = LedgerEntry(
        document_id=document_id,
        trade_id=trade_id,
        doc_hash=doc_hash,
        action=action,
        username=username,
        role=role,
        related_user=related_user,
        timestamp=timestamp,
        previous_hash=previous_hash,
        current_hash=current_hash,
    )

    ledger_db.append(entry)

    return entry
