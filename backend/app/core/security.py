from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Bcrypt cost factor: Balance between security and performance
# Development: 4 (fastest for internship/testing, ~10-20ms per hash)
# Production: 12 (more secure for production, ~500ms per hash)
BCRYPT_COST = 4 if settings.DEBUG else 12


def hash_password(password: str) -> str:
    """Hash a plain password using bcrypt with optimized cost factor"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=BCRYPT_COST)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash (optimized)"""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.warning(f"Password verification error: {str(e)}")
        return False


# JWT token creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
