import hashlib

def calculate_hash(file_bytes):
    return hashlib.sha256(file_bytes).hexdigest()
