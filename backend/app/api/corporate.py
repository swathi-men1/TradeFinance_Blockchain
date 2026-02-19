from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.document import DocumentType
from app.models.trade import TradeStatus, TradeTransaction
from app.schemas.trade import TradeResponse, TradeDetailResponse
from app.schemas.document import DocumentResponse
from app.schemas.risk import RiskScoreResponse

from app.services.trade_service import TradeService
from app.services.document_service import DocumentService
from app.services.risk_service import RiskService
from app.services.ledger_service import LedgerService

from app.schemas.trade import TradeStatusUpdate
from app.schemas.ledger import LedgerEntryResponse

router = APIRouter(prefix="/corporate", tags=["Corporate Role"])

# ==================================================================================
# MODULE 1: Transaction Participation & Tracking
# ==================================================================================

@router.get("/transactions", response_model=List[TradeResponse])
def list_transactions(
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    List trade transactions where the corporate user is a participant.
    Read-only access to transaction history.
    """
    return TradeService.list_trades(db, current_user)

@router.get("/transactions/{trade_id}", response_model=TradeDetailResponse)
def get_transaction(
    trade_id: int,
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    View detailed transaction info including timeline and documents.
    """
    # The get_trade_by_id service already enforces participant access control
    # But TradeDetailResponse requires enriched data, which the service might return 
    # if we ensure model compatibility. 
    # Let's rely on the service which returns the model.
    trade = TradeService.get_trade_by_id(db, current_user, trade_id)
    
    # Enrich response if needed (e.g. counts)
    # Pydantic's from_attributes handles the conversion
    return trade

@router.post("/trades/{trade_id}/dispute", response_model=TradeResponse)
def dispute_trade(
    trade_id: int,
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    Raise a dispute flag on a trade transaction.
    
    - Triggers ledger entry
    - Triggers risk recalculation
    - Cannot delete trade
    """
    return TradeService.update_trade_status(
        db, 
        current_user, 
        trade_id, 
        TradeStatusUpdate(status=TradeStatus.DISPUTED)
    )


# ==================================================================================
# MODULE 2: Document Submission Module
# ==================================================================================

@router.post("/documents/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: str = Form(...),
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    Submit trade-related documents.
    
    RESTRICTIONS:
    - Corporate users CANNOT upload LOC (Letter of Credit).
    - Allowed: INVOICE, BILL_OF_LADING, PO, COO, INSURANCE_CERT.
    """
    if doc_type == DocumentType.LOC:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Corporate users are not allowed to submit Letters of Credit (LOC). This is a Bank function."
        )
    
    # Proceed with upload
    return await DocumentService.upload_document(
        db, current_user, file, doc_type, doc_number, issued_at
    )

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """List documents submitted by the corporate user."""
    return DocumentService.list_documents(db, current_user)

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """View details of a specific document."""
    return DocumentService.get_document_by_id(db, current_user, document_id)


# ==================================================================================
# MODULE 4: Risk Insight Viewer
# ==================================================================================

@router.get("/risk/self", response_model=RiskScoreResponse)
def get_own_risk_score(
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """View own risk score and rationale."""
    score = RiskService.get_user_risk_score(db, current_user.id)
    if not score:
        # If no score exists, calculate one or return a default/404
        # For now, let's return 404 or trigger calculation. 
        # Requirement says "View", implying it should exist.
        raise HTTPException(status_code=404, detail="Risk score not available yet")
    return score

@router.get("/risk/{counterparty_id}", response_model=RiskScoreResponse)
def get_counterparty_risk(
    counterparty_id: int,
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    View counterparty risk score. 
    Can only view risk of users involved in their trades? 
    Instructions say "View counterparty risk score". Let's allow lookup.
    """
    # Optional: Verify counterparty is actually in a trade with this user?
    # For now, open access to view risk of potential partners is a common requirement.
    score = RiskService.get_user_risk_score(db, counterparty_id)
    if not score:
        raise HTTPException(status_code=404, detail="Risk score not found for this counterparty")
    return score


# ==================================================================================
# MODULE 5: Ledger Explorer (Read Only)
# ==================================================================================

@router.get("/ledger", response_model=List[LedgerEntryResponse])
def get_my_ledger_activity(
    limit: int = 50,
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    View ledger actions affecting the user (read-only).
    
    Includes:
    - Actions performed by the user
    - Actions performed on user's documents
    """
    return LedgerService.get_recent_activity(db, current_user, limit)


# ==================================================================================
# MODULE 5: Transaction History & Analytics
# ==================================================================================

@router.get("/analytics", response_model=Dict[str, Any])
def get_corporate_analytics(
    current_user: User = Depends(require_roles([UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    """
    Get Corporate-specific analytics:
    - Participation summary (Buyer vs Seller count)
    - Trade completion stats
    - Document submission count
    """
    
    trades = TradeService.list_trades(db, current_user)
    documents = DocumentService.list_documents(db, current_user)
    
    # 1. Participation Stats
    buyer_count = sum(1 for t in trades if t.buyer_id == current_user.id)
    seller_count = sum(1 for t in trades if t.seller_id == current_user.id)
    
    # 2. Completion Stats
    completed = sum(1 for t in trades if t.status == TradeStatus.COMPLETED)
    active = sum(1 for t in trades if t.status in [TradeStatus.PENDING, TradeStatus.IN_PROGRESS])
    
    # 3. Volume
    total_volume = sum(t.amount for t in trades)
    
    return {
        "participation": {
            "total_trades": len(trades),
            "as_buyer": buyer_count,
            "as_seller": seller_count
        },
        "status_summary": {
            "completed": completed,
            "active": active,
            "disputed": sum(1 for t in trades if t.status == TradeStatus.DISPUTED)
        },
        "documents": {
            "total_submitted": len(documents)
        },
        "total_volume_value": float(total_volume)
    }
