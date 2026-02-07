from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------

SECRET_KEY = "SUPER_SECRET_KEY_CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ------------------------------------------------------------------
# FAKE USERS DB (TEMP)
# ------------------------------------------------------------------

fake_users_db = {
    "buyer": {
        "username": "buyer",
        "hashed_password": "$2b$12$DfYWaSenNSswgoiMf8jqk./lh/nNmjUL/MZ6jXu4S1t2.JFapT6zC",
        "role": "BUYER",
    },
    "seller": {
        "username": "seller",
        "hashed_password": "$2b$12$oAd6OUjGDpMEcvV9MB3q4.4zHGBrWzoG440f1qS3Fw7FAyXe3zxPC",
        "role": "SELLER",
    },
    "admin": {
        "username": "admin",
        "hashed_password": "$2b$12$DfYWaSenNSswgoiMf8jqk./lh/nNmjUL/MZ6jXu4S1t2.JFapT6zC",
        "role": "ADMIN",
    },
}

# ------------------------------------------------------------------
# UTILITY FUNCTIONS
# ------------------------------------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=15)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ------------------------------------------------------------------
# AUTH DEPENDENCIES
# ------------------------------------------------------------------

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = fake_users_db.get(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


# ✅ ROLE-BASED AUTHORIZATION
def require_role(*allowed_roles: str):
    def role_checker(token: str = Depends(oauth2_scheme)):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            role: str = payload.get("role")

            if role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden"
                )

            return payload

        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    return role_checker

# ------------------------------------------------------------------
# LOGIN ROUTE (OAuth2 Compatible)
# ------------------------------------------------------------------

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(
        data={
            "sub": user["username"],
            "role": user["role"]
        },
        expires_delta=timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------

SECRET_KEY = "SUPER_SECRET_KEY_CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ------------------------------------------------------------------
# FAKE USERS DB (TEMP)
# ------------------------------------------------------------------

fake_users_db = {
    "buyer": {
        "username": "buyer",
        "hashed_password": "$2b$12$DfYWaSenNSswgoiMf8jqk./lh/nNmjUL/MZ6jXu4S1t2.JFapT6zC",
        "role": "BUYER",
    },
    "seller": {
        "username": "seller",
        "hashed_password": "$2b$12$oAd6OUjGDpMEcvV9MB3q4.4zHGBrWzoG440f1qS3Fw7FAyXe3zxPC",
        "role": "SELLER",
    },
    "admin": {
        "username": "admin",
        "hashed_password": "$2b$12$DfYWaSenNSswgoiMf8jqk./lh/nNmjUL/MZ6jXu4S1t2.JFapT6zC",
        "role": "ADMIN",
    },
}

# ------------------------------------------------------------------
# UTILITY FUNCTIONS
# ------------------------------------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=15)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ------------------------------------------------------------------
# AUTH DEPENDENCIES
# ------------------------------------------------------------------

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = fake_users_db.get(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


# ✅ ROLE-BASED AUTHORIZATION
def require_role(*allowed_roles: str):
    def role_checker(token: str = Depends(oauth2_scheme)):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            role: str = payload.get("role")

            if role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden"
                )

            return payload

        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    return role_checker

# ------------------------------------------------------------------
# LOGIN ROUTE (OAuth2 Compatible)
# ------------------------------------------------------------------

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(
        data={
            "sub": user["username"],
            "role": user["role"]
        },
        expires_delta=timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
