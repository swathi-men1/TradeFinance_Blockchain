import hashlib
import json
from typing import Any, Dict

class LedgerHash:
    @staticmethod
    def generate_hash(
        document_id: int | None,
        action: str,
        actor_id: int | None,
        metadata: Dict[str, Any] | None,
        previous_hash: str
    ) -> str:
        """
        Generate a deterministic SHA-256 hash for a ledger entry.
        
        Formula: SHA256(document_id + action + actor_id + metadata_json + previous_hash)
        """
        # Ensure None values are handled consistently
        doc_id_str = str(document_id) if document_id is not None else "None"
        actor_id_str = str(actor_id) if actor_id is not None else "None"
        
        # Serialize metadata deterministically
        if metadata:
            metadata_str = json.dumps(metadata, sort_keys=True)
        else:
            metadata_str = ""
            
        # Handle Genesis case
        prev_hash_str = previous_hash if previous_hash else "GENESIS"
        
        # Construct the raw string to hash
        raw_string = f"{doc_id_str}|{action}|{actor_id_str}|{metadata_str}|{prev_hash_str}"
        
        # Generate hash
        return hashlib.sha256(raw_string.encode('utf-8')).hexdigest()
