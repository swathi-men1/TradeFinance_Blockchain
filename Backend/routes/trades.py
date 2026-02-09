from fastapi import APIRouter

router = APIRouter()

@router.post("/create")
def create_trade():
    return {"status": "trade created"}
