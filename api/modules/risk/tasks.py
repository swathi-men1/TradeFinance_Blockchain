# /* Author: Abdul Samad | */
from celery_app import celery_app
from db.session import SessionLocal
from api.modules.risk.routes import get_risk_score_logic
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="recalculate_risk")
def recalculate_risk(user_id: int):
    """
    Background task to recalculate risk score.
    Reuses the logic from routes but runs asynchronously.
    """
    logger.info(f"Starting risk recalculation for User {user_id}")
    db = SessionLocal()
    try:
        # We need a way to reuse the logic. 
        # Ideally, the logic should be in a service/controller, not strictly tied to the router.
        # I'll modify routes.py to extract the logic into a service function first, 
        # or import it if I refactor.
        # For now, let's implement the core logic here or call a service.
        
        # Let's assume we refactor logic to app.modules.risk.service
        from api.modules.risk.service import RiskService
        
        score, rationale = RiskService.calculate_and_update(db, user_id)
        
        logger.info(f"Risk updated for User {user_id}: {score}")
        return {"user_id": user_id, "score": score, "rationale": rationale}
        
    except Exception as e:
        logger.error(f"Risk recalculation failed for User {user_id}: {e}")
        raise e
    finally:
        db.close()
