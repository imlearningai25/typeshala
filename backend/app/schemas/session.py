"""
Pydantic schemas for TypingSession recording and retrieval.
"""
from __future__ import annotations

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


# ── Session submission ─────────────────────────────────────────────────────────

class KeystrokeEvent(BaseModel):
    """Single keystroke captured on the frontend."""
    timestamp_ms: int = Field(..., ge=0)
    expected: str
    actual: str
    correct: bool


class SubmitSessionRequest(BaseModel):
    lesson_id: UUID
    duration_seconds: float = Field(..., gt=0, le=7200)
    characters_typed: int = Field(..., ge=0)
    errors: int = Field(..., ge=0)
    raw_keystrokes: list[KeystrokeEvent] | None = Field(
        default=None,
        description="Optional keystroke log for detailed analytics",
    )

    @model_validator(mode="after")
    def errors_cannot_exceed_chars(self) -> "SubmitSessionRequest":
        if self.errors > self.characters_typed:
            raise ValueError("errors cannot exceed characters_typed")
        return self


# ── Session response ───────────────────────────────────────────────────────────

class SessionMetrics(BaseModel):
    """Derived performance metrics — computed server-side."""
    wpm: float
    accuracy: float          # 0–100
    consistency: float       # 0–100 (higher = more consistent)
    characters_per_minute: float


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    lesson_id: UUID
    duration_seconds: float
    characters_typed: int
    errors: int
    wpm: float
    accuracy: float
    consistency: float
    characters_per_minute: float
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedSessionsResponse(BaseModel):
    items: list[SessionResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ── Leaderboard / stats ────────────────────────────────────────────────────────

class UserStatsResponse(BaseModel):
    total_sessions: int
    total_time_seconds: float
    average_wpm: float
    best_wpm: float
    average_accuracy: float
    current_streak: int
    longest_streak: int
    total_xp: int
    level: int
