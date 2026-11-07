import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.modules.packages.models import Package, Subscription, SubscriptionStatus


async def active_subscription(session: AsyncSession, user_id: uuid.UUID) -> Subscription | None:
    now = datetime.now(UTC)
    return await session.scalar(
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.expires_at > now,
        )
        .order_by(Subscription.activated_at.desc())
        .limit(1)
    )


def activate_subscription(session: Session, subscription: Subscription) -> None:
    """Activate (sync, called from the deposit-confirmation path in Celery or the API)."""
    package = session.get(Package, subscription.package_id)
    now = datetime.now(UTC)
    # Any other active subscription for the user is superseded by the new one.
    for other in session.scalars(
        select(Subscription).where(
            Subscription.user_id == subscription.user_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.id != subscription.id,
        )
    ):
        other.status = SubscriptionStatus.cancelled
    subscription.status = SubscriptionStatus.active
    subscription.activated_at = now
    subscription.expires_at = now + timedelta(days=package.duration_days)
