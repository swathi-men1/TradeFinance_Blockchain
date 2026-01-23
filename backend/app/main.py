"""
Main FastAPI application entry point.
Initializes database, creates tables, and sets up routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import init_database, SessionLocal
from app.database.init_db import init_dummy_data
from app.routes import auth
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ChainDocs - Trade Finance Blockchain Explorer",
    description="API for secure trade document management and blockchain ledger",
    version="1.0.0",
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth routes
app.include_router(auth.router)


@app.on_event("startup")
async def startup_event():
    """
    Run on application startup.
    This is where we initialize the database and create dummy data.
    """
    print("\n" + "#"*70)
    print("# 🚀 CHAINDOCS APPLICATION STARTUP")
    print("#"*70 + "\n")
    
    try:
        # Initialize database
        engine, session_local = init_database()
        
        # Create dummy data
        db = session_local()
        init_dummy_data(db)
        db.close()
        
        print("\n" + "#"*70)
        print("# ✅ APPLICATION READY FOR TESTING")
        print("#"*70)
        print("# 🌐 FastAPI Docs: http://localhost:8000/docs")
        print("# 📊 ReDoc: http://localhost:8000/redoc")
        print("#"*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ STARTUP ERROR: {str(e)}")
        raise


@app.get("/", tags=["Health"])
async def root():
    """API health check endpoint."""
    return {
        "status": "ok",
        "application": "ChainDocs - Trade Finance Blockchain Explorer",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "message": "All systems operational",
    }


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "*"*70)
    print("* CHAINDOCS BACKEND SERVER")
    print("* Starting FastAPI server on http://localhost:8000")
    print("*"*70 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
