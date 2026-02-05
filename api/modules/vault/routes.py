from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import Documents, RoleEnum
from api.modules.auth.routes import get_current_user
from services.store import VaultService

router = APIRouter()

@router.get("/download/{doc_id}")
def generate_download_link(doc_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Securely checks RBAC and returns a 'Pre-signed URL' (or direct link) to the file.
    This fulfills the 'Object storage' secure access pattern.
    """
    # 1. Fetch Document
    doc = db.query(Documents).filter(Documents.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2. RBAC Check (Reusing Org-Scope Logic)
    # Admin/Auditor/Bank: Access All
    # Corporate: Access Only Own Org
    
    has_access = False
    
    if current_user.role in [RoleEnum.admin, RoleEnum.auditor, RoleEnum.bank, "admin", "auditor", "bank"]:
        has_access = True
    elif current_user.role in [RoleEnum.corporate, "corporate"]:
        # Allow if User is Owner OR User's Org matches Owner's Org
        if doc.owner_id == current_user.id:
            has_access = True
        elif current_user.org_name and doc.owner and doc.owner.org_name == current_user.org_name:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to access this document in Vault")

    # 3. Generate Link
    # Extract key from stored URL (simplified logic)
    # Assuming file_url is stored like "/uploads/filename" or similar
    # We need just the filename effectively if stored locally
    filename = doc.file_url.split("/")[-1]
    
    # Generate "Pre-signed" URL
    url = VaultService.generate_presigned_url(filename)
    if not url:
         raise HTTPException(status_code=404, detail="File object missing in Vault")
         
    return {"download_url": url, "expires_in": 3600}
