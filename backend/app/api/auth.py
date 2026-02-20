from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, PasswordChange, ProfileUpdate
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    return AuthService.register_user(db, user_data)


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Login and receive JWT token"""
    return AuthService.login_user(db, credentials, background_tasks)


@router.post("/logout", response_model=dict)
def logout(current_user: User = Depends(get_current_user)):
    """Logout user"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@router.post("/change-password", response_model=dict)
def change_password(
    password_data: PasswordChange, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password (authenticated users only)"""
    return AuthService.change_password(db, current_user, password_data)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile/personal details (authenticated users only)"""
    return AuthService.update_profile(db, current_user, profile_data)

