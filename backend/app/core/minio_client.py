import boto3
from botocore.exceptions import ClientError

# 🔹 MinIO S3 client configuration
s3_client = boto3.client(
    "s3",
    endpoint_url="http://127.0.0.1:9000",  # MinIO endpoint
    aws_access_key_id="minioadmin",
    aws_secret_access_key="minioadmin",
    region_name="us-east-1",
)

BUCKET_NAME = "tradefinance"


def create_bucket_if_not_exists():
    """
    Create bucket if it does not exist.
    """
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
    except ClientError:
        s3_client.create_bucket(Bucket=BUCKET_NAME)


def upload_file_to_minio(file_bytes: bytes, s3_key: str, content_type: str):
    """
    Upload file to MinIO bucket.
    """
    create_bucket_if_not_exists()

    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type
    )


def get_file_from_minio(s3_key: str) -> bytes:
    """
    Fetch file from MinIO bucket and return raw bytes.
    Used for integrity verification.
    """
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        return response["Body"].read()
    except ClientError as e:
        raise Exception(f"Failed to fetch file from MinIO: {str(e)}")


def delete_file_from_minio(s3_key: str):
    """
    Delete file from MinIO bucket.
    """
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
    except ClientError as e:
        raise Exception(f"Failed to delete file from MinIO: {str(e)}")
 