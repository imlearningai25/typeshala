"""
Business logic for Language and Lesson management.
Language list is cached in Redis for 5 minutes (key: langs:active / langs:all).
Cache is invalidated on create / update / delete.
"""
from __future__ import annotations

import math
from uuid import UUID

import redis.asyncio as aioredis

from app.core.cache import CacheService
from app.core.exceptions import ConflictError, NotFoundError
from app.models.language import DifficultyLevel
from app.repositories.language import LanguageRepository, LessonRepository
from app.schemas.language import (
    CreateLanguageRequest,
    CreateLessonRequest,
    LanguageResponse,
    LessonResponse,
    PaginatedLessonsResponse,
    UpdateLanguageRequest,
    UpdateLessonRequest,
)

_LANG_CACHE_TTL = 300  # 5 minutes
_LANG_CACHE_PREFIX = "langs:"


class LanguageService:
    def __init__(
        self,
        repo: LanguageRepository,
        redis: aioredis.Redis | None = None,
    ) -> None:
        self._repo = repo
        self._cache = CacheService(redis) if redis is not None else None

    async def _invalidate_cache(self) -> None:
        if self._cache:
            await self._cache.invalidate_prefix(_LANG_CACHE_PREFIX)

    async def _build_response_list(self, active_only: bool) -> list[dict]:
        langs = await self._repo.list_all(active_only=active_only)
        result = []
        for lang in langs:
            count = await self._repo.count_lessons(lang.id)
            resp = LanguageResponse.model_validate(lang)
            resp.lesson_count = count
            result.append(resp.model_dump(mode="json"))
        return result

    async def list_languages(self, *, active_only: bool = True) -> list[LanguageResponse]:
        cache_key = f"{_LANG_CACHE_PREFIX}{'active' if active_only else 'all'}"

        if self._cache:
            raw = await self._cache.get_or_set(
                cache_key,
                lambda: self._build_response_list(active_only),
                ttl=_LANG_CACHE_TTL,
            )
            return [LanguageResponse.model_validate(item) for item in raw]

        data = await self._build_response_list(active_only)
        return [LanguageResponse.model_validate(item) for item in data]

    async def get_language(self, code: str) -> LanguageResponse:
        lang = await self._repo.get_by_code(code)
        if not lang:
            raise NotFoundError(f"Language '{code}' not found")
        count = await self._repo.count_lessons(lang.id)
        resp = LanguageResponse.model_validate(lang)
        resp.lesson_count = count
        return resp

    async def create_language(self, data: CreateLanguageRequest) -> LanguageResponse:
        if await self._repo.code_exists(data.code):
            raise ConflictError(f"Language code '{data.code}' already exists")
        lang = await self._repo.create(**data.model_dump())
        await self._invalidate_cache()
        resp = LanguageResponse.model_validate(lang)
        resp.lesson_count = 0
        return resp

    async def update_language(self, code: str, data: UpdateLanguageRequest) -> LanguageResponse:
        lang = await self._repo.get_by_code(code)
        if not lang:
            raise NotFoundError(f"Language '{code}' not found")
        updates = data.model_dump(exclude_none=True)
        lang = await self._repo.update(lang, **updates)
        await self._invalidate_cache()
        count = await self._repo.count_lessons(lang.id)
        resp = LanguageResponse.model_validate(lang)
        resp.lesson_count = count
        return resp

    async def delete_language(self, code: str) -> None:
        lang = await self._repo.get_by_code(code)
        if not lang:
            raise NotFoundError(f"Language '{code}' not found")
        await self._repo.delete(lang)
        await self._invalidate_cache()


class LessonService:
    def __init__(self, repo: LessonRepository, lang_repo: LanguageRepository) -> None:
        self._repo = repo
        self._lang_repo = lang_repo

    def _to_response(self, lesson) -> LessonResponse:
        resp = LessonResponse.model_validate(lesson)
        resp.language_code = lesson.language.code
        resp.language_name = lesson.language.name
        return resp

    async def list_lessons(
        self,
        *,
        language_code: str | None = None,
        difficulty: DifficultyLevel | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedLessonsResponse:
        lang_id: UUID | None = None
        if language_code:
            lang = await self._lang_repo.get_by_code(language_code)
            if not lang:
                raise NotFoundError(f"Language '{language_code}' not found")
            lang_id = lang.id

        lessons, total = await self._repo.list_all(
            language_id=lang_id,
            difficulty=difficulty,
            page=page,
            page_size=page_size,
        )
        return PaginatedLessonsResponse(
            items=[self._to_response(l) for l in lessons],
            total=total,
            page=page,
            page_size=page_size,
            pages=max(1, math.ceil(total / page_size)),
        )

    async def get_lesson(self, lesson_id: UUID) -> LessonResponse:
        lesson = await self._repo.get_by_id(lesson_id)
        if not lesson:
            raise NotFoundError(f"Lesson '{lesson_id}' not found")
        return self._to_response(lesson)

    async def create_lesson(self, data: CreateLessonRequest) -> LessonResponse:
        """Create a lesson. language_id is supplied directly in the request body."""
        lesson = await self._repo.create(**data.model_dump())
        return self._to_response(lesson)

    async def update_lesson(self, lesson_id: UUID, data: UpdateLessonRequest) -> LessonResponse:
        lesson = await self._repo.get_by_id(lesson_id)
        if not lesson:
            raise NotFoundError(f"Lesson '{lesson_id}' not found")
        updates = data.model_dump(exclude_none=True)
        lesson = await self._repo.update(lesson, **updates)
        return self._to_response(lesson)

    async def delete_lesson(self, lesson_id: UUID) -> None:
        lesson = await self._repo.get_by_id(lesson_id)
        if not lesson:
            raise NotFoundError(f"Lesson '{lesson_id}' not found")
        await self._repo.delete(lesson)
