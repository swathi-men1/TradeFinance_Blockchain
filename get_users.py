from app.database import SessionLocal
from sqlalchemy import text

db=SessionLocal()
rows=db.execute(text('SELECT id, email, role FROM users ORDER BY id')).fetchall()
for r in rows:
    print(r)
db.close()
