"""
Pydantic schemas for User request/response shapes.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserResponse(BaseModel):
    """Full user profile — returned to the owner."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    username: str
    email: EmailStr
    full_name: str | None
    avatar_url: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    total_xp: int
    level: int
    current_streak: int
    longest_streak: int
    created_at: datetime
    updated_at: datetime


class PublicUserResponse(BaseModel):
    """Minimal public profile — safe to expose to other users."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    username: str
    full_name: str | None
    avatar_url: str | None
    total_xp: int
    level: int
    current_streak: int


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=500)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class PaginatedUsersResponse(BaseModel):
    items: list[PublicUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
