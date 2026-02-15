from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, delete
from typing import List
from app.models.trade import TradeTransaction, TradeStatus, trade_documents
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.ledger import LedgerEntry, LedgerAction
from app.models.audit import AuditLog
from app.schemas.trade import TradeCreate, TradeStatusUpdate
from app.services.ledger_service import LedgerService
from app.services.risk_service import RiskService


class TradeService:
    # Valid status transitions
    VALID_TRANSITIONS = {
        TradeStatus.PENDING: [TradeStatus.IN_PROGRESS, TradeStatus.DISPUTED],
        TradeStatus.IN_PROGRESS: [TradeStatus.COMPLETED, TradeStatus.DISPUTED],
        TradeStatus.COMPLETED: [TradeStatus.PAID, TradeStatus.DISPUTED],
        TradeStatus.PAID: [TradeStatus.DISPUTED],  # Can dispute even after payment
        TradeStatus.DISPUTED: [],  # Terminal state - requires admin intervention
    }
    
    @staticmethod
    def create_trade(db: Session, current_user: User, trade_data: TradeCreate) -> TradeTransaction:
        """Create a new trade transaction"""
        
        # Validate buyer exists
        buyer = db.query(User).filter(User.id == trade_data.buyer_id).first()
        if not buyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Buyer with ID {trade_data.buyer_id} not found"
            )
        if not buyer.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Buyer {buyer.name} is inactive and cannot participate in trades"
            )
        
        # Validate seller exists
        seller = db.query(User).filter(User.id == trade_data.seller_id).first()
        if not seller:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Seller with ID {trade_data.seller_id} not found"
            )
        if not seller.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Seller {seller.name} is inactive and cannot participate in trades"
            )
        
        # Buyer and seller must be different
        if trade_data.buyer_id == trade_data.seller_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Buyer and seller cannot be the same user"
            )
        
        # Permission check: user must be either buyer or seller (unless admin)
        if current_user.role not in [UserRole.ADMIN]:
            if current_user.id != trade_data.buyer_id and current_user.id != trade_data.seller_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only create trades where you are the buyer or seller"
                )
        
        # Validate roles: buyer and seller must be CORPORATE or BANK
        for user, role_name in [(buyer, "Buyer"), (seller, "Seller")]:
            if user.role not in [UserRole.CORPORATE, UserRole.BANK]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{role_name} must be either Corporate or Bank user"
                )
        
        # Create trade
        new_trade = TradeTransaction(
            buyer_id=trade_data.buyer_id,
            seller_id=trade_data.seller_id,
            amount=trade_data.amount,
            currency=trade_data.currency.upper(),
            status=TradeStatus.PENDING.value  # Use .value to get 'pending'
        )
        
        db.add(new_trade)
        db.commit()
        db.refresh(new_trade)
        
        # Create ledger entry
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.TRADE_CREATED,
            actor_id=current_user.id,
            entry_metadata={
                "trade_id": new_trade.id,
                "buyer_id": new_trade.buyer_id,
                "seller_id": new_trade.seller_id,
                "amount": str(new_trade.amount),
                "currency": new_trade.currency,
                "initial_status": new_trade.status.value
            }
        )
        
        # Audit log for ALL trade creations (not just Admin actions)
        audit_log = AuditLog(
            admin_id=current_user.id if current_user.role == UserRole.ADMIN else None,
            action="CREATE_TRADE",
            target_type="TradeTransaction",
            target_id=new_trade.id
        )
        db.add(audit_log)
        db.commit()
        
        return new_trade
    
    @staticmethod
    def list_trades(db: Session, current_user: User) -> List[TradeTransaction]:
        """List trades based on user role"""
        query = db.query(TradeTransaction)
        
        # Role-based filtering
        if current_user.role in [UserRole.CORPORATE, UserRole.BANK]:
            # Can only see trades where they are buyer or seller
            query = query.filter(
                or_(
                    TradeTransaction.buyer_id == current_user.id,
                    TradeTransaction.seller_id == current_user.id
                )
            )
        elif current_user.role == UserRole.AUDITOR:
            # Can see all trades (read-only enforced at API level)
            pass
        elif current_user.role == UserRole.ADMIN:
            # Can see all trades
            pass
        
        return query.order_by(TradeTransaction.created_at.desc()).all()
    
    @staticmethod
    def get_trade_by_id(db: Session, current_user: User, trade_id: int) -> TradeTransaction:
        """Get trade by ID with permission check"""
        trade = db.query(TradeTransaction).filter(TradeTransaction.id == trade_id).first()
        
        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trade not found"
            )
        
        # Permission check
        if current_user.role in [UserRole.CORPORATE, UserRole.BANK]:
            if trade.buyer_id != current_user.id and trade.seller_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: you are not a participant in this trade"
                )
        
        return trade
    
    @staticmethod
    def update_trade_status(
        db: Session, 
        current_user: User, 
        trade_id: int, 
        status_update: TradeStatusUpdate
    ) -> TradeTransaction:
        """Update trade status with transition validation"""
        
        trade = TradeService.get_trade_by_id(db, current_user, trade_id)
        old_status = trade.status
        new_status = status_update.status
        
        # Check if status is actually changing
        if old_status == new_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trade is already in {new_status.value} status"
            )
        
        # Admins can override any status (dispute resolution)
        if current_user.role == UserRole.ADMIN:
            is_valid_transition = True
        else:
            # Validate status transition
            valid_next_states = TradeService.VALID_TRANSITIONS.get(old_status, [])
            is_valid_transition = new_status in valid_next_states
        
        if not is_valid_transition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {old_status.value} to {new_status.value}"
            )
        
        # --- FIXED HERE: Use .value to save string to DB ---
        trade.status = new_status.value
        db.commit()
        db.refresh(trade)
        
        # Determine ledger action
        if new_status == TradeStatus.DISPUTED:
            ledger_action = LedgerAction.TRADE_DISPUTED
        else:
            ledger_action = LedgerAction.TRADE_STATUS_UPDATED
        
        # Create ledger entry
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=ledger_action,
            actor_id=current_user.id,
            entry_metadata={
                "trade_id": trade.id,
                "old_status": old_status.value,
                "new_status": new_status.value,
                "admin_override": current_user.role == UserRole.ADMIN
            }
        )
        
        # Audit log for ALL trade status updates (not just Admin actions)
        audit_log = AuditLog(
            admin_id=current_user.id if current_user.role == UserRole.ADMIN else None,
            action="UPDATE_TRADE_STATUS",
            target_type="TradeTransaction",
            target_id=trade.id
        )
        db.add(audit_log)
        db.commit()
        
        # Trigger risk recalculation for buyer and seller
        RiskService.trigger_on_trade_status_change(db, trade.id, new_status.value)
        
        return trade
    
    @staticmethod
    def link_document_to_trade(
        db: Session,
        current_user: User,
        trade_id: int,
        document_id: int
    ) -> TradeTransaction:
        """Link a document to a trade"""
        
        # Get and validate trade access
        trade = TradeService.get_trade_by_id(db, current_user, trade_id)
        
        # Get and validate document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Permission check: user must have access to the document
        if current_user.role in [UserRole.CORPORATE, UserRole.BANK]:
            if document.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only link documents you own"
                )
        
        # Check if document is already linked
        if document in trade.documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document is already linked to this trade"
            )
        
        # Link document
        trade.documents.append(document)
        db.commit()
        db.refresh(trade)
        
        # Create ledger entry
        LedgerService.create_entry(
            db=db,
            document_id=document.id,
            action=LedgerAction.DOCUMENT_LINKED_TO_TRADE,
            actor_id=current_user.id,
            entry_metadata={
                "trade_id": trade.id,
                "document_type": document.doc_type.value,
                "document_number": document.doc_number
            }
        )
        
        # Audit log for ALL document linking actions (not just Admin actions)
        audit_log = AuditLog(
            admin_id=current_user.id if current_user.role == UserRole.ADMIN else None,
            action="LINK_DOCUMENT_TO_TRADE",
            target_type="TradeTransaction",
            target_id=trade.id
        )
        db.add(audit_log)
        db.commit()
        
        return trade
    
    @staticmethod
    def update_trade_details(
        db: Session,
        current_user: User,
        trade_id: int,
        trade_updates: TradeCreate
    ) -> TradeTransaction:
        """Update trade details (Admin only)"""
        
        # Only admin can update trade details
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin users can update trade details"
            )
        
        trade = TradeService.get_trade_by_id(db, current_user, trade_id)
        
        # Store old values for audit
        old_values = {
            "buyer_id": trade.buyer_id,
            "seller_id": trade.seller_id,
            "amount": str(trade.amount),
            "currency": trade.currency
        }
        
        # Validate new buyer exists
        if trade_updates.buyer_id != trade.buyer_id:
            buyer = db.query(User).filter(User.id == trade_updates.buyer_id).first()
            if not buyer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Buyer with ID {trade_updates.buyer_id} not found"
                )
            
            # Validate buyer role
            if buyer.role not in [UserRole.CORPORATE, UserRole.BANK]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Buyer must be either Corporate or Bank user"
                )
        
        # Validate new seller exists
        if trade_updates.seller_id != trade.seller_id:
            seller = db.query(User).filter(User.id == trade_updates.seller_id).first()
            if not seller:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Seller with ID {trade_updates.seller_id} not found"
                )
            
            # Validate seller role
            if seller.role not in [UserRole.CORPORATE, UserRole.BANK]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Seller must be either Corporate or Bank user"
                )
        
        # Buyer and seller must be different
        if trade_updates.buyer_id == trade_updates.seller_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Buyer and seller cannot be the same user"
            )
        
        # Update trade details
        trade.buyer_id = trade_updates.buyer_id
        trade.seller_id = trade_updates.seller_id
        trade.amount = trade_updates.amount
        trade.currency = trade_updates.currency.upper()
        
        db.commit()
        db.refresh(trade)
        
        # Create ledger entry
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.TRADE_UPDATED,
            actor_id=current_user.id,
            entry_metadata={
                "trade_id": trade.id,
                "old_values": old_values,
                "new_values": {
                    "buyer_id": trade.buyer_id,
                    "seller_id": trade.seller_id,
                    "amount": str(trade.amount),
                    "currency": trade.currency
                },
                "admin_name": current_user.name
            }
        )
        
        # Audit log
        audit_log = AuditLog(
            admin_id=current_user.id,
            action="UPDATE_TRADE_DETAILS",
            target_type="TradeTransaction",
            target_id=trade.id
        )
        db.add(audit_log)
        db.commit()
        
        return trade
    
    @staticmethod
    def delete_trade(
        db: Session,
        current_user: User,
        trade_id: int
    ) -> None:
        """Delete a trade (Admin only)"""
        
        # Only admin can delete trades
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin users can delete trades"
            )
        
        trade = TradeService.get_trade_by_id(db, current_user, trade_id)
        
        # Store trade details for audit
        trade_details = {
            "id": trade.id,
            "buyer_id": trade.buyer_id,
            "seller_id": trade.seller_id,
            "amount": str(trade.amount),
            "currency": trade.currency,
            "status": trade.status.value,
            "created_at": trade.created_at.isoformat()
        }
        
        # Create ledger entry before deletion
        LedgerService.create_entry(
            db=db,
            document_id=None,
            action=LedgerAction.TRADE_DELETED,
            actor_id=current_user.id,
            entry_metadata={
                "trade_details": trade_details,
                "admin_name": current_user.name
            }
        )
        
        # Audit log
        audit_log = AuditLog(
            admin_id=current_user.id,
            action="DELETE_TRADE",
            target_type="TradeTransaction",
            target_id=trade.id
        )
        db.add(audit_log)
        
        # Delete the trade (cascade will handle document links)
        db.delete(trade)
        db.commit()

    @staticmethod
    def unlink_document_from_trade(
        db: Session,
        current_user: User,
        trade_id: int,
        document_id: int
    ) -> None:
        """Unlink a document from a trade"""
        
        # Get the trade
        trade = TradeService.get_trade_by_id(db, current_user, trade_id)
        
        # Get the document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        # Check if document is linked to trade
        trade_document_link = db.query(trade_documents).filter(
            trade_documents.c.trade_id == trade_id,
            trade_documents.c.document_id == document_id
        ).first()
        
        if not trade_document_link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document is not linked to this trade"
            )
        
        # Remove the link
        db.execute(
            trade_documents.delete()
            .where(trade_documents.c.trade_id == trade_id)
            .where(trade_documents.c.document_id == document_id)
        )
        db.commit()
        
        # Create ledger entry
        LedgerService.create_entry(
            db=db,
            document_id=document_id,
            action=LedgerAction.DOCUMENT_UNLINKED_FROM_TRADE,
            actor_id=current_user.id,
            entry_metadata={
                "trade_id": trade_id,
                "document_type": document.doc_type.value,  # Added .value here for safety too
                "document_number": document.doc_number,
                "admin_name": current_user.name
            }
        )
        
        # Audit log
        audit_log = AuditLog(
            admin_id=current_user.id if current_user.role == UserRole.ADMIN else None,
            action="UNLINK_DOCUMENT_FROM_TRADE",
            target_type="TradeTransaction",
            target_id=trade_id
        )
        db.add(audit_log)
        db.commit()