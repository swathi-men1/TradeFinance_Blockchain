# app/config.py
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    Uses Pydantic BaseSettings for validation and .env file support.
    """
    
    # Application
    APP_NAME: str = "Trade Finance Blockchain Explorer"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()