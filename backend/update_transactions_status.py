import sqlite3
import os

db_path = "d:/501/Trade_Finance_Blockchain/Trade_Finance_Blockchain/backend/tradechain_v2.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Updating existing 'PENDING' transactions to 'ISSUED'...")
    cursor.execute("UPDATE transactions SET status = 'ISSUED' WHERE status = 'PENDING'")
    conn.commit()
    print(f"Update successful. {cursor.rowcount} records modified.")

except Exception as e:
    print(f"Update failed: {e}")
finally:
    conn.close()
