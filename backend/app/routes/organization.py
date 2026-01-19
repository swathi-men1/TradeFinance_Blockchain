from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate
from app.utils.rbac import require_role

router = APIRouter(prefix="/organizations", tags=["Organizations"])


# -------------------- DB Dependency --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- CREATE ORGANIZATION --------------------
# Only ADMIN users can create organizations
@router.post("/", dependencies=[Depends(require_role("admin"))])
def create_organization(
    org: OrganizationCreate,
    db: Session = Depends(get_db)
):
    existing_org = (
        db.query(Organization)
        .filter(Organization.name == org.name)
        .first()
    )
    if existing_org:
        raise HTTPException(
            status_code=400,
            detail="Organization already exists"
        )

    new_org = Organization(
        name=org.name,
        org_type=org.org_type
    )

    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    return new_org


# -------------------- SECURE ADMIN-ONLY ROUTE --------------------
@router.get("/secure")
def secure_org_data(
    user=Depends(require_role("admin"))
):
    return {
        "message": "Admin-only organization access"
    }
