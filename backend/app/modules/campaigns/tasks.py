from datetime import UTC, datetime

from sqlalchemy import update

from app.core.celery_app import celery_app
from app.core.db import SyncSessionLocal
from app.modules.campaigns.models import Campaign, CampaignStatus


def sync_status_sync() -> dict[str, int]:
    """Expire campaigns past ends_at and complete those whose budget is exhausted."""
    now = datetime.now(UTC)
    live = (CampaignStatus.active, CampaignStatus.paused)
    with SyncSessionLocal() as session:
        expired = session.execute(
            update(Campaign)
            .where(Campaign.status.in_(live), Campaign.ends_at.is_not(None), Campaign.ends_at <= now)
            .values(status=CampaignStatus.expired)
        ).rowcount
        completed = session.execute(
            update(Campaign)
            .where(
                Campaign.status.in_(live),
                Campaign.budget_total - Campaign.budget_spent < Campaign.reward_rate,
            )
            .values(status=CampaignStatus.completed)
        ).rowcount
        session.commit()
    if expired or completed:
        import redis

        from app.core.config import settings

        try:
            redis.from_url(settings.redis_url).delete("campaigns:live")
        except redis.RedisError:
            pass
    return {"expired": expired, "completed": completed}


@celery_app.task(name="campaigns.sync_status")
def sync_status() -> dict[str, int]:
    return sync_status_sync()
