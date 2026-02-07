from datetime import datetime

class Trade:
    def __init__(self, trade_id, buyer, seller, document_id, amount):
        self.trade_id = trade_id
        self.buyer = buyer
        self.seller = seller
        self.document_id = document_id
        self.amount = amount
        self.status = "INITIATED"
        self.created_at = datetime.utcnow()
