from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, documents, ledger, trades, admin, risk, monitoring, consistency, bank, corporate, auditor
from app.core.scheduler import start_scheduler
from app.core.middleware import TimingMiddleware

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Add Performance Middleware
app.add_middleware(TimingMiddleware)

# Include routers with prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(ledger.router, prefix=settings.API_V1_PREFIX)
app.include_router(trades.router, prefix=settings.API_V1_PREFIX)
app.include_router(bank.router, prefix=settings.API_V1_PREFIX)
app.include_router(corporate.router, prefix=settings.API_V1_PREFIX)
app.include_router(auditor.router, prefix=settings.API_V1_PREFIX)
app.include_router(risk.router, prefix=f"{settings.API_V1_PREFIX}/risk", tags=["Risk"])
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Admin"])
app.include_router(monitoring.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Monitoring"])
app.include_router(consistency.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Consistency"])


@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Trade Finance Blockchain Explorer API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Start background tasks on startup"""
    start_scheduler()
