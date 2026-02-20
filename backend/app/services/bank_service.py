from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import List, Dict, Any, Optional
import boto3
import os
import tempfile
from datetime import datetime

from app.models.trade import TradeTransaction, TradeStatus
from app.models.document import Document, DocumentType
from app.models.risk import RiskScore
from app.models.user import User, UserRole
from app.models.ledger import LedgerEntry, LedgerAction
from app.services.risk_service import RiskService
from app.services.ledger_service import LedgerService
from app.core.hashing import compute_file_hash
from app.config import settings

class BankService:
    @staticmethod
    def get_all_trades(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        trades = db.query(TradeTransaction).offset(skip).limit(limit).all()
        results = []
        
        for trade in trades:
            buyer = db.query(User).filter(User.id == trade.buyer_id).first()
            seller = db.query(User).filter(User.id == trade.seller_id).first()
            
            results.append({
                "id": trade.id,
                "buyer_id": trade.buyer_id,
                "buyer_name": buyer.name if buyer else f"User #{trade.buyer_id}",
                "seller_id": trade.seller_id,
                "seller_name": seller.name if seller else f"User #{trade.seller_id}",
                "amount": trade.amount,
                "currency": trade.currency,
                "status": str(trade.status),
                "created_at": trade.created_at.isoformat() if trade.created_at else None,
                "updated_at": trade.updated_at.isoformat() if trade.updated_at else None,
            })
            
        return results

    @staticmethod
    def update_trade_status(db: Session, trade_id: int, status: str, user_id: int) -> TradeTransaction:
        trade = db.query(TradeTransaction).filter(TradeTransaction.id == trade_id).first()
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
            
        old_status = trade.status
        trade.status = TradeStatus(status)
        db.commit()
        db.refresh(trade)

        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.AMENDED,
            actor_id=user_id,
            entry_metadata={
                "trade_id": trade.id,
                "old_status": str(old_status),
                "new_status": str(status),
                "reason": "Bank User Manual Update"
            }
        )

        if status == 'disputed':
            RiskService.trigger_on_trade_status_change(db, trade.id, 'disputed')

        return trade

    @staticmethod
    def get_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        documents = db.query(Document).offset(skip).limit(limit).all()
        results = []
        
        for doc in documents:
            # Determine verification status from ledger
            # Find last VERIFIED action for this document
            last_verification = db.query(LedgerEntry).filter(
                LedgerEntry.document_id == doc.id,
                LedgerEntry.action == LedgerAction.VERIFIED
            ).order_by(LedgerEntry.created_at.desc()).first()
            
            status = "PENDING"
            if last_verification:
                # Check metadata is_valid
                is_valid = last_verification.entry_metadata.get("is_valid", False)
                # Handle boolean or string variations just in case
                if isinstance(is_valid, str):
                    is_valid = (is_valid.lower() == 'true')
                
                status = "VERIFIED" if is_valid else "FAILED"
            
            results.append({
                "id": doc.id,
                "filename": doc.filename,
                "description": doc.description,
                "owner_id": doc.owner_id,
                "created_at": doc.created_at,
                "hash": doc.hash,
                "doc_type": doc.doc_type,
                "doc_number": doc.doc_number,
                "verification_status": status
            })
            
        return results

    @staticmethod
    def upload_document(db: Session, file: UploadFile, doc_type: str, doc_number: str, trade_id: Optional[int], user_id: int) -> Document:
        # 1. Read file content as bytes for accurate hashing
        file_content = file.file.read()
        
        # 2. Compute SHA-256 hash (fingerprint) of the file content
        # usage: hashlib.sha256(file_bytes).hexdigest() via helper
        file_hash = compute_file_hash(file_content)
        
        file_key = f"bank_docs/{user_id}/{file.filename}"
        
        # Try to upload to S3/MinIO
        s3_upload_success = False
        try:
            s3 = boto3.client(
                's3',
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            
            # Ensure bucket exists
            try:
                s3.head_bucket(Bucket=settings.S3_BUCKET_NAME)
            except Exception:
                try:
                    s3.create_bucket(Bucket=settings.S3_BUCKET_NAME)
                except Exception:
                    pass
            
            # Helper to reset file pointer before upload if read() moved it
            # But here we used read(), effectively consuming it.
            # We must upload the bytes we read to ensure consistency or seek(0).
            # Creating a BytesIO object or resetting file pointer is needed.
            file.file.seek(0)
            s3.upload_fileobj(file.file, settings.S3_BUCKET_NAME, file_key)
            s3_upload_success = True
        except Exception as e:
            print(f"Warning: S3 upload failed - {str(e)}. Document will be saved to database with pending upload status.")
        
        # 3. Save document DB record with the calculated HASH
        try:
            new_doc = Document(
                filename=file.filename,
                description=f"{doc_type} - {doc_number}",
                file_url=file_key if s3_upload_success else f"pending:{file_key}",
                hash=file_hash, # Storing the SHA-256 hash
                owner_id=user_id,
                mime_type=file.content_type,
                size=len(file_content),
                doc_type=doc_type,
                doc_number=doc_number,
                issued_at=datetime.now()
            )
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            
            LedgerService.create_entry(
                db=db,
                document_id=new_doc.id,
                action=LedgerAction.DOCUMENT_UPLOADED,
                actor_id=user_id,
                entry_metadata={
                    "filename": new_doc.filename,
                    "size": new_doc.size,
                    "doc_type": doc_type,
                    "trade_id": trade_id,
                    "s3_upload_success": s3_upload_success,
                    "computed_hash": file_hash
                }
            )
            
            return new_doc
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

    @staticmethod
    def verify_document(db: Session, document_id: int, user_id: int) -> Dict[str, Any]:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        s3 = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        try:
            # 1. Retrieve the file content from storage
            response = s3.get_object(Bucket=settings.S3_BUCKET_NAME, Key=document.file_url)
            content = response['Body'].read()
            
            # 2. Re-compute the SHA-256 hash
            current_hash = compute_file_hash(content)
            
            # 3. Strictly compare against the stored DB hash
            # If they match, the file has not been tampered with.
            is_verified = (current_hash == document.hash)
            
            # 4. Log the verification action to the Ledger
            LedgerService.create_entry(
                db=db,
                document_id=document.id,
                action=LedgerAction.VERIFIED,
                actor_id=user_id,
                entry_metadata={
                    "result": "PASS" if is_verified else "FAIL",
                    "stored_hash": document.hash,
                    "computed_hash": current_hash,
                    "is_valid": is_verified
                }
            )

            if not is_verified:
                 RiskService.trigger_on_document_verification(db, document.id, False)

            # Return simple boolean result as requested
            return {
                "verified": is_verified
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Verification Failed: {str(e)}")

    @staticmethod
    def view_document(db: Session, document_id: int, user_id: int) -> str:
        """
        Retrieves the document for viewing.
        - Downloads file to a temporary location.
        - Logs the View action to the Ledger (CRITICAL).
        - Returns the path to the temporary file.
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # 1. CRITICAL: Audit Logging - Record every view action
        LedgerService.create_entry(
            db=db,
            document_id=document.id,
            action=LedgerAction.VIEWED, # Uses new VIEWED action
            actor_id=user_id,
            entry_metadata={
                "action": "DOCUMENT_VIEWED",
                "filename": document.filename,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # 2. Retrieve file for serving
        s3 = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        try:
            # Create a localized temp file
            # We use delete=False so it persists long enough to be served by FileResponse
            # The OS should clean up tmp files eventually, or we could add a background task to delete it.
            # For simplicity in this context, we leave it to OS/cleanup.
            fd, path = tempfile.mkstemp(suffix=f"_{document.filename}")
            with os.fdopen(fd, 'wb') as tmp:
                s3.download_fileobj(settings.S3_BUCKET_NAME, document.file_url, tmp)
            
            return path
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")

    @staticmethod
    def get_risk_monitor(db: Session) -> List[RiskScore]:
        return db.query(RiskScore).join(User).filter(User.role == UserRole.CORPORATE).all()
        
    @staticmethod
    def get_ledger(db: Session, skip: int = 0, limit: int = 100) -> List[LedgerEntry]:
        return db.query(LedgerEntry).order_by(LedgerEntry.created_at.desc()).offset(skip).limit(limit).all()
