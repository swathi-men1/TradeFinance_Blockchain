# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.config import settings


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None
)


# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """
    Root endpoint - API information.
    """
    return {
        "message": "Trade Finance Blockchain Explorer API",
        "docs": "/docs" if settings.DEBUG else "disabled",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint.
    Returns 200 if application is healthy.
    
    This endpoint is used by:
    - Docker healthchecks
    - Load balancers
    - Monitoring systems
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }