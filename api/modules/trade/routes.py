from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import TradeFlows, RoleEnum, Documents, TradeLedger, ActionEnum, TradeStatusEnum, UserProfiles
from api.modules.auth.routes import get_current_user
from schemas import TradeFlowResponse, TradeFlowCreate, TradeLedgerResponse
from core.permissions import RoleChecker, get_trade_context, get_doc_context
from utils.audit_logger import log_audit_event

router = APIRouter()

@router.post("/verify")
def verify_document(
    doc_id: int = Form(...),
    notes: str = Form(None),
    db: Session = Depends(get_db),
    current_user: UserProfiles = Depends(get_current_user)
):
    # RBAC: Only Bank can verify
    if current_user.role != RoleEnum.bank:
        raise HTTPException(status_code=403, detail="Only Bank users can verify documents.")

    # Context Check: Does the bank have a reason to see this?
    # Requirement: "Banks associated with these users (derived via org_name or explicit relationship)."
    # Simplified: If there is a trade involving this doc, the bank can verify it for the platform.
    doc = get_doc_context(doc_id, db, current_user)
    
    # State Transition Rule (Trust Chain): 
    # Must be SHIPPED or RECEIVED (or ISSUED if we allow early verification)
    # Requirement: Movement: Goods move -> Ledger Action: SHIPPED -> RECEIVED -> Verification: Bank validates -> VERIFIED.
    # This implies RECEIVED must happen before VERIFIED.
    
    history = db.query(TradeLedger).filter(TradeLedger.document_id == doc_id).all()
    actions = [h.action for h in history]
    
    # Check if RECEIVED exists
    if ActionEnum.RECEIVED not in actions:
        raise HTTPException(status_code=400, detail="Trust Chain Violation: Document must be RECEIVED by buyer before Bank verification.")
    
    if ActionEnum.VERIFIED in actions:
        raise HTTPException(status_code=400, detail="Document already VERIFIED on the ledger.")

    # TAMPER LOCK
    if ActionEnum.SUSPECTED_TAMPERING in actions:
        raise HTTPException(status_code=400, detail="Security Alert: Document is locked due to suspected tampering.")

    # Determine Trade ID (Must be linked)
    linked_trades = db.query(TradeFlows).filter(TradeFlows.document_id == doc_id).all()
    if not linked_trades:
         raise HTTPException(status_code=400, detail="Trust Chain Violation: Document not linked to any active trade context.")
    
    target_trade = linked_trades[0] # Assume primary trade

    # Create Ledger Entry
    from services.ledger import LedgerService
    ledger_entry = LedgerService.create_ledger_entry(
        db,
        target_trade.id,
        ActionEnum.VERIFIED,
        current_user.id,
        document_id=doc_id,
        metadata={"notes": notes, "verified_by": current_user.org_name}
    )
    
    # Status Syncing
    for trade in linked_trades:
         if trade.status == TradeStatusEnum.pending:
             trade.status = TradeStatusEnum.in_progress
    
    # Notification & Audit
    from db.models import Notifications
    db.add(Notifications(
        user_id=doc.owner_id,
        message=f"Your document {doc.doc_number} has been VERIFIED by {current_user.org_name}."
    ))
    
    log_audit_event(
        user_id=current_user.id,
        action="DOCUMENT_VERIFIED_ON_LEDGER",
        target_type="DOCUMENT",
        target_id=doc_id,
        details={"notes": notes}
    )
    
    db.commit()
    return ledger_entry

@router.post("/settle", response_model=TradeLedgerResponse)
async def settle_trade(
    trade_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: UserProfiles = Depends(get_current_user)
):
    # RBAC: Bank Only
    if current_user.role != RoleEnum.bank:
        raise HTTPException(status_code=403, detail="Only Bank users can settle trades.")

    trade = get_trade_context(trade_id, db, current_user)
    
    if trade.status == TradeStatusEnum.completed:
         raise HTTPException(status_code=400, detail="Trade already settled.")

    # VALIDATION GATE: Document must be VERIFIED in Ledger before settlement
    if trade.document_id:
        verified_entry = db.query(TradeLedger).filter(
            TradeLedger.document_id == trade.document_id,
            TradeLedger.action == ActionEnum.VERIFIED
        ).first()
        
        if not verified_entry:
            raise HTTPException(
                status_code=400, 
                detail="Trust Chain Violation: Associated document must be VERIFIED by the bank first."
            )
            
    # Update Status
    trade.status = TradeStatusEnum.completed
    
    # Ledger Entry: PAID
    from services.ledger import LedgerService
    ledger_entry = LedgerService.create_ledger_entry(
        db,
        trade.id,
        ActionEnum.PAID,
        current_user.id,
        document_id=trade.document_id,
        metadata={"amount": float(trade.amount), "currency": trade.currency}
    )
    
    # Audit & Notification
    log_audit_event(
        user_id=current_user.id,
        action="TRADE_SETTLED_PAID",
        target_type="TRADE",
        target_id=trade.id,
        details={"amount": float(trade.amount)}
    )

    # Integrated Risk Update (Event-Driven)
    try:
        from api.modules.risk.tasks import recalculate_risk
        # Target both buyer and seller for risk updates
        for uid in [trade.buyer_id, trade.seller_id]:
            try:
                recalculate_risk.delay(uid)
            except Exception:
                recalculate_risk(uid)
    except Exception as e:
        print(f"Risk Trigger Logic Failed: {e}")

    db.commit()
    return ledger_entry

