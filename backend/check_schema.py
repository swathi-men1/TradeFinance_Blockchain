import sqlite3

try:
    conn = sqlite3.connect('tradechain_v2.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(documents)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in documents table: {columns}")
    if 'risk_score' in columns:
        print("SUCCESS: risk_score column exists.")
    else:
        print("FAILURE: risk_score column MISSING.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
