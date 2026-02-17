#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.user import User
from app.models.organization import Organization
from app.models.trade_transaction import TradeTransaction
from app.models.document import Document

db = SessionLocal()

print('\n=== TRADES IN DATABASE ===')
trades = db.query(TradeTransaction).all()
print(f'Total trades: {len(trades)}')
for idx, t in enumerate(trades[:10], 1):
    initiator = db.query(User).filter(User.id == t.initiator_id).first()
    counterparty = db.query(User).filter(User.id == t.counterparty_id).first()
    init_email = initiator.email if initiator else 'Unknown'
    counter_email = counterparty.email if counterparty else 'Unknown'
    print(f'{idx}. Initiator: {init_email} | Counterparty: {counter_email} | Amount: {t.amount} {t.currency} | Status: {t.status}')

print('\n=== DOCUMENTS IN DATABASE ===')
docs = db.query(Document).all()
print(f'Total documents: {len(docs)}')
for idx, d in enumerate(docs[:10], 1):
    org_user = db.query(User).filter(User.org_id == d.org_id).first()
    user_email = org_user.email if org_user else 'Unknown'
    print(f'{idx}. File: {d.original_filename} | Org: {d.org_id} ({user_email}) | Status: {d.status}')

print('\n=== USERS IN DATABASE ===')
users = db.query(User).all()
for u in users[:10]:
    print(f'{u.email} | Role: {u.role} | Org: {u.org_id}')

db.close()
