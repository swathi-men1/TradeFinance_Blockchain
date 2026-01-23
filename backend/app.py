"""
Entry point for running the FastAPI application.
Run with: python app.py
"""

if __name__ == "__main__":
    from app.main import app
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
