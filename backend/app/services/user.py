"""
UserService — business logic for user profile management.
"""
from __future__ import annotations

import math
import uuid

from app.core.exceptions import AuthenticationError, NotFoundError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import (
    ChangePasswordRequest,
    PaginatedUsersResponse,
    PublicUserResponse,
    UpdateProfileRequest,
    UserResponse,
)

# XP required to reach each level (index = level)
_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]


def xp_to_level(xp: int) -> int:
    """Return the level for a given XP total."""
    level = 1
    for threshold in _LEVEL_THRESHOLDS[1:]:
        if xp >= threshold:
            level += 1
        else:
            break
    return min(level, len(_LEVEL_THRESHOLDS))


class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    async def get_profile(self, user_id: uuid.UUID) -> UserResponse:
        user = await self._repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")
        return UserResponse.model_validate(user)

    async def get_public_profile(self, username: str) -> PublicUserResponse:
        user = await self._repo.get_by_username(username)
        if not user:
            raise NotFoundError("User")
        return PublicUserResponse.model_validate(user)

    async def update_profile(
        self, user: User, data: UpdateProfileRequest
    ) -> UserResponse:
        updates = data.model_dump(exclude_none=True)
        updated = await self._repo.update(user, **updates)
        return UserResponse.model_validate(updated)

    async def change_password(
        self, user: User, data: ChangePasswordRequest
    ) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise AuthenticationError("Current password is incorrect")
        await self._repo.update(user, hashed_password=hash_password(data.new_password))

    async def add_xp(self, user: User, amount: int) -> User:
        """Award XP and recalculate level."""
        new_xp = user.total_xp + amount
        new_level = xp_to_level(new_xp)
        return await self._repo.update(user, total_xp=new_xp, level=new_level)

    async def list_users(
        self, *, page: int = 1, page_size: int = 20, search: str | None = None
    ) -> PaginatedUsersResponse:
        users, total = await self._repo.list_users(page=page, page_size=page_size, search=search)
        return PaginatedUsersResponse(
            items=[PublicUserResponse.model_validate(u) for u in users],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )
