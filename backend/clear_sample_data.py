#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from app.database import SessionLocal

db = SessionLocal()

try:
    # Delete ledger entries first (no dependencies)
    result = db.execute(text("DELETE FROM ledger_entries"))
    print(f"Deleted {result.rowcount} ledger entries")
    
    # Delete trades
    result = db.execute(text("DELETE FROM trade_transactions"))
    print(f"Deleted {result.rowcount} trades")
    
    # Delete documents
    result = db.execute(text("DELETE FROM documents"))
    print(f"Deleted {result.rowcount} documents")
    
    db.commit()
    print("\n✓ Sample data deleted successfully!")
    print("Database is now clean and ready for your data")
    
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
