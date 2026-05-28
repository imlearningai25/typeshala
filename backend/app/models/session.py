"""
TypingSession — stores one completed typing session per user.
Uses SQLAlchemy's dialect-agnostic JSON type so tests can use SQLite.
"""
from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TypingSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "typing_sessions"

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Core metrics
    wpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    consistency: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    characters_per_minute: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    characters_typed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # JSON works across both PostgreSQL (stored as JSONB-like text) and SQLite
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<TypingSession id={self.id} wpm={self.wpm} accuracy={self.accuracy}>"
