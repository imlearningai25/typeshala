"""
Language and Lesson models — the core content layer.
"""
from __future__ import annotations

from enum import Enum as PyEnum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DifficultyLevel(str, PyEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Language(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Supported typing languages (English, Nepali, Hindi, …)."""

    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    native_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    flag_emoji: Mapped[str | None] = mapped_column(String(10), nullable=True)
    keyboard_layout: Mapped[str] = mapped_column(String(50), nullable=False, default="qwerty")
    direction: Mapped[str] = mapped_column(String(3), nullable=False, default="ltr")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    lessons: Mapped[list["Lesson"]] = relationship("Lesson", back_populates="language")

    def __repr__(self) -> str:
        return f"<Language code={self.code!r} name={self.name!r}>"


class Lesson(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single typing practice lesson belonging to a language."""

    __tablename__ = "lessons"

    language_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("languages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel, name="difficultylevel", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DifficultyLevel.BEGINNER,
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    language: Mapped["Language"] = relationship("Language", back_populates="lessons")

    def __repr__(self) -> str:
        return f"<Lesson id={self.id} title={self.title!r}>"
