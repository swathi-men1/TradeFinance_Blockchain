from typing import List, Dict, Any, Tuple
from decimal import Decimal

class RiskRules:
    """
    Implements the risk scoring formula.
    
    Total Risk Score = 
      (Trade Failure Rate * 40)
    + (Tamper Rate * 30)
    + (Volume Risk * 20)
    + (External Risk * 10)
    
    Final Score clamped between 0 and 100.
    """
    
    @staticmethod
    def calculate_trade_failure_rate(total_trades: int, disputed_trades: int) -> float:
        if total_trades == 0:
            return 0.5  # Neutral risk assumption
        return disputed_trades / total_trades

    @staticmethod
    def calculate_tamper_rate(total_documents: int, tampered_documents: int) -> float:
        if total_documents == 0:
            return 0.3  # Slight risk for no history
        return tampered_documents / total_documents

    @staticmethod
    def calculate_volume_risk(total_trades: int) -> float:
        # Higher trade count = safer counterparty
        if total_trades >= 50:
            return 0.1
        elif 10 <= total_trades <= 49:
            return 0.3
        elif 1 <= total_trades <= 9:
            return 0.6
        else:
            return 0.8  # 0 trades

    @staticmethod
    def calculate_final_score(
        trade_failure_rate: float,
        tamper_rate: float,
        volume_risk: float,
        external_risk: float
    ) -> Tuple[Decimal, List[str]]:
        """
        Calculate weighted score and return (score, rationale_list).
        """
        
        # Weights
        w_trade = 40
        w_tamper = 30
        w_volume = 20
        w_external = 10
        
        # Components
        c_trade = trade_failure_rate * w_trade
        c_tamper = tamper_rate * w_tamper
        c_volume = volume_risk * w_volume
        c_external = external_risk * w_external
        
        total_score = c_trade + c_tamper + c_volume + c_external
        
        # Clamp
        final_score = max(0, min(100, total_score))
        
        # Rationale generation
        rationale = []
        rationale.append(f"Trade Failure Rate ({trade_failure_rate:.2f}) contributed {c_trade:.2f} points (Weight: {w_trade}%)")
        rationale.append(f"Document Tamper Rate ({tamper_rate:.2f}) contributed {c_tamper:.2f} points (Weight: {w_tamper}%)")
        rationale.append(f"Volume Risk ({volume_risk:.2f}) contributed {c_volume:.2f} points (Weight: {w_volume}%)")
        rationale.append(f"External Country Risk ({external_risk:.2f}) contributed {c_external:.2f} points (Weight: {w_external}%)")
        
        return Decimal(final_score).quantize(Decimal("0.01")), rationale

    @staticmethod
    def get_risk_category(score: Decimal) -> str:
        s = float(score)
        if s <= 30:
            return "LOW"
        elif s <= 70:
            return "MEDIUM"
        else:
            return "HIGH"
