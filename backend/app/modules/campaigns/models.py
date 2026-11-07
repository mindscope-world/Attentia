import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, IdMixin, TimestampMixin
from app.modules.assets.models import Asset


class CampaignStatus(enum.StrEnum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"  # budget exhausted
    expired = "expired"  # past ends_at


class Campaign(IdMixin, TimestampMixin, Base):
    __tablename__ = "campaigns"

    advertiser_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    asset_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("assets.id", ondelete="SET NULL"))

    name: Mapped[str] = mapped_column(String(200))
    brand: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text)
    objective: Mapped[str | None] = mapped_column(String(300))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus, name="campaign_status"), default=CampaignStatus.draft
    )

    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    daily_interaction_limit: Mapped[int] = mapped_column(Integer, default=1000)
    reward_rate: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    budget_total: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    budget_spent: Mapped[Decimal] = mapped_column(Numeric(18, 6), default=Decimal("0"))

    # Completion requirements used by the verification module
    min_watch_pct: Mapped[float] = mapped_column(Float, default=0.9)
    # Viewing time for image creatives, or when no processed video is attached yet.
    display_seconds: Mapped[int] = mapped_column(Integer, default=15)
    requires_feedback: Mapped[bool] = mapped_column(Boolean, default=False)
    rating_prompt: Mapped[str] = mapped_column(String(300))
    question: Mapped[str] = mapped_column(String(300))
    options: Mapped[list[str]] = mapped_column(JSON, default=list)
    # Optional comprehension check; when set, the answer must match to be verified.
    correct_option: Mapped[str | None] = mapped_column(String(300))
    targeting: Mapped[dict] = mapped_column(JSON, default=dict)

    asset: Mapped[Asset | None] = relationship(lazy="joined")
