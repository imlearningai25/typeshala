"""
Redis connection pool — shared across the application.
Used for: token blacklist, rate limiting, leaderboard caching.
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

import redis.asyncio as aioredis

from app.config import settings

_redis_pool: aioredis.Redis | None = None


async def get_redis_pool() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _redis_pool


async def close_redis_pool() -> None:
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None


# FastAPI dependency
async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    pool = await get_redis_pool()
    yield pool


# ── Helpers ────────────────────────────────────────────────────────────────────

async def redis_set(key: str, value: str, ex: int | None = None) -> None:
    r = await get_redis_pool()
    await r.set(key, value, ex=ex)


async def redis_get(key: str) -> str | None:
    r = await get_redis_pool()
    return await r.get(key)


async def redis_delete(key: str) -> None:
    r = await get_redis_pool()
    await r.delete(key)


async def redis_exists(key: str) -> bool:
    r = await get_redis_pool()
    return bool(await r.exists(key))
