from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import and_, or_, select
from sqlalchemy.sql import ColumnElement

from app.modules.campaigns.models import Campaign, CampaignStatus


def utc_today() -> date:
    return datetime.now(UTC).date()


def is_live_clause(now: datetime | None = None) -> ColumnElement[bool]:
    now = now or datetime.now(UTC)
    return and_(
        Campaign.status == CampaignStatus.active,
        or_(Campaign.starts_at.is_(None), Campaign.starts_at <= now),
        or_(Campaign.ends_at.is_(None), Campaign.ends_at > now),
        Campaign.budget_total - Campaign.budget_spent >= Campaign.reward_rate,
    )


def live_campaigns_stmt():
    return select(Campaign).where(is_live_clause()).order_by(Campaign.created_at)


def budget_remaining(c: Campaign) -> Decimal:
    return Decimal(c.budget_total) - Decimal(c.budget_spent)
