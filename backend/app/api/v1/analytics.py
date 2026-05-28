"""
Analytics endpoints — personal stats and achievements.

  GET /analytics/me/wpm-history      — daily WPM for last N days
  GET /analytics/me/activity         — daily session count for heatmap
  GET /analytics/me/achievements     — all achievements + earned status
  GET /leaderboard                   — global or per-language ranked list [cached 2 min]
"""
from __future__ import annotations

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.redis import get_redis
from app.models.user import User
from app.schemas.analytics import (
    AchievementResponse,
    ActivityHeatmapResponse,
    LeaderboardResponse,
    WpmHistoryResponse,
)
from app.services.analytics import AnalyticsService
from app.services.leaderboard import LeaderboardService

router = APIRouter()


def _analytics_svc(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


def _leaderboard_svc(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> LeaderboardService:
    return LeaderboardService(db, redis)


@router.get(
    "/analytics/me/wpm-history",
    response_model=WpmHistoryResponse,
    tags=["analytics"],
)
async def wpm_history(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    svc: AnalyticsService = Depends(_analytics_svc),
) -> WpmHistoryResponse:
    return await svc.get_wpm_history(current_user.id, days=days)


@router.get(
    "/analytics/me/activity",
    response_model=ActivityHeatmapResponse,
    tags=["analytics"],
)
async def activity_heatmap(
    days: int = Query(90, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    svc: AnalyticsService = Depends(_analytics_svc),
) -> ActivityHeatmapResponse:
    return await svc.get_activity_heatmap(current_user.id, days=days)


@router.get(
    "/analytics/me/achievements",
    response_model=list[AchievementResponse],
    tags=["analytics"],
)
async def my_achievements(
    current_user: User = Depends(get_current_user),
    svc: AnalyticsService = Depends(_analytics_svc),
) -> list[AchievementResponse]:
    return await svc.get_my_achievements(current_user)


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    tags=["leaderboard"],
)
async def leaderboard(
    language: str | None = Query(None, description="Filter by language code"),
    period: str = Query("alltime", pattern="^(alltime|monthly|weekly)$"),
    limit: int = Query(50, ge=1, le=100),
    svc: LeaderboardService = Depends(_leaderboard_svc),
) -> LeaderboardResponse:
    return await svc.get_leaderboard(
        language_code=language,
        period=period,
        limit=limit,
    )