@router.post("/ship")
def ship_trade(
    trade_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: UserProfiles = Depends(get_current_user)
):
    # RBAC: Seller (Corporate)
    trade = get_trade_context(trade_id, db, current_user)
    if current_user.id != trade.seller_id:
        raise HTTPException(status_code=403, detail="Only the Seller can mark a trade as SHIPPED.")
    
    # Trust Chain: Must be ISSUED (Implicit if trade exists with doc)
    # Check history
    history = db.query(TradeLedger).filter(TradeLedger.document_id == trade.document_id).all()
    actions = [h.action for h in history]
    
    if ActionEnum.SHIPPED in actions:
        raise HTTPException(status_code=400, detail="Trade already marked as SHIPPED.")

    from services.ledger import LedgerService
    ledger_entry = LedgerService.create_ledger_entry(
        db,
        trade.id,
        ActionEnum.SHIPPED,
        current_user.id,
        document_id=trade.document_id,
        metadata={"action_by": "seller"}
    )
    
    log_audit_event(user_id=current_user.id, action="TRADE_SHIPPED", target_type="TRADE", target_id=trade.id)
    db.commit()
    return ledger_entry

@router.post("/receive")
def receive_trade(
    trade_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: UserProfiles = Depends(get_current_user)
):
    # RBAC: Buyer (Corporate)
    trade = get_trade_context(trade_id, db, current_user)
    if current_user.id != trade.buyer_id:
        raise HTTPException(status_code=403, detail="Only the Buyer can mark a trade as RECEIVED.")
    
    # Trust Chain: Must be SHIPPED first
    history = db.query(TradeLedger).filter(TradeLedger.document_id == trade.document_id).all()
    actions = [h.action for h in history]
    
    if ActionEnum.SHIPPED not in actions:
        raise HTTPException(status_code=400, detail="Trust Chain Violation: Trade must be SHIPPED before it can be RECEIVED.")
    
    if ActionEnum.RECEIVED in actions:
        raise HTTPException(status_code=400, detail="Trade already marked as RECEIVED.")

    from services.ledger import LedgerService
    ledger_entry = LedgerService.create_ledger_entry(
        db,
        trade.id,
        ActionEnum.RECEIVED,
        current_user.id,
        document_id=trade.document_id,
        metadata={"action_by": "buyer"}
    )
    
    log_audit_event(user_id=current_user.id, action="TRADE_RECEIVED", target_type="TRADE", target_id=trade.id)
    db.commit()
    return ledger_entry


@router.post(
    "/trades", 
    response_model=TradeFlowResponse,
    summary="Initiate New Trade Deal",
    description="Creates a new trade transaction linked to a document."
)
def create_trade(trade: TradeFlowCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # RBAC: Corporates initiate trade (e.g., Buyer creates PO).
    if current_user.role != RoleEnum.corporate:
        raise HTTPException(status_code=403, detail="Only Corporate users can initiate trade transactions.")

    # Context Check (Phantom Blocking): Ensure the user owns the linked document
    if trade.document_id:
        doc = db.query(Documents).filter(Documents.id == trade.document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        if doc.owner_id != current_user.id:
             raise HTTPException(status_code=403, detail="Phantom Blocking: You do not own this document.")

        # Prevent Double Financing
        existing_trade = db.query(TradeFlows).filter(TradeFlows.document_id == trade.document_id).first()
        if existing_trade:
             raise HTTPException(status_code=400, detail="Double Financing Blocked: This document is already tied to a trade deal.")

    new_trade = TradeFlows(**trade.model_dump())
    db.add(new_trade)
    db.flush()
    
    # Ledger Entry: ISSUED (Self-Audit of the deal start)
    if new_trade.document_id:
        from services.ledger import LedgerService
        LedgerService.create_ledger_entry(
            db,
            new_trade.id,
            ActionEnum.ISSUED,
            current_user.id,
            document_id=new_trade.document_id,
            metadata={"amount": float(new_trade.amount), "currency": new_trade.currency}
        )
    
    log_audit_event(
        user_id=current_user.id,
        action="TRADE_INITIATED",
        target_type="TRADE",
        target_id=new_trade.id,
        details={"amount": float(new_trade.amount), "currency": new_trade.currency}
    )
    
    db.commit()
    db.refresh(new_trade)
    return new_trade

@router.get("/trades", response_model=List[TradeFlowResponse])
def get_trades(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    user_role = current_user.role
    
    # Admin, Auditor, Bank: See All
    if user_role in [RoleEnum.admin, RoleEnum.auditor, RoleEnum.bank]:
        return db.query(TradeFlows).all()
    
    # Corporate: Only where they are buyer or seller (Counterparty Rule)
    return db.query(TradeFlows).filter(
        (TradeFlows.buyer_id == current_user.id) | (TradeFlows.seller_id == current_user.id)
    ).all()
