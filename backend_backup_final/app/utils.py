import hashlib
import json
from .models import SystemLog
from datetime import datetime


def generate_document_hash(data: dict):
    """
    Generates SHA-256 hash from document metadata.
    """
    encoded = json.dumps(data, sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def generate_ledger_hash(document_id, action, actor_id, metadata,
                         previous_hash):
    """
    Generates chained SHA-256 hash for ledger entry.
    """
    payload = {
        "document_id": document_id,
        "action": action,
        "actor_id": actor_id,
        "metadata": metadata,
        "previous_hash": previous_hash,
    }

    encoded = json.dumps(payload, sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def log_action(db,
               user_id,
               action_type,
               entity_type,
               entity_id=None,
               description=None):
    log = SystemLog(user_id=user_id,
                    action_type=action_type,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    description=description,
                    created_at=datetime.utcnow())
    db.add(log)
    db.commit()
