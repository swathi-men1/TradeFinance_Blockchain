from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import time
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, Token, PasswordChange, ProfileUpdate
from app.core.security import hash_password, verify_password, create_access_token
from app.utils.user_utils import generate_user_code
from app.services.ledger_service import LedgerService
from app.models.ledger import LedgerAction

logger = logging.getLogger(__name__)


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
        user_code = generate_user_code(user_data.org_name, db)
        
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
        """Login user and return JWT token (optimized for performance)"""
        login_start_time = time.time()
        
        # Step 1: Find user by email (indexed query - very fast)
        db_start = time.time()
        user = db.query(User).filter(User.email == credentials.email).first()
        db_time = time.time() - db_start
        
        if not user:
            logger.info(f"Login failed: User {credentials.email} not found (lookup: {db_time:.3f}s)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Step 2: Verify password (bcrypt hashing - intentionally slower for security)
        pwd_start = time.time()
        is_password_valid = verify_password(credentials.password, user.password)
        pwd_time = time.time() - pwd_start
        
        if not is_password_valid:
            logger.warning(f"Login failed: Invalid password for {credentials.email} (verify: {pwd_time:.3f}s)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Step 3: Check if user is active (instant)
        if not user.is_active:
            logger.warning(f"Login blocked: {credentials.email} account inactive")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account is pending admin approval. Please contact an administrator.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Step 4: Create JWT token (fast)
        token_start = time.time()
        token_data = {
            "sub": user.email,
            "user_id": user.id,  # Required by get_current_user in deps.py
            "name": user.name,
            "role": user.role.value,
        }
        access_token = create_access_token(data=token_data)
        token_time = time.time() - token_start
        
        # Log successful login with performance metrics
        total_time = time.time() - login_start_time
        logger.info(
            f"✓ Login: {user.email} ({user.role.value}) | "
            f"Lookup: {db_time:.3f}s, PWVerify: {pwd_time:.3f}s, Token: {token_time:.3f}s, Total: {total_time:.3f}s"
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    @staticmethod
    def change_password(db: Session, user: User, password_data: PasswordChange) -> dict:
        """Change user password with validation"""
        # Validate new passwords match
        if password_data.new_password != password_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match"
            )
        
        # Verify old password
        if not verify_password(password_data.old_password, user.password):
            logger.warning(f"Password change failed: Invalid old password for {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Prevent same password
        if password_data.old_password == password_data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Update password
        user.password = hash_password(password_data.new_password)
        db.add(user)
        db.commit()
        
        logger.info(f"✓ Password changed for {user.email}")
        
        # Create audit log entry
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.PASSWORD_CHANGED,
            actor_id=user.id,
            entry_metadata={"user_email": user.email}
        )
        
        return {"message": "Password changed successfully"}
    
    @staticmethod
    def update_profile(db: Session, user: User, profile_data: ProfileUpdate) -> User:
        """Update user profile/personal details"""
        # Check if new email is already in use by another user
        if profile_data.email and profile_data.email != user.email:
            existing_user = db.query(User).filter(
                User.email == profile_data.email,
                User.id != user.id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use by another user"
                )
        
        # Update fields if provided
        if profile_data.name is not None:
            user.name = profile_data.name
        if profile_data.email is not None:
            user.email = profile_data.email
        if profile_data.org_name is not None:
            user.org_name = profile_data.org_name
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"✓ Profile updated for {user.email}")
        
        # Create audit log entry
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.PROFILE_UPDATED,
            actor_id=user.id,
            entry_metadata={
                "user_email": user.email,
                "user_name": user.name,
                "org_name": user.org_name
            }
        )
        
        return user



