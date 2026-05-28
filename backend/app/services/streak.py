"""
Streak tracking logic.

Rules:
  - A "practice day" is any calendar day (UTC) where the user submits ≥1 session.
  - current_streak increments when today is the next consecutive day.
  - If user skips a day the streak resets to 1.
  - longest_streak is updated whenever current_streak exceeds it.
"""
from __future__ import annotations

from datetime import date, timezone, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import TypingSession
from app.models.user import User


async def update_streak(session: AsyncSession, user: User) -> User:
    """
    Called after a new TypingSession is persisted.
    Queries the two most recent *distinct practice days* for this user,
    then updates current_streak / longest_streak in-place (no flush — caller flushes).
    """
    # Fetch last 2 distinct practice days (most recent first)
    result = await session.execute(
        select(func.date(TypingSession.created_at).label("day"))
        .where(TypingSession.user_id == user.id)
        .group_by(func.date(TypingSession.created_at))
        .order_by(func.date(TypingSession.created_at).desc())
        .limit(2)
    )
    days: list[str] = [row.day for row in result]

    today = date.today().isoformat()

    if not days or days[0] != today:
        # No session today yet (shouldn't happen, but guard)
        return user

    if len(days) == 1:
        # First-ever session
        user.current_streak = 1
    else:
        prev_day = date.fromisoformat(days[1])
        today_date = date.fromisoformat(today)
        gap = (today_date - prev_day).days

        if gap == 1:
            user.current_streak = user.current_streak + 1
        elif gap > 1:
            user.current_streak = 1
        # gap == 0 means multiple sessions same day — streak unchanged

    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak

    return user
