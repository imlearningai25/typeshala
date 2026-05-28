"""
Repository for TypingSession model.
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import TypingSession


class SessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, session_id: UUID) -> TypingSession | None:
        result = await self._session.execute(
            select(TypingSession).where(TypingSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: UUID,
        *,
        lesson_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[TypingSession], int]:
        q = select(TypingSession).where(TypingSession.user_id == user_id)
        if lesson_id:
            q = q.where(TypingSession.lesson_id == lesson_id)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self._session.execute(count_q)).scalar_one() or 0

        q = q.order_by(TypingSession.created_at.desc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        items = list((await self._session.execute(q)).scalars().all())
        return items, total

    async def get_user_aggregates(self, user_id: UUID) -> dict:
        """Aggregate stats for a user across all sessions."""
        result = await self._session.execute(
            select(
                func.count(TypingSession.id).label("total_sessions"),
                func.coalesce(func.sum(TypingSession.duration_seconds), 0).label("total_time"),
                func.coalesce(func.avg(TypingSession.wpm), 0).label("avg_wpm"),
                func.coalesce(func.max(TypingSession.wpm), 0).label("best_wpm"),
                func.coalesce(func.avg(TypingSession.accuracy), 0).label("avg_accuracy"),
            ).where(TypingSession.user_id == user_id)
        )
        row = result.one()
        return {
            "total_sessions": row.total_sessions,
            "total_time_seconds": float(row.total_time),
            "average_wpm": round(float(row.avg_wpm), 2),
            "best_wpm": round(float(row.best_wpm), 2),
            "average_accuracy": round(float(row.avg_accuracy), 2),
        }

    async def create(self, **kwargs: object) -> TypingSession:
        ts = TypingSession(**kwargs)
        self._session.add(ts)
        await self._session.flush()
        await self._session.refresh(ts)
        return ts
