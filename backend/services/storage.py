import os
import shutil
import uuid
from fastapi import UploadFile

class S3Service:
    def __init__(self):
        # In a real scenario, this would use boto3 and AWS credentials
        self.upload_dir = "uploads/s3_mock"
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file: UploadFile) -> str:
        """
        Uploads a file to the storage service.
        Returns the unique key/filename.
        """
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return unique_filename

    def get_file_path(self, key: str) -> str:
        """
        Returns the local file path for a given key.
        """
        return os.path.join(self.upload_dir, key)

    def delete_file(self, key: str):
        """
        Deletes a file from storage.
        """
        file_path = self.get_file_path(key)
        if os.path.exists(file_path):
            os.remove(file_path)

# Singleton instance
storage_service = S3Service()
