from fastapi import APIRouter, Depends, UploadFile, File
from app.routes.auth import require_role

router = APIRouter()

# 🔹 Fake in-memory storage
DOCUMENT_STORE = {}
DOC_COUNTER = 1


@router.post("/upload")
def upload_doc(
    file: UploadFile = File(...),
    token_data: dict = Depends(require_role("BUYER", "SELLER"))
):
    global DOC_COUNTER

    doc_id = DOC_COUNTER
    DOC_COUNTER += 1

    # store minimal document metadata
    DOCUMENT_STORE[doc_id] = {
        "filename": file.filename,
        "uploaded_by": token_data["sub"],
        "role": token_data["role"]
    }

    return {
        "document_id": doc_id,          # ✅ IMPORTANT
        "filename": file.filename,
        "uploaded_by": token_data["sub"],
        "role": token_data["role"]
    }


@router.post("/{doc_id}/verify-integrity")
def verify_integrity(doc_id: int):
    if doc_id not in DOCUMENT_STORE:
        return {"status": "DOCUMENT NOT FOUND"}

    # fake hash comparison (demo purpose)
    stored_hash = "SAVED_HASH"
    current_hash = "SAVED_HASH"

    if stored_hash == current_hash:
        return {"status": "VALID"}
    return {"status": "TAMPERED"}
