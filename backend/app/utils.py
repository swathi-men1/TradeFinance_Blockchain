import hashlib

def generate_sha256(data: bytes) -> str:
    """
    Generate SHA-256 hash for given data
    """
    sha256 = hashlib.sha256()
    sha256.update(data)
    return sha256.hexdigest()
