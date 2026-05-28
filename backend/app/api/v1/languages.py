"""
Language and Lesson endpoints.

Public (no auth required):
  GET  /languages               — list active languages  [cached 5 min]
  GET  /languages/{code}        — get one language
  GET  /lessons                 — list lessons (filterable)
  GET  /lessons/{id}            — get one lesson

Admin only:
  POST   /languages             — create language  (cache invalidated)
  PATCH  /languages/{code}      — update language  (cache invalidated)
  DELETE /languages/{code}      — delete language  (cache invalidated)
  POST   /lessons               — create lesson
  PATCH  /lessons/{id}          — update lesson
  DELETE /lessons/{id}          — delete lesson
"""
from __future__ import annotations

from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_db
from app.core.redis import get_redis
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
from app.services.language import LanguageService, LessonService

router = APIRouter()


# ── Dependency helpers ─────────────────────────────────────────────────────────

def _lang_service(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> LanguageService:
    return LanguageService(LanguageRepository(db), redis)


def _lesson_service(db: AsyncSession = Depends(get_db)) -> LessonService:
    return LessonService(LessonRepository(db), LanguageRepository(db))


# ── Language endpoints ─────────────────────────────────────────────────────────

@router.get("/languages", response_model=list[LanguageResponse], tags=["languages"])
async def list_languages(
    svc: LanguageService = Depends(_lang_service),
) -> list[LanguageResponse]:
    return await svc.list_languages()


@router.get("/languages/{code}", response_model=LanguageResponse, tags=["languages"])
async def get_language(
    code: str,
    svc: LanguageService = Depends(_lang_service),
) -> LanguageResponse:
    return await svc.get_language(code)


@router.post(
    "/languages",
    response_model=LanguageResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["languages"],
    dependencies=[Depends(get_current_admin)],
)
async def create_language(
    data: CreateLanguageRequest,
    svc: LanguageService = Depends(_lang_service),
) -> LanguageResponse:
    return await svc.create_language(data)


@router.patch(
    "/languages/{code}",
    response_model=LanguageResponse,
    tags=["languages"],
    dependencies=[Depends(get_current_admin)],
)
async def update_language(
    code: str,
    data: UpdateLanguageRequest,
    svc: LanguageService = Depends(_lang_service),
) -> LanguageResponse:
    return await svc.update_language(code, data)


@router.delete(
    "/languages/{code}",
    tags=["languages"],
    dependencies=[Depends(get_current_admin)],
)
async def delete_language(
    code: str,
    svc: LanguageService = Depends(_lang_service),
) -> Response:
    await svc.delete_language(code)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Lesson endpoints ───────────────────────────────────────────────────────────

@router.get("/lessons", response_model=PaginatedLessonsResponse, tags=["lessons"])
async def list_lessons(
    language: str | None = Query(None, description="Filter by language code"),
    difficulty: DifficultyLevel | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: LessonService = Depends(_lesson_service),
) -> PaginatedLessonsResponse:
    return await svc.list_lessons(
        language_code=language,
        difficulty=difficulty,
        page=page,
        page_size=page_size,
    )


@router.get("/lessons/{lesson_id}", response_model=LessonResponse, tags=["lessons"])
async def get_lesson(
    lesson_id: UUID,
    svc: LessonService = Depends(_lesson_service),
) -> LessonResponse:
    return await svc.get_lesson(lesson_id)


@router.post(
    "/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["lessons"],
    dependencies=[Depends(get_current_admin)],
)
async def create_lesson(
    data: CreateLessonRequest,
    svc: LessonService = Depends(_lesson_service),
) -> LessonResponse:
    return await svc.create_lesson(data)


@router.patch(
    "/lessons/{lesson_id}",
    response_model=LessonResponse,
    tags=["lessons"],
    dependencies=[Depends(get_current_admin)],
)
async def update_lesson(
    lesson_id: UUID,
    data: UpdateLessonRequest,
    svc: LessonService = Depends(_lesson_service),
) -> LessonResponse:
    return await svc.update_lesson(lesson_id, data)


@router.delete(
    "/lessons/{lesson_id}",
    tags=["lessons"],
    dependencies=[Depends(get_current_admin)],
)
async def delete_lesson(
    lesson_id: UUID,
    svc: LessonService = Depends(_lesson_service),
) -> Response:
    await svc.delete_lesson(lesson_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
