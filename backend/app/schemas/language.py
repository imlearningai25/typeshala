"""
Pydantic schemas for Language and Lesson resources.
"""
from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.language import DifficultyLevel


# ── Language ───────────────────────────────────────────────────────────────────

class CreateLanguageRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=2, max_length=10, pattern=r"^[a-z]{2,10}$")
    native_name: str = Field(default="", max_length=100)
    description: str | None = Field(None, max_length=500)
    flag_emoji: str | None = Field(None, max_length=10)
    keyboard_layout: str = Field(default="qwerty", max_length=50)
    direction: str = Field(default="ltr", pattern=r"^(ltr|rtl)$")


class UpdateLanguageRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    native_name: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)
    flag_emoji: str | None = Field(None, max_length=10)
    keyboard_layout: str | None = Field(None, max_length=50)
    direction: str | None = Field(None, pattern=r"^(ltr|rtl)$")
    is_active: bool | None = None


class LanguageResponse(BaseModel):
    id: UUID
    code: str
    name: str
    native_name: str
    description: str | None
    flag_emoji: str | None
    keyboard_layout: str
    direction: str
    is_active: bool
    lesson_count: int = 0

    model_config = {"from_attributes": True}


# ── Lesson ─────────────────────────────────────────────────────────────────────

class CreateLessonRequest(BaseModel):
    language_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=10, max_length=5000)
    difficulty: DifficultyLevel
    order_index: int = Field(default=0, ge=0)
    description: str | None = Field(None, max_length=500)
    time_limit_seconds: int | None = Field(None, ge=10, le=3600)


class UpdateLessonRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, min_length=10, max_length=5000)
    difficulty: DifficultyLevel | None = None
    order_index: int | None = Field(None, ge=0)
    description: str | None = Field(None, max_length=500)
    time_limit_seconds: int | None = Field(None, ge=10, le=3600)
    is_active: bool | None = None


class LessonResponse(BaseModel):
    id: UUID
    language_id: UUID
    title: str
    content: str
    difficulty: DifficultyLevel
    order_index: int
    description: str | None
    time_limit_seconds: int | None
    is_active: bool
    language_code: str | None = None
    language_name: str | None = None

    model_config = {"from_attributes": True}


class PaginatedLessonsResponse(BaseModel):
    items: list[LessonResponse]
    total: int
    page: int
    page_size: int
    pages: int
