from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

import app.models  # noqa: F401  (register all tables)
from app.core import cache, storage
from app.core.config import settings
from app.core.db import SessionLocal
from app.modules.analytics.router import router as analytics_router
from app.modules.assets.router import router as assets_router
from app.modules.campaigns.router import router as campaigns_router
from app.modules.packages.router import router as packages_router
from app.modules.payments.router import router as payments_router
from app.modules.rewards.router import router as rewards_router
from app.modules.users.router import auth_router, users_router
from app.modules.verification.router import router as verification_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await run_in_threadpool(storage.ensure_bucket)
    except Exception:  # storage may come up after the API; health reports it
        pass
    yield


app = FastAPI(title="Attentia API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (
    auth_router,
    users_router,
    packages_router,
    campaigns_router,
    assets_router,
    verification_router,
    rewards_router,
    payments_router,
    analytics_router,
):
    app.include_router(r, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health", tags=["health"])
async def health():
    db_ok = True
    try:
        async with SessionLocal() as s:
            await s.execute(text("select 1"))
    except Exception:
        db_ok = False
    redis_ok = await cache.ping()
    s3_ok = await run_in_threadpool(storage.ping)
    ok = db_ok and redis_ok and s3_ok
    return {"status": "ok" if ok else "degraded", "database": db_ok, "redis": redis_ok, "storage": s3_ok}
