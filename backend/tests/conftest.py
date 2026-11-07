"""Integration tests against real Postgres, Redis and S3 (docker compose up postgres redis objectstore)."""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://attentia:attentia@localhost:25432/attentia_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:26379/5")
os.environ.setdefault("S3_BUCKET", "attentia-test")
os.environ["ENV"] = "test"

import psycopg  # noqa: E402
import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core.celery_app import celery_app  # noqa: E402
from app.core.config import settings  # noqa: E402

celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True


def _ensure_database():
    admin_url = settings.sync_database_url.replace("+psycopg", "").rsplit("/", 1)[0] + "/postgres"
    db = settings.sync_database_url.rsplit("/", 1)[1]
    with psycopg.connect(admin_url, autocommit=True) as conn:
        if not conn.execute("select 1 from pg_database where datname=%s", (db,)).fetchone():
            conn.execute(f'create database "{db}"')


_ensure_database()

import app.models  # noqa: E402,F401
from app.core import cache, storage  # noqa: E402
from app.core.db import Base, SyncSessionLocal, engine, sync_engine  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import run as seed  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def schema():
    Base.metadata.drop_all(sync_engine)
    Base.metadata.create_all(sync_engine)
    storage.ensure_bucket()
    yield
    sync_engine.dispose()


@pytest.fixture(autouse=True)
async def clean(schema):
    tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with SyncSessionLocal() as s:
        s.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
        s.commit()
    seed()
    await cache.get_redis().flushdb()
    yield
    await engine.dispose()


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test/api/v1") as c:
        yield c


async def login(client, identifier, password) -> dict[str, str]:
    r = await client.post("/auth/login", json={"identifier": identifier, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
async def demo(client):
    return await login(client, "demo", "demo-password")


@pytest.fixture
async def admin(client):
    return await login(client, settings.seed_admin_email, settings.seed_admin_password)


@pytest.fixture
async def advertiser(client):
    return await login(client, "advertiser", "advertiser-password")
