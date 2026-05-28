"""
Leaderboard service — computes ranked entries from session aggregates.
Results are cached in Redis per (period, language_code) for 2 minutes.
"""
from __future__ import annotations

import json
from uuid import UUID

import redis.asyncio as aioredis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import CacheService
from app.models.language import Language
from app.models.session import TypingSession
from app.models.user import User
from app.schemas.analytics import LeaderboardEntryResponse, LeaderboardResponse

_LB_CACHE_TTL = 120  # 2 minutes
_LB_CACHE_PREFIX = "lb:"


class LeaderboardService:
    def __init__(
        self,
        db: AsyncSession,
        redis: aioredis.Redis | None = None,
    ) -> None:
        self._db = db
        self._cache = CacheService(redis) if redis is not None else None

    async def get_leaderboard(
        self,
        *,
        language_code: str | None = None,
        period: str = "alltime",
        limit: int = 50,
    ) -> LeaderboardResponse:
        cache_key = f"{_LB_CACHE_PREFIX}{period}:{language_code or 'all'}"

        if self._cache:
            raw = await self._cache.get_or_set(
                cache_key,
                lambda: self._fetch_leaderboard(
                    language_code=language_code, period=period, limit=limit
                ),
                ttl=_LB_CACHE_TTL,
            )
            # raw may be a dict (deserialized from JSON) — rebuild the response
            if isinstance(raw, dict):
                return LeaderboardResponse.model_validate(raw)
            return raw

        return await self._fetch_leaderboard(
            language_code=language_code, period=period, limit=limit
        )

    async def _fetch_leaderboard(
        self,
        *,
        language_code: str | None,
        period: str,
        limit: int,
    ) -> dict:
        """Run the aggregate query and return a JSON-serializable dict."""
        from datetime import date, timedelta

        q = (
            select(
                TypingSession.user_id,
                func.avg(TypingSession.wpm).label("avg_wpm"),
                func.max(TypingSession.wpm).label("best_wpm"),
                func.avg(TypingSession.accuracy).label("avg_accuracy"),
                func.count(TypingSession.id).label("total_sessions"),
            )
            .group_by(TypingSession.user_id)
        )

        if period == "weekly":
            since = date.today() - timedelta(days=7)
            q = q.where(func.date(TypingSession.created_at) >= since.isoformat())
        elif period == "monthly":
            since = date.today() - timedelta(days=30)
            q = q.where(func.date(TypingSession.created_at) >= since.isoformat())

        if language_code:
            from app.models.language import Lesson
            q = q.join(Lesson, TypingSession.lesson_id == Lesson.id)
            q = q.join(Language, Lesson.language_id == Language.id)
            q = q.where(Language.code == language_code)

        q = q.order_by(func.avg(TypingSession.wpm).desc()).limit(limit)

        rows = list((await self._db.execute(q)).all())
        total = len(rows)

        if not rows:
            resp = LeaderboardResponse(
                entries=[], total=0, language_code=language_code, period=period
            )
            return resp.model_dump(mode="json")

        user_ids = [r.user_id for r in rows]
        users_result = await self._db.execute(
            select(User).where(User.id.in_(user_ids))
        )
        users = {u.id: u for u in users_result.scalars().all()}

        entries = []
        for rank, row in enumerate(rows, start=1):
            user = users.get(row.user_id)
            if not user:
                continue
            entries.append(
                LeaderboardEntryResponse(
                    rank=rank,
                    user_id=row.user_id,
                    username=user.username,
                    avatar_url=user.avatar_url,
                    level=user.level,
                    avg_wpm=round(float(row.avg_wpm), 2),
                    best_wpm=round(float(row.best_wpm), 2),
                    avg_accuracy=round(float(row.avg_accuracy), 2),
                    total_sessions=row.total_sessions,
                )
            )

        resp = LeaderboardResponse(
            entries=entries,
            total=total,
            language_code=language_code,
            period=period,
        )
        return resp.model_dump(mode="json")
