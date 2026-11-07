"""Thin Redis JSON cache used for read-heavy endpoints (campaign feed, analytics)."""

import json
from collections.abc import Awaitable, Callable
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def cached(key: str, loader: Callable[[], Awaitable[Any]], ttl: int | None = None) -> Any:
    """Return the cached JSON value for `key`, or compute, store and return it.

    Cache failures never break the request: on any Redis error we fall back to the loader.
    """
    r = get_redis()
    try:
        hit = await r.get(key)
        if hit is not None:
            return json.loads(hit)
    except aioredis.RedisError:
        return await loader()
    value = await loader()
    try:
        await r.set(key, json.dumps(value, default=str), ex=ttl or settings.cache_ttl_seconds)
    except aioredis.RedisError:
        pass
    return value


async def invalidate(*patterns: str) -> None:
    r = get_redis()
    try:
        for pattern in patterns:
            async for key in r.scan_iter(match=pattern):
                await r.delete(key)
    except aioredis.RedisError:
        pass


async def ping() -> bool:
    try:
        return bool(await get_redis().ping())
    except aioredis.RedisError:
        return False
