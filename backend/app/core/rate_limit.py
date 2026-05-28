"""
Redis-based sliding-window rate limiter using native Redis commands.

Uses a sorted set keyed by timestamp. Each request adds its timestamp;
entries outside the window are pruned; the count determines allow/deny.
A pipeline makes the multi-step operation as close to atomic as possible.
"""
from __future__ import annotations

import time

from fastapi import Depends, Request
from redis.asyncio import Redis

from app.core.exceptions import RateLimitError
from app.core.redis import get_redis


async def _check_rate_limit(
    request: Request,
    redis: Redis,
    *,
    max_requests: int,
    window_seconds: int,
    key_prefix: str,
) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate:{key_prefix}:{client_ip}"
    now_ms = int(time.time() * 1000)
    window_ms = window_seconds * 1000
    member = str(now_ms)

    async with redis.pipeline(transaction=False) as pipe:
        pipe.zremrangebyscore(key, "-inf", now_ms - window_ms)
        pipe.zadd(key, {member: now_ms})
        pipe.zcard(key)
        pipe.expire(key, window_seconds + 1)
        results = await pipe.execute()

    count: int = results[2]  # zcard result
    if count > max_requests:
        # Remove the entry we just added — we're not serving this request
        await redis.zrem(key, member)
        raise RateLimitError()


def rate_limit(max_requests: int = 60, window_seconds: int = 60, prefix: str = "general"):
    """
    Factory returning a FastAPI dependency.

    Usage:
        @router.post("/login", dependencies=[Depends(rate_limit(10, 60, "auth"))])
    """
    async def dependency(
        request: Request,
        redis: Redis = Depends(get_redis),
    ) -> None:
        await _check_rate_limit(
            request,
            redis,
            max_requests=max_requests,
            window_seconds=window_seconds,
            key_prefix=prefix,
        )

    return dependency
