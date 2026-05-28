"""
Achievement engine — checks milestones after every session and awards badges.

Milestones checked (slug → condition):
  first_session      — any completed session
  speed_30           — wpm >= 30
  speed_60           — wpm >= 60
  speed_100          — wpm >= 100
  perfect_accuracy   — accuracy == 100.0
  streak_7           — current_streak >= 7
  streak_30          — current_streak >= 30
  sessions_10        — total_sessions >= 10
  sessions_100       — total_sessions >= 100
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import Achievement, UserAchievement
from app.models.session import TypingSession
from app.models.user import User


@dataclass
class _Rule:
    slug: str
    name: str
    description: str
    xp_reward: int
    icon: str


_RULES: list[_Rule] = [
    _Rule("first_session",    "First Steps",        "Complete your first session",         50,  "🎯"),
    _Rule("speed_30",         "Getting Faster",     "Reach 30 WPM",                        100, "⚡"),
    _Rule("speed_60",         "Touch Typist",       "Reach 60 WPM",                        250, "🚀"),
    _Rule("speed_100",        "Speed Demon",        "Reach 100 WPM",                       500, "🔥"),
    _Rule("perfect_accuracy", "Flawless",           "Complete a session with 100% accuracy",200, "💎"),
    _Rule("streak_7",         "Week Warrior",       "Maintain a 7-day streak",             150, "📅"),
    _Rule("streak_30",        "Monthly Master",     "Maintain a 30-day streak",            500, "🏆"),
    _Rule("sessions_10",      "Committed",          "Complete 10 sessions",                100, "📚"),
    _Rule("sessions_100",     "Century",            "Complete 100 sessions",               1000,"🎖️"),
]

_RULES_BY_SLUG = {r.slug: r for r in _RULES}


async def _ensure_achievements_seeded(session: AsyncSession) -> dict[str, Achievement]:
    """Lazily seed Achievement rows if they don't exist yet."""
    result = await session.execute(select(Achievement))
    existing = {a.slug: a for a in result.scalars().all()}

    for rule in _RULES:
        if rule.slug not in existing:
            ach = Achievement(
                slug=rule.slug,
                name=rule.name,
                description=rule.description,
                xp_reward=rule.xp_reward,
                icon=rule.icon,
                is_active=True,
            )
            session.add(ach)
            existing[rule.slug] = ach

    await session.flush()
    return existing


async def _already_awarded(session: AsyncSession, user_id, achievement_id) -> bool:
    result = await session.execute(
        select(func.count())
        .select_from(UserAchievement)
        .where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        )
    )
    return (result.scalar_one() or 0) > 0


async def check_and_award(
    session: AsyncSession,
    user: User,
    wpm: float,
    accuracy: float,
    total_sessions: int,
) -> list[str]:
    """
    Evaluate all milestone rules against the just-completed session context.
    Awards any newly earned achievements and returns their slugs.
    """
    achievements = await _ensure_achievements_seeded(session)
    awarded: list[str] = []

    async def award(slug: str) -> None:
        ach = achievements.get(slug)
        if ach and not await _already_awarded(session, user.id, ach.id):
            session.add(UserAchievement(user_id=user.id, achievement_id=ach.id))
            # Bonus XP for achievement
            user.total_xp = user.total_xp + ach.xp_reward
            awarded.append(slug)

    if total_sessions >= 1:
        await award("first_session")
    if wpm >= 30:
        await award("speed_30")
    if wpm >= 60:
        await award("speed_60")
    if wpm >= 100:
        await award("speed_100")
    if accuracy >= 100.0:
        await award("perfect_accuracy")
    if user.current_streak >= 7:
        await award("streak_7")
    if user.current_streak >= 30:
        await award("streak_30")
    if total_sessions >= 10:
        await award("sessions_10")
    if total_sessions >= 100:
        await award("sessions_100")

    await session.flush()
    return awarded
