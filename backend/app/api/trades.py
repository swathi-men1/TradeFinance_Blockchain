from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.trade import (
    TradeCreate, 
    TradeResponse, 
    TradeDetailResponse,
    TradeStatusUpdate,
    TradeLinkDocument
)
from app.schemas.document import DocumentResponse
from app.services.trade_service import TradeService
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/trades", tags=["Trade Transactions"])


@router.post("", response_model=TradeResponse, status_code=201)
def create_trade(
    trade_data: TradeCreate,
    current_user: User = Depends(require_roles([UserRole.CORPORATE, UserRole.BANK, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Create a new trade transaction.
    
    - **CORPORATE** and **BANK** users can create trades where they are buyer or seller
    - **ADMIN** can create any trade
    - **AUDITOR** cannot create trades (read-only)
    """
    return TradeService.create_trade(db, current_user, trade_data)


@router.get("", response_model=List[TradeResponse])
def list_trades(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List trade transactions based on role:
    
    - **CORPORATE/BANK**: Only trades where they are buyer or seller
    - **AUDITOR**: All trades (read-only)
    - **ADMIN**: All trades
    """
    return TradeService.list_trades(db, current_user)


@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get trade details by ID.
    
    Access control:
    - **CORPORATE/BANK**: Only if they are buyer or seller
    - **AUDITOR/ADMIN**: Any trade
    """
    return TradeService.get_trade_by_id(db, current_user, trade_id)


@router.put("/{trade_id}/status", response_model=TradeResponse)
def update_trade_status(
    trade_id: int,
    status_update: TradeStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.CORPORATE, UserRole.BANK, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Update trade status.
    
    Valid transitions:
    - PENDING → IN_PROGRESS, DISPUTED
    - IN_PROGRESS → COMPLETED, DISPUTED  
    - COMPLETED → PAID, DISPUTED
    - PAID → DISPUTED
    - DISPUTED → (terminal, requires admin override)
    
    **ADMIN** can override any status (for dispute resolution)
    **AUDITOR** cannot update status (read-only)
    """
    return TradeService.update_trade_status(db, current_user, trade_id, status_update)


@router.post("/{trade_id}/documents", response_model=TradeResponse)
def link_document_to_trade(
    trade_id: int,
    link_data: TradeLinkDocument,
    current_user: User = Depends(require_roles([UserRole.CORPORATE, UserRole.BANK, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Link a document to a trade.
    
    Requirements:
    - User must have access to both the trade and the document
    - Document can only be linked once to a trade
    - **AUDITOR** cannot link documents (read-only)
    """
    return TradeService.link_document_to_trade(
        db, current_user, trade_id, link_data.document_id
    )


@router.get("/{trade_id}/documents", response_model=List[DocumentResponse])
def get_trade_documents(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all documents linked to a trade.
    
    Access follows same rules as get_trade endpoint.
    """
    trade = TradeService.get_trade_by_id(db, current_user, trade_id)
    return trade.documents
