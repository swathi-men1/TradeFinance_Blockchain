from services.ledger_service import LedgerService

def create_ledger_entry(
    db,
    document_id: str = None,
    action: str = "UNKNOWN",
    role: str = "system",
    performed_by: int = 1,
    transaction_id: int = None
):
    return LedgerService.create_entry(
        db=db,
        document_id=document_id,
        transaction_id=transaction_id,
        action=action,
        role=role,
        performed_by=performed_by
    )
