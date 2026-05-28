"""
Analytics service — personal WPM history, activity heatmap, achievements.
"""
from __future__ import annotations

from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import Achievement, UserAchievement
from app.models.session import TypingSession
from app.models.user import User
from app.schemas.analytics import (
    AchievementResponse,
    ActivityDay,
    ActivityHeatmapResponse,
    WpmDataPoint,
    WpmHistoryResponse,
)


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_wpm_history(self, user_id: UUID, days: int = 30) -> WpmHistoryResponse:
        since = date.today() - timedelta(days=days)

        result = await self._db.execute(
            select(
                func.date(TypingSession.created_at).label("day"),
                func.avg(TypingSession.wpm).label("avg_wpm"),
                func.max(TypingSession.wpm).label("best_wpm"),
                func.count(TypingSession.id).label("sessions"),
            )
            .where(
                TypingSession.user_id == user_id,
                func.date(TypingSession.created_at) >= since.isoformat(),
            )
            .group_by(func.date(TypingSession.created_at))
            .order_by(func.date(TypingSession.created_at))
        )

        data = [
            WpmDataPoint(
                date=str(row.day),
                avg_wpm=round(float(row.avg_wpm), 2),
                best_wpm=round(float(row.best_wpm), 2),
                sessions=row.sessions,
            )
            for row in result
        ]
        return WpmHistoryResponse(data=data, period_days=days)

    async def get_activity_heatmap(self, user_id: UUID, days: int = 90) -> ActivityHeatmapResponse:
        since = date.today() - timedelta(days=days)

        result = await self._db.execute(
            select(
                func.date(TypingSession.created_at).label("day"),
                func.count(TypingSession.id).label("sessions"),
                func.coalesce(func.sum(TypingSession.duration_seconds), 0).label("total_seconds"),
            )
            .where(
                TypingSession.user_id == user_id,
                func.date(TypingSession.created_at) >= since.isoformat(),
            )
            .group_by(func.date(TypingSession.created_at))
            .order_by(func.date(TypingSession.created_at))
        )

        data = [
            ActivityDay(
                date=str(row.day),
                sessions=row.sessions,
                total_minutes=round(float(row.total_seconds) / 60, 2),
            )
            for row in result
        ]
        return ActivityHeatmapResponse(data=data, period_days=days)

    async def get_my_achievements(self, user: User) -> list[AchievementResponse]:
        # All available achievements
        all_result = await self._db.execute(
            select(Achievement).where(Achievement.is_active.is_(True)).order_by(Achievement.name)
        )
        all_achievements = list(all_result.scalars().all())

        # User's earned achievements
        earned_result = await self._db.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == user.id)
        )
        earned = {ua.achievement_id: ua for ua in earned_result.scalars().all()}

        return [
            AchievementResponse(
                id=ach.id,
                slug=ach.slug,
                name=ach.name,
                description=ach.description,
                icon=ach.icon,
                xp_reward=ach.xp_reward,
                earned=ach.id in earned,
                earned_at=earned[ach.id].created_at.isoformat() if ach.id in earned else None,
            )
            for ach in all_achievements
        ]
