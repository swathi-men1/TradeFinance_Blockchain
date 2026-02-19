# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
import hashlib
from typing import BinaryIO


def compute_file_hash(file_content: bytes) -> str:
    """Compute SHA-256 hash of file content"""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_content)
    return sha256_hash.hexdigest()


def compute_file_hash_stream(file_stream: BinaryIO) -> str:
    """Compute SHA-256 hash of file stream (for large files)"""
    sha256_hash = hashlib.sha256()
    
    # Read file in chunks
    for chunk in iter(lambda: file_stream.read(4096), b""):
        sha256_hash.update(chunk)
    
    return sha256_hash.hexdigest()
