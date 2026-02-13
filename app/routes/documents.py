from fastapi import APIRouter, Depends, UploadFile, File
from app.routes.auth import require_role
from app.services.ledger_service import create_ledger_entry
from app.services.risk_service import calculate_user_risk

router = APIRouter(prefix="/documents", tags=["Documents"])

# 🔹 Fake in-memory storage
DOCUMENT_STORE = {}
DOC_COUNTER = 1


@router.post("/upload-document")
def upload_document(
    trade_id: int,
    file: UploadFile = File(...),
    token_data: dict = Depends(require_role("BUYER", "SELLER"))
):
    global DOC_COUNTER

    doc_id = DOC_COUNTER
    DOC_COUNTER += 1

    DOCUMENT_STORE[doc_id] = {
        "filename": file.filename,
        "uploaded_by": token_data["sub"],
        "role": token_data["role"],
        "trade_id": trade_id
    }

    # 🔥 Ledger entry (actor + related corporate user)
    create_ledger_entry(
        action="DOCUMENT_UPLOADED",
        user=token_data,
        document_id=doc_id,
        trade_id=trade_id,
        related_user=token_data["sub"]  # Corporate user gets risk impact
    )

    # 🔥 Recalculate risk for Corporate User
    calculate_user_risk(token_data["sub"])

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "uploaded_by": token_data["sub"],
        "role": token_data["role"],
        "trade_id": trade_id
    }


@router.post("/{doc_id}/verify-integrity")
def verify_integrity(doc_id: int):

    if doc_id not in DOCUMENT_STORE:
        return {"status": "DOCUMENT NOT FOUND"}

    document = DOCUMENT_STORE[doc_id]

    # 🔹 Fake hash check (demo)
    stored_hash = "SAVED_HASH"
    current_hash = "SAVED_HASH"

    if stored_hash == current_hash:
        create_ledger_entry(
            action="DOC_VERIFY_SUCCESS",
            user={"sub": "system", "role": "SYSTEM"},
            document_id=doc_id,
            trade_id=document["trade_id"],
            related_user=document["uploaded_by"]
        )

        calculate_user_risk(document["uploaded_by"])

        return {"status": "VALID"}

    else:
        create_ledger_entry(
            action="DOC_VERIFY_FAILED",
            user={"sub": "system", "role": "SYSTEM"},
            document_id=doc_id,
            trade_id=document["trade_id"],
            related_user=document["uploaded_by"]
        )

        calculate_user_risk(document["uploaded_by"])

        return {"status": "TAMPERED"}
