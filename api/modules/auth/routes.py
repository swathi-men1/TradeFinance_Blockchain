# /* Author: Abdul Samad | */
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from db.session import get_db
from db.models import UserProfiles, RoleEnum
from schemas import UserCreate, UserResponse, Token
from core.config import settings
from auth import get_password_hash, verify_password, create_access_token

from jose import JWTError, jwt
from core.config import settings

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(UserProfiles).filter(UserProfiles.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    content = await file.read()
    db_user = db.query(UserProfiles).filter(UserProfiles.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = UserProfiles(
        name=user.name, 
        email=user.email, 
        password=hashed_password,
        role=user.role,
        org_name=user.org_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Audit Log for User Creation (Self-Registration)
    # Using a try-except block to ensure registration succeeds even if logging fails (though logger handles safe commit)
    try:
        from utils.audit_logger import log_audit_event
        log_audit_event(
            user_id=db_user.id, 
            action="USER_REGISTERED",
            target_type="USER",
            target_id=db_user.id,
            details={"email": db_user.email, "role": db_user.role, "org": db_user.org_name}
        )
    except Exception as e:
        print(f"Audit log warning: {e}")
        
    return db_user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(UserProfiles).filter(UserProfiles.email == form_data.username).first()
        with open("debug_log.txt", "a") as f:
            f.write(f"DEBUG: Login attempt for {form_data.username}. User found: {user is not None}\n")
            if user:
                 f.write(f"DEBUG: User pass hash: {user.password}\n")
                 f.write(f"DEBUG: Verify result: {verify_password(form_data.password, user.password)}\n")
        
        if not user or not verify_password(form_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        import traceback
        with open("debug_log.txt", "a") as f:
            f.write(f"ERROR IN LOGIN: {e}\n{traceback.format_exc()}\n")
        raise e
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "org_name": user.org_name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: UserProfiles = Depends(get_current_user)):
    """Get current user details."""
    return current_user


from pydantic import BaseModel

from schemas import UserRoleUpdate

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int, 
    role_update: UserRoleUpdate, 
    db: Session = Depends(get_db), 
    current_user: UserProfiles = Depends(get_current_user)
):
    try:
        # RBAC: Admin only
        if current_user.role != RoleEnum.admin:
            raise HTTPException(status_code=403, detail="Only Admins can change roles")
            
        user_to_update = db.query(UserProfiles).filter(UserProfiles.id == user_id).first()
        if not user_to_update:
            raise HTTPException(status_code=404, detail="User not found")
            
        old_role = user_to_update.role
        user_to_update.role = role_update.role
        
        old_role = user_to_update.role
        user_to_update.role = role_update.role
        
        # Audit Log using centralized utility
        from utils.audit_logger import log_audit_event
        log_audit_event(
            user_id=current_user.id,
            action="ROLE_CHANGE",
            target_type="USER",
            target_id=user_id,
            details={"old_role": str(old_role), "new_role": str(role_update.role)}
        )
        
        db.commit()
        db.refresh(user_to_update)
        return user_to_update
    except Exception as e:
        import traceback
        with open("debug_log.txt", "a") as logf:
            logf.write(f"CRITICAL ERROR IN UPDATE_USER_ROLE: {e}\n")
            logf.write(traceback.format_exc() + "\n")
        raise e
