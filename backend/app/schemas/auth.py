"""
Pydantic schemas for request/response validation.
Automatically generates OpenAPI documentation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    """User role enum."""
    ADMIN = "admin"
    BANK = "bank"
    CORPORATE = "corporate"
    AUDITOR = "auditor"


# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    """Login request body."""
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    password: str = Field(..., min_length=6, max_length=100, description="Password")


class SignupRequest(BaseModel):
    """User registration request."""
    username: str = Field(..., min_length=3, max_length=100, description="Unique username")
    email: EmailStr = Field(..., description="Valid email address")
    full_name: str = Field(..., min_length=3, max_length=200, description="Full name")
    password: str = Field(..., min_length=8, max_length=100, description="Password (min 8 chars)")
    role: UserRole = Field(default=UserRole.CORPORATE, description="User role")


class TokenResponse(BaseModel):
    """Token response with access and refresh tokens."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiry in seconds")


class UserResponse(BaseModel):
    """User information response."""
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool


class LoginResponse(BaseModel):
    """Complete login response with user and tokens."""
    user: UserResponse
    tokens: TokenResponse
    message: str = "Login successful"


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str = Field(..., description="Refresh token")


class MessageResponse(BaseModel):
    """Generic success message response."""
    message: str
    status: str = "success"


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    status: str = "error"


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserProfileResponse(BaseModel):
    """User profile response."""
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: str
