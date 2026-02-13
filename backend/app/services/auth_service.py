from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.utils.user_utils import generate_user_code
from app.services.ledger_service import LedgerService
from app.models.ledger import LedgerAction


class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate unique user code
        user_code = generate_user_code(user_data.name, db)
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        new_user = User(
            user_code=user_code,
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            role=UserRole.CORPORATE,  # Force default role, block admin self-reg
            org_name=user_data.org_name,
            is_active=False  # Require admin approval
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create ledger entry for user registration
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.USER_REGISTERED,
            actor_id=new_user.id,
            entry_metadata={
                "user_email": new_user.email,
                "user_name": new_user.name,
                "user_role": new_user.role.value,
                "org_name": new_user.org_name,
                "user_code": new_user.user_code,
                "is_active": new_user.is_active
            }
        )
        
        return new_user
    
    @staticmethod
    def login_user(db: Session, credentials: UserLogin, background_tasks: BackgroundTasks) -> Token:
        """Login user and return JWT token"""
        # Find user by email
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active (approved by admin)
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account is pending admin approval. Please contact an administrator.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create JWT token
        token_data = {
            "sub": user.email,
            "user_id": user.id,  # Required by get_current_user in deps.py
            "name": user.name,
            "role": user.role.value,
        }
        access_token = create_access_token(data=token_data)
        
        return {"access_token": access_token, "token_type": "bearer"}
    


