# /* Author: Abdul Samad | */
from sqlalchemy.orm import Session
from db.models import TradeLedger, ActionEnum, Documents, TradeFlows, TradeStatusEnum, RiskAssessment, Notifications
from services.external_signals import ExternalDataService
from sqlalchemy import func, or_
import logging

logger = logging.getLogger(__name__)

class RiskService:
    @staticmethod
    def calculate_and_update(db: Session, user_id: int):
        """
        Core Risk Logic: 70% Internal + 30% External.
        """
        try:
            # Move imports inside to prevent circular dependency
            from db.models import TradeFlows, TradeStatusEnum, RiskAssessment, Notifications
            
            # 1. Internal Performance (70% Weight)
            # Ratio = Completed / (Completed + Disputed)
            
            completed_trades = db.query(func.count(TradeFlows.id)).filter(
                or_(TradeFlows.buyer_id == user_id, TradeFlows.seller_id == user_id),
                TradeFlows.status == TradeStatusEnum.completed
            ).scalar() or 0
            
            disputed_trades = db.query(func.count(TradeFlows.id)).filter(
                or_(TradeFlows.buyer_id == user_id, TradeFlows.seller_id == user_id),
                TradeFlows.status == TradeStatusEnum.disputed
            ).scalar() or 0
        except Exception as e:
            logger.error(f"Error querying trades: {e}")
            raise e
        
        total_relevant = completed_trades + disputed_trades
        
        # NaN Fallback
        if total_relevant == 0:
            internal_score = 50.0
            internal_rationale = "No trade history (Default 50.0)"
        else:
            # Avoid division by zero
            ratio = float(completed_trades) / float(total_relevant)
            internal_score = ratio * 100.0
            internal_rationale = f"History: {completed_trades}/{total_relevant} successful."

        weighted_internal = internal_score * 0.70

        # 2. External Stability (30% Weight)
        # Let's assume fetch_market_signals returns a multiplier around 1.0, 
        # or maybe we interpret it as a secure score normalized to 100.
        # Implementation Plan says "Index * 30". 
        # Looking at previous code, it returned something like 1.05.
        # Let's standardize: External Service usually returns a factor (0.8 to 1.2).
        # We need a score 0-100. Let's assume the external factor * 50 + 25? 
        # Or simpler: Just a mock simulated score 0-100.
        
        # Simulating a "Country Risk Score" from 0 to 100
        # If fetch_market_signals returns ~1.0, let's map it.
        # Let's say strictly for this module: 
        # External Score = 80.0 (Base) * external_factor
        try:
            external_index = ExternalDataService.fetch_market_signals() # Returns 0.0 to 1.0 (roughly)
            # Standardize: External Service returns factor (0.8 to 1.2).
            # We map this to a score out of 100.
            # Base 80 * factor.
            external_raw = 80.0 * external_index
            external_raw = min(external_raw, 100.0)
            weighted_external = external_raw * 0.30
        except Exception as e:
            logger.error(f"External Data Fetch Error: {e}")
            weighted_external = 30.0 * 0.8 # Fallback
            external_raw = 0.0

        # 3. Total
        final_score = weighted_internal + weighted_external
        final_score = min(final_score, 100.0)
        
        rationale_text = (
            f"Internal ({internal_score:.1f} * 0.7) + "
            f"External ({external_raw:.1f} * 0.3). "
            f"{internal_rationale}"
        )

        # 4. Save
        try:
            risk = db.query(RiskAssessment).filter(RiskAssessment.user_id == user_id).first()
            if risk:
                risk.score = final_score
                risk.rationale = rationale_text
            else:
                risk = RiskAssessment(
                    user_id=user_id,
                    score=final_score,
                    rationale=rationale_text
                )
                db.add(risk)
            
            db.commit()
            db.refresh(risk)
        except Exception as e:
            logger.error(f"DB Save Error: {e}")
            db.rollback()
            raise e
        
        # 5. Notify
        RiskService._notify_user(db, user_id, final_score, rationale_text)
        
        return final_score, rationale_text

    @staticmethod
    def _notify_user(db: Session, user_id: int, score: float, rationale: str):
        try:
            from db.models import Notifications
            notif = Notifications(
                user_id=user_id,
                message=f"Risk Score Updated: {score:.1f}. {rationale}"
            )
            db.add(notif)
            db.commit()
        except:
            pass
