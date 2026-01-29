import hashlib

def compute_ledger_hash(document_hash: str, previous_hash: str | None) -> str:
    combined = document_hash + (previous_hash or "")
    return hashlib.sha256(combined.encode()).hexdigest()
