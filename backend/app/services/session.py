"""
Typing session service — metrics computation and session persistence.

WPM formula  : (characters_typed / 5) / (duration_seconds / 60)
Accuracy     : ((chars - errors) / chars) * 100  [0–100]
Consistency  : 100 - (std_dev_wpm / avg_wpm * 100) clamped to [0, 100]
               Derived from per-keystroke WPM samples in raw_keystrokes.
               Falls back to 100 if no keystroke data is provided.
CPM          : characters_typed / (duration_seconds / 60)
"""
from __future__ import annotations

import math
import statistics
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.session import SessionRepository
from app.repositories.language import LessonRepository
from app.schemas.session import (
    PaginatedSessionsResponse,
    SessionResponse,
    SubmitSessionRequest,
    UserStatsResponse,
)
from app.services.user import UserService


def compute_wpm(characters_typed: int, duration_seconds: float) -> float:
    """Standard WPM: (chars / 5) / minutes."""
    if duration_seconds <= 0:
        return 0.0
    minutes = duration_seconds / 60
    return round((characters_typed / 5) / minutes, 2)


def compute_accuracy(characters_typed: int, errors: int) -> float:
    """Accuracy as percentage [0–100]."""
    if characters_typed == 0:
        return 100.0
    correct = max(0, characters_typed - errors)
    return round((correct / characters_typed) * 100, 2)


def compute_consistency(
    raw_keystrokes: list | None,
    overall_wpm: float,
) -> float:
    """
    Consistency based on variation in inter-keystroke WPM samples.
    Returns a value 0–100 where 100 = perfectly consistent.
    If no keystroke data is provided, returns 100 (benefit of the doubt).
    """
    if not raw_keystrokes or len(raw_keystrokes) < 5:
        return 100.0

    events = sorted(raw_keystrokes, key=lambda k: k.timestamp_ms)
    start_ms = events[0].timestamp_ms
    window_ms = 5_000
    samples: list[float] = []
    window_chars = 0
    window_start = start_ms

    for evt in events:
        if evt.timestamp_ms - window_start >= window_ms:
            elapsed_min = (evt.timestamp_ms - window_start) / 60_000
            if elapsed_min > 0:
                samples.append((window_chars / 5) / elapsed_min)
            window_start = evt.timestamp_ms
            window_chars = 0
        if evt.correct:
            window_chars += 1

    if len(samples) < 2:
        return 100.0

    avg = statistics.mean(samples)
    if avg == 0:
        return 100.0

    stdev = statistics.stdev(samples)
    cv = (stdev / avg) * 100
    return round(max(0.0, min(100.0, 100.0 - cv)), 2)


def compute_cpm(characters_typed: int, duration_seconds: float) -> float:
    if duration_seconds <= 0:
        return 0.0
    return round(characters_typed / (duration_seconds / 60), 2)


class SessionService:
    def __init__(
        self,
        session_repo: SessionRepository,
        lesson_repo: LessonRepository,
        user_service: UserService,
        db_session: AsyncSession,
    ) -> None:
        self._sessions = session_repo
        self._lessons = lesson_repo
        self._users = user_service
        self._db = db_session

    async def submit_session(
        self,
        data: SubmitSessionRequest,
        current_user: User,
    ) -> SessionResponse:
        from app.services.streak import update_streak
        from app.services.achievement import check_and_award

        # Validate lesson exists
        lesson = await self._lessons.get_by_id(data.lesson_id)
        if not lesson or not lesson.is_active:
            raise NotFoundError(f"Lesson '{data.lesson_id}' not found")

        wpm = compute_wpm(data.characters_typed, data.duration_seconds)
        accuracy = compute_accuracy(data.characters_typed, data.errors)
        consistency = compute_consistency(data.raw_keystrokes, wpm)
        cpm = compute_cpm(data.characters_typed, data.duration_seconds)

        # XP reward: base 10 + accuracy bonus + WPM bonus
        xp_earned = int(10 + (accuracy / 10) + (wpm / 5))

        ts = await self._sessions.create(
            user_id=current_user.id,
            lesson_id=data.lesson_id,
            duration_seconds=data.duration_seconds,
            characters_typed=data.characters_typed,
            errors=data.errors,
            wpm=wpm,
            accuracy=accuracy,
            consistency=consistency,
            characters_per_minute=cpm,
            xp_earned=xp_earned,
            details={
                "keystroke_count": len(data.raw_keystrokes) if data.raw_keystrokes else 0,
            },
        )

        # Award base XP
        await self._users.add_xp(current_user, xp_earned)

        # Update streak
        await update_streak(self._db, current_user)

        # Count total sessions for achievement checks
        _, total_sessions = await self._sessions.list_by_user(current_user.id, page=1, page_size=1)

        # Check and award achievements (may add bonus XP)
        await check_and_award(
            self._db,
            current_user,
            wpm=wpm,
            accuracy=accuracy,
            total_sessions=total_sessions,
        )

        await self._db.flush()

        return SessionResponse.model_validate(ts)

    async def get_my_sessions(
        self,
        user_id: UUID,
        *,
        lesson_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedSessionsResponse:
        items, total = await self._sessions.list_by_user(
            user_id,
            lesson_id=lesson_id,
            page=page,
            page_size=page_size,
        )
        return PaginatedSessionsResponse(
            items=[SessionResponse.model_validate(s) for s in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=math.ceil(total / page_size) if total else 0,
        )

    async def get_my_stats(self, user: User) -> UserStatsResponse:
        aggregates = await self._sessions.get_user_aggregates(user.id)
        return UserStatsResponse(
            **aggregates,
            current_streak=user.current_streak,
            longest_streak=user.longest_streak,
            total_xp=user.total_xp,
            level=user.level,
        )
