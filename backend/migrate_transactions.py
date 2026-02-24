import sqlite3
import os

db_path = "d:/501/Trade_Finance_Blockchain/Trade_Finance_Blockchain/backend/tradechain_v2.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if items column already exists
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "items" not in columns:
        print("Adding 'items' column to 'transactions' table...")
        cursor.execute("ALTER TABLE transactions ADD COLUMN items TEXT")
        conn.commit()
        print("Migration successful.")
    else:
        print("'items' column already exists.")

except Exception as e:
    print(f"Migration failed: {e}")
finally:
    conn.close()
