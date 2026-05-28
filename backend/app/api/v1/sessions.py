"""
Typing session endpoints.

  POST /sessions            — submit a completed session (auth required)
  GET  /sessions/me         — my session history (auth required)
  GET  /sessions/me/stats   — my aggregate stats (auth required)
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_user_service
from app.core.metrics import sessions_counter, wpm_histogram, accuracy_histogram
from app.models.user import User
from app.repositories.language import LessonRepository
from app.repositories.session import SessionRepository
from app.schemas.session import (
    PaginatedSessionsResponse,
    SessionResponse,
    SubmitSessionRequest,
    UserStatsResponse,
)
from app.services.session import SessionService
from app.services.user import UserService

router = APIRouter()


def _session_service(
    db: AsyncSession = Depends(get_db),
    user_svc: UserService = Depends(get_user_service),
) -> SessionService:
    return SessionService(SessionRepository(db), LessonRepository(db), user_svc, db)


@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["sessions"],
)
async def submit_session(
    data: SubmitSessionRequest,
    current_user: User = Depends(get_current_user),
    svc: SessionService = Depends(_session_service),
) -> SessionResponse:
    result = await svc.submit_session(data, current_user)

    # ── Prometheus metrics ─────────────────────────────────────────────────────
    # language_code comes back on the response via the joined lesson
    lang_code = getattr(result, "language_code", "unknown") or "unknown"
    sessions_counter.labels(language_code=lang_code).inc()
    wpm_histogram.observe(result.wpm)
    accuracy_histogram.observe(result.accuracy)

    return result


@router.get("/sessions/me", response_model=PaginatedSessionsResponse, tags=["sessions"])
async def my_sessions(
    lesson_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    svc: SessionService = Depends(_session_service),
) -> PaginatedSessionsResponse:
    return await svc.get_my_sessions(
        current_user.id,
        lesson_id=lesson_id,
        page=page,
        page_size=page_size,
    )


@router.get("/sessions/me/stats", response_model=UserStatsResponse, tags=["sessions"])
async def my_stats(
    current_user: User = Depends(get_current_user),
    svc: SessionService = Depends(_session_service),
) -> UserStatsResponse:
    return await svc.get_my_stats(current_user)
