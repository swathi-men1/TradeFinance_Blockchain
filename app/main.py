from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from app.auth import authenticate_user, create_access_token

from app.routes import (
    auth,
    documents,
    trades,
    ledger,
    risk,
    analytics
)

# Create app
app = FastAPI(title="Trade Finance Blockchain API")

# ✅ CORS (place early)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Login Endpoint
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": user["username"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# ✅ Register routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(trades.router)
app.include_router(ledger.router)
app.include_router(risk.router)
app.include_router(analytics.router)

# ✅ Root check
@app.get("/")
def root():
    return {"status": "API running"}
