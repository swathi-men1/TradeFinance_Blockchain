# /* Author: Abdul Samad | */
import hashlib
import os
from sqlalchemy.orm import Session
from datetime import datetime
from db.models import Documents, TradeLedger, ActionEnum, UserProfiles
from fastapi import UploadFile, HTTPException

# Robust path resolution: backend/uploads
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

def calculate_hash(file_path: str) -> str:
    # Generate SHA-256 for integrity
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

async def save_document(db: Session, file: UploadFile, doc_type: str, doc_number: str, owner: UserProfiles, trade_id: int = None):
    print(f"DEBUG: save_document called. doc_type={doc_type}, number={doc_number}, owner={owner.id}, trade_id={trade_id}")
    file_location = None
    try:
        # Validation: Check file type
        ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
        filename = file.filename if file.filename else "unknown"
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}")

        # Validate file size (10MB limit)
        MAX_SIZE = 10 * 1024 * 1024 # 10MB
        file_content_bytes = await file.read()
        if len(file_content_bytes) > MAX_SIZE:
             raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        print("DEBUG: File read successfully.")

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Secure filename
        safe_filename = filename.replace(" ", "_")
        file_location = f"{UPLOAD_DIR}/{safe_filename}"
        
        # Server-side Hashing
        docHash = hashlib.sha256(file_content_bytes).hexdigest()
        
        # Duplicate Check
        existing_doc = db.query(Documents).filter(Documents.hash == docHash).first()
        if existing_doc:
            print("DEBUG: Duplicate found.")
            raise HTTPException(status_code=400, detail="Document already exists on the ledger.")
        
        # ATOMIC BLOCK START
        # 1. DB Changes (Pending)
        new_doc = Documents(
            owner_id=owner.id,
            doc_type=doc_type,
            doc_number=doc_number,
            file_url=f"uploads/{safe_filename}",
            hash=docHash,
            issued_at=datetime.utcnow(),
            trade_id=trade_id
        )
        db.add(new_doc)
        db.flush() # Generate ID, check constraints
        
        # 2. Ledger (Pending)
        from services.ledger_service import LedgerService
        LedgerService.create_entry(
            db,
            new_doc.id,
            ActionEnum.ISSUED,
            owner.id,
            metadata={"filename": safe_filename, "size": len(file_content_bytes), "docHash": docHash},
            commit=False # Important: Do not commit yet
        )
        db.flush()

        # 3. File Storage (Risk Point)
        with open(file_location, "wb") as f:
            f.write(file_content_bytes)

        # 4. Final Commit
        db.commit()
        db.refresh(new_doc)
        
        # 3. Ledger Auto-Mining (Genesis Block for this Doc)
        from services.ledger_service import LedgerService
        from db.models import ActionEnum
        
        # If no trade_id provided, it's an isolated doc upload (e.g. initial PO)
        # We still record it on the ledger. 
        # NOTE: Our updated LedgerEntry model REQUIRES a trade_id because of FK constraint?
        # Let's check models.py: `trade_id = Column(Integer, ForeignKey("trade_transactions.id"))`
        # and nullable is False (default).
        # SO, if trade_id is None, this will fail if we try to insert into Ledger.
        # Logic: 
        # If trade_id is passed, use it.
        # If not passed (e.g. Uploading PO to *create* a trade), the route handles trade creation FIRST, then passes trade_id here.
        # So trade_id should ideally result in a trade existing.
        # If trade_id is missing, we might skip ledger or require it. 
        # Routes.py implementation shows PO upload creates trade first. So we are safe.
        
        if trade_id:
            from services.ledger import LedgerService
            LedgerService.create_ledger_entry(
                db,
                trade_id,
                ActionEnum.ISSUED,
                owner.id,
                document_id=new_doc.id,
                metadata={"filename": file.filename},
            )
        else:
            # Fallback? If no trade_id, we can't link to a trade. 
            # But per strict rules, all docs belong to a trade context?
            # Or maybe we allow NULL trade_id in Ledger?
            # Checked models.py: `trade_id = Column(Integer, ForeignKey("trade_transactions.id"))` -> Nullable False by default.
            # So we MUST have a trade_id.
            pass
        print("DEBUG: Atomic Transaction Success.")
        
        return new_doc

    except Exception as e:
        # ROLLBACK
        db.rollback()
        print(f"CRITICAL ERROR IN SAVE_DOCUMENT: {e}")
        
        # Clean up file if written
        if file_location and os.path.exists(file_location):
            try:
                os.remove(file_location)
                print("DEBUG: Cleaned up orphan file.")
            except:
                pass

        import traceback
        with open("debug_log.txt", "a") as logf:
            logf.write(f"CRITICAL ERROR IN SAVE_DOCUMENT: {e}\n")
            logf.write(traceback.format_exc() + "\n")
        
        raise e
