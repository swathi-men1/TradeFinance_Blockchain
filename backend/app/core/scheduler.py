# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.integrity_service import IntegrityService
from app.db.session import SessionLocal
from app.models.audit import AuditLog
from datetime import datetime
import traceback

scheduler = BackgroundScheduler()

def verify_ledger_integrity():
    """
    Background job to verify integrity of all ledger entries.
    Runs periodically.
    """
    db = SessionLocal()
    try:
        # Run verification
        results = IntegrityService.verify_all_documents(db)
        
        # Log execution
        # We can add an audit log entry for the system action
        # Since this is system action, admin_id might be None or a special system user ID?
        # For now, let's just print to stdout/logs.
        print(f"[{datetime.now()}] Integrity Check Finished: {results['valid_documents']} valid, {results['failed_documents']} failed.")
        
        # If failures detected, log robustly (but don't crash)
        if results['failed_documents'] > 0:
            print(f"WARNING: TAMPERING DETECTED! Details: {results['failure_details']}")
            # Ideally trigger alert here
            # NOTE: This is a warning, not a critical error that should crash the app
            
    except Exception as e:
        print(f"ERROR in integrity verification job: {e}")
        traceback.print_exc()
        # Continue running - don't crash the scheduler
    finally:
        db.close()

def start_scheduler():
    """Start the background scheduler"""
    # Run every 5 minutes in dev, can be configured
    scheduler.add_job(verify_ledger_integrity, 'interval', minutes=5)
    scheduler.start()
    print("Background scheduler started - integrity checks every 5 minutes")

