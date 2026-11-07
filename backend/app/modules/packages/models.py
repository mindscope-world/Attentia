import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, IdMixin, TimestampMixin


class Package(IdMixin, TimestampMixin, Base):
    """Admin-configurable participation tier (Starter / Growth / Pro …)."""

    __tablename__ = "packages"

    code: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(64))
    price: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    daily_quota: Mapped[int] = mapped_column(Integer)
    duration_days: Mapped[int] = mapped_column(Integer, default=365)
    min_withdrawal: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    withdrawal_fee_pct: Mapped[Decimal] = mapped_column(Numeric(6, 4))
    description: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class SubscriptionStatus(enum.StrEnum):
    pending_payment = "pending_payment"
    active = "active"
    expired = "expired"
    cancelled = "cancelled"


class Subscription(IdMixin, TimestampMixin, Base):
    """A participant's enrolment in a package. Activated by a confirmed deposit."""

    __tablename__ = "subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    package_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("packages.id"))
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status"), default=SubscriptionStatus.pending_payment
    )
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    package: Mapped[Package] = relationship(lazy="joined")
