import enum
import uuid

from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, IdMixin, TimestampMixin


class AssetKind(enum.StrEnum):
    video = "video"
    image = "image"
    youtube = "youtube"  # embedded from YouTube; not stored or processed by us


class AssetStatus(enum.StrEnum):
    awaiting_upload = "awaiting_upload"
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class Asset(IdMixin, TimestampMixin, Base):
    """A stored creative. Campaigns reference assets, never hardcoded media files."""

    __tablename__ = "assets"

    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    kind: Mapped[AssetKind] = mapped_column(Enum(AssetKind, name="asset_kind"))
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus, name="asset_status"), default=AssetStatus.awaiting_upload
    )
    original_filename: Mapped[str | None] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(100))
    original_key: Mapped[str] = mapped_column(String(512))
    # Outputs of the processing pipeline
    media_key: Mapped[str | None] = mapped_column(String(512))  # H.264/AAC MP4 or WebP image
    thumbnail_key: Mapped[str | None] = mapped_column(String(512))
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    error: Mapped[str | None] = mapped_column(Text)
    # YouTube creatives
    youtube_id: Mapped[str | None] = mapped_column(String(11), index=True)
    title: Mapped[str | None] = mapped_column(String(300))
