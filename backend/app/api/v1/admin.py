"""
Admin-only endpoints.

All routes require admin role (via get_current_admin dependency).

  GET   /admin/stats                  — platform-wide stats
  GET   /admin/users                  — paginated user list with search
  PATCH /admin/users/{user_id}/role   — change a user's role
  PATCH /admin/users/{user_id}/active — toggle user active status
"""
from __future__ import annotations

import uuid as _uuid
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_db
from app.models.gamification import Achievement, UserAchievement
from app.models.language import Language, Lesson
from app.models.session import TypingSession
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserResponse,
    PaginatedAdminUsersResponse,
    SystemStatsResponse,
    UpdateUserActiveRequest,
    UpdateUserRoleRequest,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── System stats ──────────────────────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=SystemStatsResponse,
    dependencies=[Depends(get_current_admin)],
)
async def system_stats(db: AsyncSession = Depends(get_db)) -> SystemStatsResponse:
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    active_users = (await db.execute(
        select(func.count()).select_from(User).where(User.is_active.is_(True))
    )).scalar_one()
    total_sessions = (await db.execute(select(func.count()).select_from(TypingSession))).scalar_one()
    total_languages = (await db.execute(select(func.count()).select_from(Language))).scalar_one()
    total_lessons = (await db.execute(select(func.count()).select_from(Lesson))).scalar_one()
    total_awarded = (await db.execute(select(func.count()).select_from(UserAchievement))).scalar_one()

    return SystemStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_sessions=total_sessions,
        total_languages=total_languages,
        total_lessons=total_lessons,
        total_achievements_awarded=total_awarded,
    )


# ── User management ───────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=PaginatedAdminUsersResponse,
    dependencies=[Depends(get_current_admin)],
)
async def list_users(
    search: str | None = Query(None, description="Search by username or email"),
    role: UserRole | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedAdminUsersResponse:
    q = select(User).order_by(User.created_at.desc())
    if search:
        q = q.where(
            User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        q = q.where(User.role == role)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one() or 0
    items = list((await db.execute(q.offset((page - 1) * page_size).limit(page_size))).scalars().all())

    return PaginatedAdminUsersResponse(
        items=[AdminUserResponse.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total else 0,
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
    dependencies=[Depends(get_current_admin)],
)
async def update_user_role(
    user_id: _uuid.UUID,
    data: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = data.role
    await db.flush()
    await db.refresh(user)
    return AdminUserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/active",
    response_model=AdminUserResponse,
    dependencies=[Depends(get_current_admin)],
)
async def update_user_active(
    user_id: _uuid.UUID,
    data: UpdateUserActiveRequest,
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = data.is_active
    await db.flush()
    await db.refresh(user)
    return AdminUserResponse.model_validate(user)
