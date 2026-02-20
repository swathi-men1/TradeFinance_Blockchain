from datetime import datetime

# ✅ In-memory trade storage
trades_db = []


class Trade:
    def __init__(self, trade_id, buyer, seller, document_id, amount):
        self.trade_id = trade_id
        self.buyer = buyer
        self.seller = seller
        self.document_id = document_id
        self.amount = amount
        self.status = "CREATED"
        self.created_at = datetime.utcnow()

    # ✅ Convert object → dictionary (for API response)
    def to_dict(self):
        return {
            "trade_id": self.trade_id,
            "buyer": self.buyer,
            "seller": self.seller,
            "document_id": self.document_id,
            "amount": self.amount,
            "status": self.status,
            "created_at": self.created_at.isoformat()  # 🔥 important fix
        }
