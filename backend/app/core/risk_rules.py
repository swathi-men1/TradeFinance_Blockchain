from typing import List, Dict, Any, Tuple
from decimal import Decimal


class RiskRules:
    """
    Implements the risk scoring formula per mentor requirements.
    
    Risk Score is USER-based, deterministic, and rule-based (NOT ML).
    
    Weights (Mentor Specified):
    - Document Integrity: 40% (Highest)
    - Activity Risk (Ledger): 25%
    - Transaction Behavior: 25%
    - External Risk: 10% (Lowest)
    
    Score Range: 0-100
    Categories:
    - 0-33: LOW Risk
    - 34-66: MEDIUM Risk
    - 67-100: HIGH Risk
    """
    
    # Weight Constants (Mentor Required)
    WEIGHT_DOCUMENT = 40  # Highest priority as per mentor
    WEIGHT_ACTIVITY = 25  # Ledger-based activity
    WEIGHT_TRANSACTION = 25  # Trade behavior
    WEIGHT_EXTERNAL = 10  # External/Country risk (lowest)
    
    # Category Thresholds (Mentor Specified)
    LOW_THRESHOLD = 33
    MEDIUM_THRESHOLD = 66
    
    @staticmethod
    def calculate_document_risk(total_documents: int, tampered_documents: int) -> Tuple[float, str]:
        """
        Calculate document integrity risk score (0-1).
        
        Input 1: Document Integrity (Highest Weight)
        - Checks document hash verification
        - Detects tampered ledger
        - Counts failed integrity checks
        - Document volume (more docs = lower uncertainty)
        
        Strategy:
        - No documents: Higher uncertainty (0.5) = higher risk
        - Few documents (<3): Moderate uncertainty (0.3-0.4)
        - Many documents (>10): Lower uncertainty, focus on tamper rate
        - Tampered documents: Heavy penalty (adds up to 0.6)
        """
        if total_documents == 0:
            # No documents = HIGH uncertainty risk
            rate = 0.5
            explanation = "No documents uploaded yet (HIGH uncertainty risk: 0.50)"
        elif total_documents < 3:
            # Few documents = moderate uncertainty + tamper rate
            tamper_rate = tampered_documents / total_documents if total_documents > 0 else 0
            base_uncertainty = 0.35  # Moderate uncertainty for low volume
            rate = min(1.0, base_uncertainty + (tamper_rate * 0.4))
            explanation = f"Low document volume ({total_documents} docs): base uncertainty 0.35 + tamper penalty {tamper_rate * 0.4:.2f} ≈ {rate:.2f}"
        else:
            # Normal case: tamper rate dominates, with slight uncertainty penalty for low volume
            tamper_rate = tampered_documents / total_documents
            volume_penalty = max(0, (10 - total_documents) / 100)  # Slight penalty if < 10 docs
            rate = min(1.0, tamper_rate + volume_penalty)
            explanation = f"Document integrity: {tampered_documents} tampered / {total_documents} total = {tamper_rate:.2%}, volume penalty = {volume_penalty:.2f}, total = {rate:.2f}"
        
        return rate, explanation

    @staticmethod
    def calculate_activity_risk(
        total_ledger_entries: int,
        failed_verifications: int,
        corrections_count: int
    ) -> Tuple[float, str]:
        """
        Calculate user activity risk based on ledger behavior (0-1).
        
        Input 2: User Activity (Ledger Based)
        - Failed ledger events
        - Abnormal action frequency
        - Repeated corrections/amendments
        - Document upload consistency
        
        Strategy:
        - High failed verifications: Increases risk
        - Many corrections: Indicates unreliability
        - Low activity: Uncertainty risk
        """
        if total_ledger_entries == 0:
            rate = 0.45  # No activity = moderate-high uncertainty
            explanation = "No ledger activity recorded (default uncertainty risk: 0.45)"
        else:
            # Weight failed verifications heavily (most concerning)
            failure_rate = failed_verifications / total_ledger_entries if total_ledger_entries > 0 else 0
            
            # Corrections indicate lack of due diligence
            correction_rate = corrections_count / total_ledger_entries if total_ledger_entries > 0 else 0
            
            # Combined activity risk: failures are 70% of score, corrections 30%
            rate = min(1.0, (failure_rate * 0.7) + (correction_rate * 0.3))
            
            explanation = f"Activity Analysis: {failed_verifications} verification failures + {corrections_count} corrections in {total_ledger_entries} entries = {rate:.2%} risk"
        
        return rate, explanation

    @staticmethod
    def calculate_transaction_risk(
        total_trades: int,
        disputed_trades: int,
        cancelled_trades: int = 0,
        delayed_trades: int = 0
    ) -> Tuple[float, str]:
        """
        Calculate transaction behavior risk (0-1).
        
        Input 3: Transaction Behavior
        - Trade disputes
        - Delays
        - Cancelled trades
        - Failed trades
        """
        if total_trades == 0:
            # No trades = uncertainty, moderate risk
            rate = 0.5
            explanation = "No trade history (default uncertainty risk: 0.50)"
        else:
            # Weight disputed trades most heavily
            dispute_rate = disputed_trades / total_trades
            cancel_rate = cancelled_trades / total_trades
            delay_rate = delayed_trades / total_trades
            
            # Weighted combination
            rate = min(1.0, (dispute_rate * 0.6) + (cancel_rate * 0.25) + (delay_rate * 0.15))
            explanation = f"Transactions: {disputed_trades} disputed, {cancelled_trades} cancelled, {delayed_trades} delayed out of {total_trades} trades = {rate:.2%}"
        
        return rate, explanation

    @staticmethod
    def calculate_external_risk(external_score: float, source: str = "country") -> Tuple[float, str]:
        """
        Calculate external trade risk (0-1).
        
        Input 4: External Trade Risk (Optional)
        - Country trade risk
        - Region compliance risk
        
        Note: External data stays backend only.
        """
        explanation = f"External {source} risk score: {external_score:.2%}"
        return external_score, explanation

    @staticmethod
    def calculate_final_score(
        doc_risk: float,
        activity_risk: float,
        transaction_risk: float,
        external_risk: float,
        doc_explanation: str = "",
        activity_explanation: str = "",
        transaction_explanation: str = "",
        external_explanation: str = ""
    ) -> Tuple[Decimal, str, List[str]]:
        """
        Calculate weighted final score and return (score, category, rationale_list).
        
        Formula:
        final_score = 
            (doc_score × 40) 
            + (activity_score × 25) 
            + (transaction_score × 25) 
            + (external_score × 10)
        """
        # Clamp inputs to 0-1 range
        doc_risk = max(0, min(1, doc_risk))
        activity_risk = max(0, min(1, activity_risk))
        transaction_risk = max(0, min(1, transaction_risk))
        external_risk = max(0, min(1, external_risk))
        
        # Calculate weighted components
        component_doc = doc_risk * RiskRules.WEIGHT_DOCUMENT
        component_activity = activity_risk * RiskRules.WEIGHT_ACTIVITY
        component_transaction = transaction_risk * RiskRules.WEIGHT_TRANSACTION
        component_external = external_risk * RiskRules.WEIGHT_EXTERNAL
        
        # Sum for total score (0-100)
        total_score = component_doc + component_activity + component_transaction + component_external
        
        # Clamp final score
        final_score = max(0, min(100, total_score))
        
        # Determine category (Mentor thresholds: 0-33 LOW, 34-66 MEDIUM, 67-100 HIGH)
        category = RiskRules.get_risk_category(Decimal(final_score))
        
        # Generate rationale (human-readable explanation)
        rationale = []
        rationale.append(f"=== Risk Score Calculation ===")
        rationale.append(f"")
        rationale.append(f"1. DOCUMENT INTEGRITY (Weight: {RiskRules.WEIGHT_DOCUMENT}%)")
        rationale.append(f"   {doc_explanation}")
        rationale.append(f"   Contribution: {doc_risk:.2f} × {RiskRules.WEIGHT_DOCUMENT} = {component_doc:.2f} points")
        rationale.append(f"")
        rationale.append(f"2. USER ACTIVITY (Weight: {RiskRules.WEIGHT_ACTIVITY}%)")
        rationale.append(f"   {activity_explanation}")
        rationale.append(f"   Contribution: {activity_risk:.2f} × {RiskRules.WEIGHT_ACTIVITY} = {component_activity:.2f} points")
        rationale.append(f"")
        rationale.append(f"3. TRANSACTION BEHAVIOR (Weight: {RiskRules.WEIGHT_TRANSACTION}%)")
        rationale.append(f"   {transaction_explanation}")
        rationale.append(f"   Contribution: {transaction_risk:.2f} × {RiskRules.WEIGHT_TRANSACTION} = {component_transaction:.2f} points")
        rationale.append(f"")
        rationale.append(f"4. EXTERNAL RISK (Weight: {RiskRules.WEIGHT_EXTERNAL}%)")
        rationale.append(f"   {external_explanation}")
        rationale.append(f"   Contribution: {external_risk:.2f} × {RiskRules.WEIGHT_EXTERNAL} = {component_external:.2f} points")
        rationale.append(f"")
        rationale.append(f"=== TOTAL RISK SCORE: {final_score:.2f}/100 ({category}) ===")
        
        return Decimal(final_score).quantize(Decimal("0.01")), category, rationale

    @staticmethod
    def get_risk_category(score: Decimal) -> str:
        """
        Determine risk category from score.
        
        Mentor thresholds:
        - 0-33: LOW Risk
        - 34-66: MEDIUM Risk  
        - 67-100: HIGH Risk
        """
        s = float(score)
        if s <= RiskRules.LOW_THRESHOLD:
            return "LOW"
        elif s <= RiskRules.MEDIUM_THRESHOLD:
            return "MEDIUM"
        else:
            return "HIGH"
