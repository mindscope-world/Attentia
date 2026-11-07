"""S3-compatible object storage (MinIO locally, AWS S3 / R2 / GCS-interop in the cloud)."""

from functools import lru_cache
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import settings


def _client(endpoint: str):
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


@lru_cache
def s3():
    return _client(settings.s3_endpoint_url)


@lru_cache
def s3_public():
    """Client used only to sign URLs that browsers will call."""
    return _client(settings.s3_public_endpoint_url)


def ensure_bucket() -> None:
    try:
        s3().head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        s3().create_bucket(Bucket=settings.s3_bucket)


def upload_file(path: Path | str, key: str, content_type: str) -> None:
    s3().upload_file(str(path), settings.s3_bucket, key, ExtraArgs={"ContentType": content_type})


def upload_fileobj(fileobj, key: str, content_type: str) -> None:
    s3().upload_fileobj(fileobj, settings.s3_bucket, key, ExtraArgs={"ContentType": content_type})


def download_file(key: str, path: Path | str) -> None:
    s3().download_file(settings.s3_bucket, key, str(path))


def delete_object(key: str) -> None:
    s3().delete_object(Bucket=settings.s3_bucket, Key=key)


def object_exists(key: str) -> bool:
    try:
        s3().head_object(Bucket=settings.s3_bucket, Key=key)
        return True
    except ClientError:
        return False


def presigned_get(key: str | None) -> str | None:
    if not key:
        return None
    return s3_public().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=settings.s3_presign_seconds,
    )


def presigned_put(key: str, content_type: str) -> str:
    return s3_public().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=settings.s3_presign_seconds,
    )


def ping() -> bool:
    try:
        s3().head_bucket(Bucket=settings.s3_bucket)
        return True
    except Exception:
        return False
