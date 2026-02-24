from services.risk_service import RiskService
from database.init_db import SessionLocal
from models.document import Document

def test_risk_logic():
    db = SessionLocal()
    try:
        print("Testing Document Risk Calculation...")
        # Mock calculation
        invoice_risk = RiskService.calculate_document_risk("Invoice", 1, db)
        print(f"Invoice Risk: {invoice_risk}")
        
        contract_risk = RiskService.calculate_document_risk("Contract", 1, db)
        print(f"Contract Risk: {contract_risk}")
        
        # Test Entity Risk Update
        print("\nTesting Entity Risk Update...")
        risk = RiskService.update_entity_risk(1, db, 10.0, "Testing penalty")
        print(f"User 1 New Risk Score: {risk.score}")
        
        # Recalculate document risk with higher user risk
        new_invoice_risk = RiskService.calculate_document_risk("Invoice", 1, db)
        print(f"Invoice Risk (after user penalty): {new_invoice_risk}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_risk_logic()
