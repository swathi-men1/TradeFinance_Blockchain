"""
Authentication routes - Login, Signup, Token refresh.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User
from app.schemas.auth import (
    LoginRequest, LoginResponse, SignupRequest, 
    TokenResponse, RefreshTokenRequest, UserResponse
)
from app.core.security import get_password_hash, verify_password
from app.core.jwt_tokens import (
    create_access_token, create_refresh_token, 
    verify_token, get_user_from_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    User login endpoint.
    Returns JWT access and refresh tokens.
    """
    print(f"\n🔐 LOGIN ATTEMPT: {credentials.username}")
    
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user:
        print(f"   ❌ User not found: {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        print(f"   ❌ Invalid password for {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    if not user.is_active:
        print(f"   ❌ Inactive user: {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Create tokens
    token_data = {"sub": str(user.id), "username": user.username, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    print(f"   ✅ Login successful for {user.username} (ID: {user.id}, Role: {user.role.value})")
    print(f"   🔑 Access token created (expires in {ACCESS_TOKEN_EXPIRE_MINUTES} min)")
    print(f"   🔄 Refresh token created (expires in 7 days)")
    
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
        ),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/signup", response_model=LoginResponse)
async def signup(user_data: SignupRequest, db: Session = Depends(get_db)):
    """
    User registration endpoint.
    Creates new user and returns JWT tokens.
    """
    print(f"\n📝 SIGNUP ATTEMPT: {user_data.username}")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        print(f"   ❌ Username already exists: {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        print(f"   ❌ Email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        is_active=True,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"   ✅ User created successfully")
    print(f"   - ID: {new_user.id}")
    print(f"   - Username: {new_user.username}")
    print(f"   - Email: {new_user.email}")
    print(f"   - Role: {new_user.role.value}")
    
    # Create tokens
    token_data = {"sub": str(new_user.id), "username": new_user.username, "role": new_user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    print(f"   🔑 JWT tokens generated")
    
    return LoginResponse(
        user=UserResponse(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            is_active=new_user.is_active,
        ),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    """
    print(f"\n🔄 TOKEN REFRESH ATTEMPT")
    
    try:
        payload = verify_token(request.refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            print(f"   ❌ Invalid token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        # Verify user still exists and is active
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            print(f"   ❌ User not found or inactive")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )
        
        # Create new access token
        token_data = {"sub": str(user.id), "username": user.username, "role": user.role.value}
        new_access_token = create_access_token(token_data)
        
        print(f"   ✅ New access token generated for user {user.username}")
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=request.refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        
    except Exception as e:
        print(f"   ❌ Token refresh failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = None, db: Session = Depends(get_db)):
    """
    Get current user from token.
    Token can be passed as query param or header.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token required",
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user = db.query(User).filter(User.id == user_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )
