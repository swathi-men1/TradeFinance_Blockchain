import os
import re

# Comprehensive import mappings
REPLACEMENTS = [
    (r'from app\.db\.session', 'from db.session'),
    (r'from app\.db\.models', 'from db.models'),
    (r'from app\.api\.modules\.auth\.routes', 'from api.modules.auth.routes'),
    (r'from app\.api\.modules\.registry', 'from api.modules.registry'),
    (r'from app\.api\.modules\.risk', 'from api.modules.risk'),
    (r'from app\.schemas', 'from schemas'),
    (r'from app\.core\.permissions', 'from core.permissions'),
    (r'from app\.core\.security', 'from auth'),  # security.py was renamed to auth.py
    (r'from app\.core\.config', 'from core.config'),
    (r'from app\.core\.context', 'from core.context'),
    (r'from app\.utils\.audit_logger', 'from utils.audit_logger'),
    (r'from app\.services\.ledger', 'from services.ledger'),
    (r'from app\.services\.ledger_service', 'from services.ledger_service'),
    (r'from app\.services\.workflow_service', 'from services.workflow_service'),
    (r'from app\.services\.integrity_service', 'from services.integrity_service'),
    (r'from app\.services\.risk_engine', 'from services.risk_engine'),
    (r'from app\.services\.external_signals', 'from services.external_signals'),
    (r'from app\.services\.store', 'from services.store'),
    (r'from app\.celery_app', 'from celery_app'),
]

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"Error in {filepath}: {e}")
        return False

def main():
    root = r'e:\TradeFinance_Blockchain_Explorer\TradeFinance_Blockchain_Explorer\backend'
    count = 0
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip venv, __pycache__, etc.
        dirnames[:] = [d for d in dirnames if d not in ['venv', '__pycache__', '.pytest_cache', 'backend']]
        
        for filename in filenames:
            if filename.endswith('.py'):
                filepath = os.path.join(dirpath, filename)
                if fix_file(filepath):
                    count += 1
    
    print(f"\nFixed {count} files")

if __name__ == '__main__':
    main()
