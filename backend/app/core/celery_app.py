from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "attentia",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.modules.assets.tasks",
        "app.modules.payments.tasks",
        "app.modules.campaigns.tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "assets.*": {"queue": "media"},
        "payments.*": {"queue": "default"},
        "campaigns.*": {"queue": "default"},
    },
    task_default_queue="default",
    beat_schedule={
        "scan-pending-deposits": {"task": "payments.scan_pending_deposits", "schedule": 30.0},
        "expire-stale-deposits": {"task": "payments.expire_stale_deposits", "schedule": 300.0},
        "sync-campaign-status": {"task": "campaigns.sync_status", "schedule": crontab(minute="*/5")},
    },
)
