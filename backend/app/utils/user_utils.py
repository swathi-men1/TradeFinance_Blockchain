"""Utility functions for user management"""
import random
import string
from sqlalchemy.orm import Session
from app.models.user import User


def generate_user_code(name: str, db: Session) -> str:
    """
    Generate a unique 6-character user code.
    Format: First 3 letters of name (uppercase) + 3 random digits
    Example: "John Doe" -> "JOH847"
    
    Args:
        name: User's full name
        db: Database session to check for uniqueness
        
    Returns:
        str: Unique 6-character user code
    """
    # Extract first 3 letters from name (remove spaces, get first 3 chars)
    name_clean = ''.join(char for char in name if char.isalpha())
    name_prefix = name_clean[:3].upper().ljust(3, 'X')  # Pad with X if name is shorter
    
    # Generate unique code
    max_attempts = 100
    for _ in range(max_attempts):
        # Generate 3 random digits
        random_suffix = ''.join(random.choices(string.digits, k=3))
        user_code = f"{name_prefix}{random_suffix}"
        
        # Check if code already exists
        existing = db.query(User).filter(User.user_code == user_code).first()
        if not existing:
            return user_code
    
    # Fallback: Use 6 random alphanumeric characters if all attempts failed
    for _ in range(max_attempts):
        user_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = db.query(User).filter(User.user_code == user_code).first()
        if not existing:
            return user_code
    
    # This should never happen, but just in case
    raise ValueError("Failed to generate unique user code after multiple attempts")
