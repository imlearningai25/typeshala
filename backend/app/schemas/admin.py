"""
Admin-specific schemas.
"""
from __future__ import annotations

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class SystemStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_sessions: int
    total_languages: int
    total_lessons: int
    total_achievements_awarded: int


class AdminUserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    total_xp: int
    level: int
    current_streak: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedAdminUsersResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserActiveRequest(BaseModel):
    is_active: bool
