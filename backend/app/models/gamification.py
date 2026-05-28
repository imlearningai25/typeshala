"""
Gamification models: Achievement, UserAchievement, DailyChallenge, LeaderboardEntry.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Achievement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "achievements"

    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False, default="🏅")
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Optional JSON condition string — logic is enforced in code, not the DB
    condition: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<Achievement slug={self.slug!r}>"


class UserAchievement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False
    )


class DailyChallenge(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "daily_challenges"

    challenge_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    lesson_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    target_wpm: Mapped[float] = mapped_column(Float, nullable=False)
    target_accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)


class LeaderboardEntry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "leaderboard_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "period", "period_key", "language_id", name="uq_lb_entry"),
    )

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("languages.id", ondelete="CASCADE"), nullable=True, index=True
    )
    period: Mapped[str] = mapped_column(String(10), nullable=False)  # daily|weekly|monthly|global
    period_key: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "2025-W01"
    wpm: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    sessions: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
