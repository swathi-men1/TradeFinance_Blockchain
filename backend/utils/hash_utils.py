import hashlib

def generate_sha256(file_path):
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        sha.update(f.read())
    return sha.hexdigest()
