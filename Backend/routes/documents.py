from fastapi import APIRouter

router = APIRouter()

@router.post("/upload")
def upload_document():
    return {"status": "success", "message": "Document uploaded and hashed"}
