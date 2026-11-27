import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, IdMixin, TimestampMixin

# Stored statuses. For links that have a campaign the *effective* status follows the campaign.
PENDING = "pending"  # fetched, waiting for an admin decision
ACTIVE = "active"  # approved: a live campaign exists
PAUSED = "paused"  # approved but hidden from users
DECLINED = "declined"  # rejected: campaign and creative removed, link kept so it is never fetched again


class AdLink(IdMixin, TimestampMixin, Base):
    """Permanent store of every ad link the platform has ever seen: fetched, added by hand or pre-existing."""

    __tablename__ = "ad_links"

    youtube_id: Mapped[str] = mapped_column(String(11), unique=True, index=True)
    url: Mapped[str] = mapped_column(String(200))
    title: Mapped[str | None] = mapped_column(String(300))
    channel_title: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(String(300))
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    category: Mapped[str | None] = mapped_column(String(64))
    source: Mapped[str] = mapped_column(String(16))  # fetched | existing
    status: Mapped[str] = mapped_column(String(16), default=PENDING, index=True)

    asset_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("assets.id", ondelete="SET NULL"))
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"))
    decided_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
