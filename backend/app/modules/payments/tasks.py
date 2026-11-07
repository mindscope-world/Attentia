from app.core.celery_app import celery_app
from app.core.db import SyncSessionLocal
from app.modules.payments import service


@celery_app.task(name="payments.scan_pending_deposits")
def scan_pending_deposits() -> int:
    with SyncSessionLocal() as session:
        n = service.scan_pending(session)
        session.commit()
        return n


@celery_app.task(name="payments.expire_stale_deposits")
def expire_stale_deposits() -> int:
    with SyncSessionLocal() as session:
        n = service.expire_stale(session)
        session.commit()
        return n
