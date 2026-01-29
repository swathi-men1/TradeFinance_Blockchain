import hashlib

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
