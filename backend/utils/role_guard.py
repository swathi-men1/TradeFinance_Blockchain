from fastapi import Depends, HTTPException
from utils.auth_dependencies import get_current_user


def require_role(allowed_roles: list):
    def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Access denied for your role"
            )
        return user
    return role_checker
