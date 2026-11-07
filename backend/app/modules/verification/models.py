import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Date, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, IdMixin, TimestampMixin


class InteractionStatus(enum.StrEnum):
    started = "started"
    verified = "verified"
    rejected = "rejected"


class Interaction(IdMixin, TimestampMixin, Base):
    """One participant's engagement with one campaign on one UTC day."""

    __tablename__ = "interactions"
    __table_args__ = (
        # Duplicate-task prevention: one attempt per user, campaign and day.
        UniqueConstraint("user_id", "campaign_id", "day", name="uq_interaction_user_campaign_day"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[InteractionStatus] = mapped_column(
        Enum(InteractionStatus, name="interaction_status"), default=InteractionStatus.started
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    required_seconds: Mapped[float] = mapped_column(Float)
    # Server-side playback accounting
    watched_seconds: Mapped[float] = mapped_column(Float, default=0)
    last_position: Mapped[float] = mapped_column(Float, default=0)
    last_event_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    event_count: Mapped[int] = mapped_column(Integer, default=0)
    suspicious_events: Mapped[int] = mapped_column(Integer, default=0)
    events: Mapped[list] = mapped_column(JSON, default=list)

    rating: Mapped[int | None] = mapped_column(Integer)
    answer: Mapped[str | None] = mapped_column(String(300))
    feedback: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(300))
    reward_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))

    client_ip: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(400))
