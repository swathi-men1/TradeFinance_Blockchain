from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from typing import List
import boto3
from datetime import datetime
import os
import shutil
from pathlib import Path
from app.models.user import User, UserRole
from app.models.document import Document, DocumentType
from app.schemas.document import DocumentUpdate
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.audit import AuditLog
from app.core.hashing import compute_file_hash
from app.config import settings
from app.services.ledger_service import LedgerService
from app.services.risk_service import RiskService

# Local storage configuration
LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "documents_local")
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)


class DocumentService:
    @staticmethod
    async def upload_document(
        db: Session,
        current_user: User,
        file: UploadFile,
        doc_type: DocumentType,
        doc_number: str,
        issued_at: str  # Changed to str, will parse below
    ) -> Document:
        """Upload a document with file to local storage and create database record"""
        
        # Parse issued_at string to datetime
        try:
            from dateutil import parser
            issued_at_dt = parser.parse(issued_at)
        except Exception:
            # If parsing fails, try ISO format
            try:
                issued_at_dt = datetime.fromisoformat(issued_at.replace('Z', '+00:00'))
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid date format for issued_at: {issued_at}"
                )
        
        # Read file content
        file_content = await file.read()
        
        # Compute SHA-256 hash
        document_hash = compute_file_hash(file_content)
        
        # Create local storage path
        org_dir = os.path.join(LOCAL_STORAGE_DIR, current_user.org_name or "default")
        os.makedirs(org_dir, exist_ok=True)
        
        # Create filename with hash prefix
        local_filename = f"{document_hash[:8]}_{file.filename}"
        local_file_path = os.path.join(org_dir, local_filename)
        
        # Save file locally
        local_upload_success = False
        try:
            with open(local_file_path, 'wb') as f:
                f.write(file_content)
            local_upload_success = True
            print(f"✓ Document saved locally: {local_file_path}")
        except Exception as e:
            print(f"Error: Failed to save document locally - {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
        
        # Create document record (always save to DB)
        new_document = Document(
            owner_id=current_user.id,
            doc_type=doc_type,
            doc_number=doc_number,
            file_url=local_file_path,  # Store local file path
            hash=document_hash,
            issued_at=issued_at_dt,  # Use parsed datetime
            filename=file.filename,
            description=f"{doc_type.value if hasattr(doc_type, 'value') else doc_type} - {doc_number}",
            mime_type=file.content_type,
            size=len(file_content)
        )
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        # Create ledger entry for document upload
        LedgerService.create_entry(
            db=db,
            document_id=new_document.id,
            action=LedgerAction.DOCUMENT_UPLOADED,
            actor_id=current_user.id,
            entry_metadata={
                "document_id": new_document.id,
                "doc_number": new_document.doc_number,
                "doc_type": new_document.doc_type.value,
                "file_name": file.filename,
                "file_size": len(file_content),
                "document_hash": document_hash,
                "local_path": local_file_path
            }
        )
        
        # Create initial ledger entry (ISSUED)
        LedgerService.create_entry(
            db=db,
            document_id=new_document.id,
            action=LedgerAction.ISSUED,
            actor_id=current_user.id,
            entry_metadata={
                "filename": file.filename,
                "local_storage_success": local_upload_success
            }
        )
        
        # Audit Log for ALL document uploads (not just Admin actions)
        audit_log = AuditLog(
            admin_id=current_user.id if current_user.role == UserRole.ADMIN else None,
            action="UPLOAD_DOCUMENT",
            target_type="Document",
            target_id=new_document.id
        )
        db.add(audit_log)
        db.commit()
        
        return new_document
    
    @staticmethod
    def list_documents(db: Session, current_user: User) -> List[Document]:
        """List documents based on user role"""
        query = db.query(Document)
        
        # Role-based filtering
        if current_user.role in [UserRole.BANK, UserRole.CORPORATE]:
            # Can only see own documents
            query = query.filter(Document.owner_id == current_user.id)
        elif current_user.role == UserRole.AUDITOR:
            # Can see all documents
            pass
        elif current_user.role == UserRole.ADMIN:
            # Can see all documents
            pass
        
        return query.all()
    
    @staticmethod
    def get_document_by_id(db: Session, current_user: User, document_id: int) -> Document:
        """Get document by ID with permission check"""
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Permission check
        if current_user.role in [UserRole.BANK, UserRole.CORPORATE]:
            if document.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return document
    
    @staticmethod
    def verify_document_hash(db: Session, current_user: User, document_id: int) -> dict:
        """Verify document hash by re-computing from local file"""
        # Get document
        document = DocumentService.get_document_by_id(db, current_user, document_id)
        
        # Check if file exists locally
        if not os.path.exists(document.file_url):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage"
            )
        
        try:
            # Read file from local storage
            with open(document.file_url, 'rb') as f:
                file_content = f.read()
            
            # Re-compute hash
            current_hash = compute_file_hash(file_content)
            
            # Compare hashes
            is_valid = (current_hash == document.hash)
            
            # Create ledger entry for verification
            LedgerService.create_entry(
                db=db,
                document_id=document.id,
                action=LedgerAction.VERIFIED,
                actor_id=current_user.id,
                entry_metadata={
                    "stored_hash": document.hash,
                    "current_hash": current_hash,
                    "is_valid": is_valid
                }
            )
            
            # Trigger risk recalculation on verification (especially if failed)
            RiskService.trigger_on_document_verification(db, document.id, is_valid)
            
            return {
                "stored_hash": document.hash,
                "current_hash": current_hash,
                "is_valid": is_valid,
                "message": "Document is authentic" if is_valid else "Document may be tampered"
            }
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage"
            )
        except Exception as e:
            print(f"Verification Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify document: {str(e)}"
            )

    @staticmethod
    def delete_document(db: Session, current_user: User, document_id: int):
        """Delete document (Admin only)"""
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
            
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can delete documents"
            )
            
        # Create ledger entry for document deletion BEFORE actual deletion
        LedgerService.create_entry(
            db=db,
            document_id=document.id,
            action=LedgerAction.DOCUMENT_DELETED,
            actor_id=current_user.id,
            entry_metadata={
                "document_id": document.id,
                "doc_number": document.doc_number,
                "doc_type": document.doc_type.value,
                "file_url": document.file_url
            }
        )
        
        # Delete local file if it exists
        try:
            if os.path.exists(document.file_url):
                os.remove(document.file_url)
                print(f"✓ Local file deleted: {document.file_url}")
        except Exception as e:
            print(f"Warning: Failed to delete local file - {str(e)}")
        
        # Delete database record
        db.delete(document)
        db.commit()

    @staticmethod
    def update_document(
        db: Session,
        current_user: User,
        document_id: int,
        update_data: DocumentUpdate
    ) -> Document:
        """Update document metadata (Admin only)"""
        document = DocumentService.get_document_by_id(db, current_user, document_id)
        
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can update documents"
            )
            
        # Update fields
        changes = update_data.dict(exclude_unset=True)
        for key, value in changes.items():
            setattr(document, key, value)
            
        db.commit()
        db.refresh(document)
        
        # Create ledger entry for document update
        LedgerService.create_entry(
            db=db,
            document_id=document.id,
            action=LedgerAction.DOCUMENT_UPDATED,
            actor_id=current_user.id,
            entry_metadata={
                "document_id": document.id,
                "doc_number": document.doc_number,
                "changes": changes
            }
        )
        
        # Create Ledger Entry
        LedgerService.create_entry(
            db=db,
            document_id=document.id,
            action=LedgerAction.AMENDED,
            actor_id=current_user.id,
            entry_metadata=changes
        )
        
        return document
    @staticmethod
    def get_document_presigned_url(db: Session, current_user: User, document_id: int, inline: bool = False) -> dict:
        """Generate download URL for direct document access (local storage version)"""
        document = DocumentService.get_document_by_id(db, current_user, document_id)
        
        if not os.path.exists(document.file_url):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage"
            )
        
        # Extract filename
        filename = os.path.basename(document.file_url)
        if '_' in filename:
            filename = filename.split('_', 1)[1]
        
        # Return a backend download endpoint URL (local storage version)
        return {
            "url": f"/api/v1/documents/{document_id}/download",
            "filename": filename,
            "method": "GET"
        }
    
    @staticmethod
    def get_document_file(db: Session, current_user: User, document_id: int):
        """Get document file stream and filename (local storage version)"""
        document = DocumentService.get_document_by_id(db, current_user, document_id)
        
        if not os.path.exists(document.file_url):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage"
            )
            
        try:
            # Extract original filename from key
            filename = os.path.basename(document.file_url)
            if '_' in filename:
                filename = filename.split('_', 1)[1]
                
            # Determine content type (database > fallback)
            content_type = document.mime_type
            if not content_type:
                if filename.lower().endswith('.pdf'):
                    content_type = 'application/pdf'
                else:
                    content_type = 'application/octet-stream'
            
            # Open file and return iterator
            def file_iterator():
                with open(document.file_url, 'rb') as f:
                    while chunk := f.read(8192):
                        yield chunk
                
            return file_iterator(), filename, content_type
            
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage"
            )
        except Exception as e:
            print(f"Download Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve file from storage"
            )
