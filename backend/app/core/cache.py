"""
Redis-backed cache service.

Usage:
    svc = CacheService(redis_client)
    result = await svc.get_or_set("key", factory_coroutine, ttl=300)
    await svc.invalidate_prefix("langs:")
"""
from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    # ── Core helpers ───────────────────────────────────────────────────────────

    async def get(self, key: str) -> Any | None:
        raw = await self._r.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return raw

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        await self._r.set(key, json.dumps(value, default=str), ex=ttl)

    async def delete(self, key: str) -> None:
        await self._r.delete(key)

    async def invalidate_prefix(self, prefix: str) -> int:
        """Delete all keys matching prefix* — use carefully (O(N) scan)."""
        keys: list[str] = []
        async for key in self._r.scan_iter(match=f"{prefix}*"):
            keys.append(key)
        if keys:
            await self._r.delete(*keys)
        logger.debug("cache invalidated %d keys with prefix '%s'", len(keys), prefix)
        return len(keys)

    # ── get-or-set pattern ─────────────────────────────────────────────────────

    async def get_or_set(
        self,
        key: str,
        factory: Callable[[], Awaitable[T]],
        *,
        ttl: int = 300,
    ) -> T:
        """
        Return cached value if present; otherwise call factory(),
        cache the result for `ttl` seconds, and return it.
        """
        cached = await self.get(key)
        if cached is not None:
            logger.debug("cache HIT  key='%s'", key)
            return cached  # type: ignore[return-value]

        logger.debug("cache MISS key='%s' — fetching from source", key)
        value = await factory()
        await self.set(key, value, ttl=ttl)
        return value
