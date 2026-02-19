# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
import hashlib

class ExternalRiskMock:
    """
    Simulates UNCTAD/WTO risk data.
    Provides deterministic risk scores based on organization name or user ID.
    """
    
    @staticmethod
    def get_country_risk(org_name: str) -> float:
        """
        Get deterministic country risk score (0-1).
        
        Ref:
        LOW risk country → 0.2
        MEDIUM risk country → 0.5
        HIGH risk country → 0.8
        """
        if not org_name:
            return 0.5  # Default to Medium if no org name
            
        # Deterministic hash of org name to select risk level
        # use SHA256 of org_name to get a number
        hash_val = int(hashlib.sha256(org_name.encode('utf-8')).hexdigest(), 16)
        
        # Modulo 3 to pick one of 3 buckets consistently
        bucket = hash_val % 3
        
        if bucket == 0:
            return 0.2  # LOW
        elif bucket == 1:
            return 0.5  # MEDIUM
        else:
            return 0.8  # HIGH
