"""
Repository for Language and Lesson models.
Pure DB layer — no business logic.
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.language import DifficultyLevel, Language, Lesson


class LanguageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, language_id: UUID) -> Language | None:
        result = await self._session.execute(
            select(Language).where(Language.id == language_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Language | None:
        result = await self._session.execute(
            select(Language).where(Language.code == code)
        )
        return result.scalar_one_or_none()

    async def list_all(self, *, active_only: bool = True) -> list[Language]:
        q = select(Language)
        if active_only:
            q = q.where(Language.is_active.is_(True))
        q = q.order_by(Language.name)
        result = await self._session.execute(q)
        return list(result.scalars().all())

    async def code_exists(self, code: str, exclude_id: UUID | None = None) -> bool:
        q = select(func.count()).select_from(Language).where(Language.code == code)
        if exclude_id:
            q = q.where(Language.id != exclude_id)
        result = await self._session.execute(q)
        return (result.scalar_one() or 0) > 0

    async def count_lessons(self, language_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Lesson)
            .where(Lesson.language_id == language_id, Lesson.is_active.is_(True))
        )
        return result.scalar_one() or 0

    async def create(self, **kwargs: object) -> Language:
        lang = Language(**kwargs)
        self._session.add(lang)
        await self._session.flush()
        await self._session.refresh(lang)
        return lang

    async def update(self, language: Language, **kwargs: object) -> Language:
        for key, value in kwargs.items():
            setattr(language, key, value)
        await self._session.flush()
        await self._session.refresh(language)
        return language

    async def delete(self, language: Language) -> None:
        await self._session.delete(language)
        await self._session.flush()


class LessonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, lesson_id: UUID) -> Lesson | None:
        result = await self._session.execute(
            select(Lesson)
            .options(selectinload(Lesson.language))
            .where(Lesson.id == lesson_id)
        )
        return result.scalar_one_or_none()

    async def list_by_language(
        self,
        language_id: UUID,
        *,
        difficulty: DifficultyLevel | None = None,
        active_only: bool = True,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Lesson], int]:
        q = (
            select(Lesson)
            .options(selectinload(Lesson.language))
            .where(Lesson.language_id == language_id)
        )
        if active_only:
            q = q.where(Lesson.is_active.is_(True))
        if difficulty:
            q = q.where(Lesson.difficulty == difficulty)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self._session.execute(count_q)).scalar_one() or 0

        q = q.order_by(Lesson.order_index, Lesson.created_at)
        q = q.offset((page - 1) * page_size).limit(page_size)
        items = list((await self._session.execute(q)).scalars().all())
        return items, total

    async def list_all(
        self,
        *,
        language_id: UUID | None = None,
        difficulty: DifficultyLevel | None = None,
        active_only: bool = True,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Lesson], int]:
        q = select(Lesson).options(selectinload(Lesson.language))
        if active_only:
            q = q.where(Lesson.is_active.is_(True))
        if language_id:
            q = q.where(Lesson.language_id == language_id)
        if difficulty:
            q = q.where(Lesson.difficulty == difficulty)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self._session.execute(count_q)).scalar_one() or 0

        q = q.order_by(Lesson.order_index, Lesson.created_at)
        q = q.offset((page - 1) * page_size).limit(page_size)
        items = list((await self._session.execute(q)).scalars().all())
        return items, total

    async def create(self, **kwargs: object) -> Lesson:
        lesson = Lesson(**kwargs)
        self._session.add(lesson)
        await self._session.flush()
        await self._session.refresh(lesson, ["language"])
        return lesson

    async def update(self, lesson: Lesson, **kwargs: object) -> Lesson:
        for key, value in kwargs.items():
            setattr(lesson, key, value)
        await self._session.flush()
        await self._session.refresh(lesson, ["language"])
        return lesson

    async def delete(self, lesson: Lesson) -> None:
        await self._session.delete(lesson)
        await self._session.flush()
