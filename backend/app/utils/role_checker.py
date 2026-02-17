from fastapi import HTTPException, status

def require_roles(current_user, allowed_roles: list):
    """
    Ensure the logged-in user has one of the allowed roles.
    """
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this resource."
        )
