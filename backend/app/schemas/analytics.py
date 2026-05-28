"""
Schemas for analytics and leaderboard endpoints.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel


# ── Analytics ─────────────────────────────────────────────────────────────────

class WpmDataPoint(BaseModel):
    date: str          # ISO date string "2025-05-01"
    avg_wpm: float
    best_wpm: float
    sessions: int


class WpmHistoryResponse(BaseModel):
    data: list[WpmDataPoint]
    period_days: int


class ActivityDay(BaseModel):
    date: str          # ISO date string
    sessions: int
    total_minutes: float


class ActivityHeatmapResponse(BaseModel):
    data: list[ActivityDay]
    period_days: int


class AchievementResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str
    icon: str
    xp_reward: int
    earned: bool
    earned_at: str | None = None

    model_config = {"from_attributes": True}


# ── Leaderboard ───────────────────────────────────────────────────────────────

class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: UUID
    username: str
    avatar_url: str | None
    level: int
    avg_wpm: float
    best_wpm: float
    avg_accuracy: float
    total_sessions: int


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntryResponse]
    total: int
    language_code: str | None
    period: str   # "alltime" | "monthly" | "weekly"
