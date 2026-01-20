import hashlib

def generate_hash(file_bytes: bytes):
    return hashlib.sha256(file_bytes).hexdigest()
