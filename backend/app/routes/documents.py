from fastapi import APIRouter, UploadFile, File
from app.utils import generate_sha256
from app.routes.ledger import add_ledger_entry

router = APIRouter()   # ✅ REQUIRED

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    file_hash = generate_sha256(content)

    add_ledger_entry(
        action="DOCUMENT_UPLOADED",
        details={
            "filename": file.filename,
            "hash": file_hash
        }
    )

    return {
        "filename": file.filename,
        "hash": file_hash,
        "message": "Document uploaded and hashed successfully"
    }
