from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.trade import TradeTransaction, TradeStatus
from app.models.document import DocumentType
from app.models.ledger import LedgerAction
from app.schemas.trade import TradeCreate, TradeResponse, TradeStatusUpdate
from app.schemas.document import DocumentResponse
from app.schemas.ledger import LedgerEntryCreate, LedgerEntryResponse
from app.schemas.risk import RiskScoreResponse

from app.services.trade_service import TradeService
from app.services.document_service import DocumentService
from app.services.ledger_service import LedgerService
from app.services.risk_service import RiskService

router = APIRouter(prefix="/bank", tags=["Bank Role"])

# ==================================================================================
# MODULE 1: Trade Transaction Management
# ==================================================================================

@router.post("/transactions/create", response_model=TradeResponse, status_code=201)
def create_transaction(
    trade_data: TradeCreate,
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Create a new trade transaction (Bank only).
    
    Validated fields:
    - buyer_id (must exist)
    - seller_id (must exist)
    - amount (> 0)
    - currency (3 chars)
    
    Initial status: PENDING
    Creates ledger entry: TRADE_CREATED
    """
    return TradeService.create_trade(db, current_user, trade_data)

@router.get("/transactions", response_model=List[TradeResponse])
def list_transactions(
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """List all trade transactions for the logged-in bank"""
    return TradeService.list_trades(db, current_user)

@router.put("/transactions/update-status", response_model=TradeResponse)
def update_transaction_status(
    trade_id: int,
    status_update: TradeStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Update trade transaction status.
    
    Allowed transitions:
    - pending -> in_progress
    - in_progress -> completed
    - completed -> disputed (or paid implied)
    
    Creates ledger entry explicitly.
    """
    return TradeService.update_trade_status(db, current_user, trade_id, status_update)

# ==================================================================================
# MODULE 2: Document Upload & Storage
# ==================================================================================

@router.post("/documents/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: str = Form(...),
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Upload a trade document.
    
    - Supported doc_types: LOC, INVOICE, BILL_OF_LADING, PO, COO, INSURANCE_CERT
    - Auto-generates SHA-256 hash
    - Stores metadata
    - Creates ledger entry: DOCUMENT_UPLOADED
    """
    return await DocumentService.upload_document(
        db, current_user, file, doc_type, doc_number, issued_at
    )

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """List all documents owned by the bank"""
    return DocumentService.list_documents(db, current_user)

# ==================================================================================
# MODULE 3: Ledger Lifecycle Entry Creation
# ==================================================================================

@router.post("/ledger/create-entry", response_model=LedgerEntryResponse)
def create_ledger_entry(
    entry_data: LedgerEntryCreate,
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Create a lifecycle ledger entry.
    
    Allowed Actions: ISSUED, AMENDED, SHIPPED, RECEIVED, PAID, CANCELLED
    """
    allowed_actions = [
        LedgerAction.ISSUED,
        LedgerAction.AMENDED,
        LedgerAction.SHIPPED,
        LedgerAction.RECEIVED,
        LedgerAction.PAID,
        LedgerAction.CANCELLED,
        LedgerAction.TRADE_CREATED, # Implicitly allowed via trade create
        LedgerAction.TRADE_STATUS_UPDATED # Implicitly allowed via trade update
    ]
    
    # We strictly enforce the "Allowed Ledger Action ENUM" from requirements for manual creation
    # The requirement list: ISSUED, AMENDED, SHIPPED, RECEIVED, PAID, CANCELLED
    strict_lifecycle_actions = [
        LedgerAction.ISSUED,
        LedgerAction.AMENDED,
        LedgerAction.SHIPPED,
        LedgerAction.RECEIVED,
        LedgerAction.PAID,
        LedgerAction.CANCELLED
    ]
    
    if entry_data.action not in strict_lifecycle_actions:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action for manual ledger entry. Allowed: {[a.value for a in strict_lifecycle_actions]}"
        )

    # Validate sequence rules
    # ISSUED must be first for a document (handled by genesis check or business logic)
    # This logic is complex to enforce without checking history. 
    # For now, we delegate to LedgerService but we could add checks here.
    
    return LedgerService.create_entry(
        db=db,
        document_id=entry_data.document_id,
        action=entry_data.action,
        actor_id=current_user.id,
        entry_metadata=entry_data.entry_metadata
    )

# ==================================================================================
# MODULE 4: Counterparty Risk Monitoring
# ==================================================================================

@router.get("/risk/{counterparty_id}", response_model=RiskScoreResponse)
def get_counterparty_risk(
    counterparty_id: int,
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    View counterparty risk score, rationale, and trend.
    Read-only access.
    """
    score = RiskService.get_user_risk_score(db, counterparty_id)
    if not score:
        raise HTTPException(status_code=404, detail="Risk score not found for this user")
    return score

# ==================================================================================
# MODULE 5: Transaction Analytics Dashboard
# ==================================================================================

@router.get("/analytics", response_model=Dict[str, Any])
def get_bank_analytics(
    current_user: User = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Get Bank-specific analytics:
    - Trade volume summary
    - Transaction completion metrics
    - Trade delay metrics (simulated via status durations if not tracking explicitly)
    - Counterparty performance
    """
    
    # 1. Trade Volume Summary
    trades = TradeService.list_trades(db, current_user)
    total_volume = sum(t.amount for t in trades)
    avg_volume = total_volume / len(trades) if trades else 0
    
    # 2. Transaction Completion Metrics
    status_counts = {}
    for t in trades:
        status_counts[t.status.value] = status_counts.get(t.status.value, 0) + 1
        
    # 3. Counterparty Performance (Basic)
    # Aggregate trades by counterparty
    counterparty_stats = {}
    for t in trades:
        other_id = t.buyer_id if t.seller_id == current_user.id else t.seller_id
        if other_id not in counterparty_stats:
            counterparty_stats[other_id] = {"total": 0, "completed": 0, "disputed": 0}
        
        stats = counterparty_stats[other_id]
        stats["total"] += 1
        if t.status == TradeStatus.COMPLETED:
            stats["completed"] += 1
        elif t.status == TradeStatus.DISPUTED:
            stats["disputed"] += 1
            
    return {
        "summary": {
            "total_trades": len(trades),
            "total_volume": float(total_volume),
            "average_transaction_value": float(avg_volume)
        },
        "status_breakdown": status_counts,
        "counterparty_performance": counterparty_stats
    }
