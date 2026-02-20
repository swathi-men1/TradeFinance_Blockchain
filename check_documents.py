import sys
sys.path.insert(0, 'd:\\Projects\\TradeFinance_Blockchain\\TradeFinance_Blockchain\\backend')

from app.db.session import SessionLocal
from app.models.document import Document

db = SessionLocal()
try:
    docs = db.query(Document).all()
    print(f'Total documents in DB: {len(docs)}')
    if len(docs) > 0:
        for i, doc in enumerate(docs[:5]):
            file_url_short = doc.file_url[:50] if len(doc.file_url) > 50 else doc.file_url
            print(f'  [{i+1}] ID: {doc.id}, Doc#: {doc.doc_number}, File: {file_url_short}, Pending: {doc.file_url.startswith("pending:")}')
    else:
        print('  No documents found in database')
except Exception as e:
    print(f'Error querying documents: {e}')
    import traceback
    traceback.print_exc()
finally:
    db.close()
