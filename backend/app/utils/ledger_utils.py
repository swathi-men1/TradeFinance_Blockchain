import hashlib


def compute_ledger_hash(
    entity_id: str,
    document_hash: str,
    action: str,
    previous_hash: str | None,
) -> str:
    """
    Compute a tamper-evident ledger hash.
    Any change in input will change the output hash.
    """

    data = f"{entity_id}|{document_hash}|{action}|{previous_hash or ''}"

    return hashlib.sha256(data.encode("utf-8")).hexdigest()
