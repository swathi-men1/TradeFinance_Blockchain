from fastapi import APIRouter, Depends, UploadFile, File
from app.routes.auth import require_role

router = APIRouter()

@router.post("/upload")
def upload_doc(
    file: UploadFile = File(...),
    token_data: dict = Depends(require_role("BUYER", "SELLER"))
):
    return {
        "filename": file.filename,
        "uploaded_by": token_data["sub"],  # ✅ FIX
        "role": token_data["role"]
    }
