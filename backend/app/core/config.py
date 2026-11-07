from decimal import Decimal
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8080"]

    # Database (async driver for the API; the sync URL is derived for Celery/Alembic)
    database_url: str = "postgresql+asyncpg://attentia:attentia@localhost:25432/attentia"

    # Redis: cache + Celery broker/result backend
    redis_url: str = "redis://localhost:26379/0"
    celery_broker_url: str = "redis://localhost:26379/1"
    celery_result_backend: str = "redis://localhost:26379/2"
    cache_ttl_seconds: int = 60

    # Auth
    jwt_secret: str = "dev-only-jwt-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 12

    # S3-compatible object storage
    s3_endpoint_url: str = "http://localhost:29000"
    # Endpoint used inside presigned URLs handed to browsers (may differ from the internal one)
    s3_public_endpoint_url: str = "http://localhost:29000"
    s3_access_key: str = "attentia"
    s3_secret_key: str = "attentia-secret"
    s3_region: str = "us-east-1"
    s3_bucket: str = "attentia-media"
    s3_presign_seconds: int = 3600

    # Media pipeline
    ffmpeg_bin: str = "ffmpeg"
    ffprobe_bin: str = "ffprobe"
    max_upload_mb: int = 200

    # YouTube-hosted creatives. Optional: with a Data API key we read title, duration and
    # embeddability; without one we use oEmbed and the advertiser supplies the duration.
    youtube_api_key: str = ""

    # Payments
    deposit_required_confirmations: int = 12
    deposit_expiry_minutes: int = 60 * 24
    address_derivation_secret: str = "dev-address-secret"

    # Rewards
    platform_fee_pct: Decimal = Decimal("0")

    # Seed accounts (development only)
    seed_admin_email: str = "admin@gmail.com"
    seed_admin_username: str = "admin"
    seed_admin_password: str = "qwerty1life"

    @model_validator(mode="after")
    def _production_secrets(self):
        if self.env == "production":
            insecure = [
                name
                for name, value in (
                    ("JWT_SECRET", self.jwt_secret),
                    ("ADDRESS_DERIVATION_SECRET", self.address_derivation_secret),
                    ("S3_SECRET_KEY", self.s3_secret_key),
                )
                if "dev" in value or "change-me" in value or value == "attentia-secret" or len(value) < 32
            ]
            if insecure:
                raise ValueError(f"Set strong production values for: {', '.join(insecure)}")
        return self

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg")

    @property
    def is_dev(self) -> bool:
        return self.env in {"development", "test"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
