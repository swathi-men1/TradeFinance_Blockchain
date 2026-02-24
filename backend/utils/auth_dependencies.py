from fastapi import Depends, HTTPException, Request
from database.init_db import SessionLocal


# --------------------------------------------------
# DB DEPENDENCY (used everywhere)
# --------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# CURRENT USER (SESSION BASED)
# --------------------------------------------------
def get_current_user(request: Request):
    user = request.session.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return user


# --------------------------------------------------
# ROLE GUARD
# --------------------------------------------------
def require_role(allowed_roles: list):
    def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        return user

    return role_checker
