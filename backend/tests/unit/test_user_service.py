"""
Unit tests for UserService — uses a real in-memory SQLite DB via conftest fixtures.
"""
from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.repositories.user import UserRepository
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest
from app.services.user import UserService, xp_to_level
from app.core.security import hash_password


# ── XP / Level helper ──────────────────────────────────────────────────────────

def test_xp_to_level_zero():
    assert xp_to_level(0) == 1


def test_xp_to_level_boundaries():
    assert xp_to_level(99) == 1
    assert xp_to_level(100) == 2
    assert xp_to_level(300) == 3
    assert xp_to_level(600) == 4


# ── Profile update ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_profile_full_name(db_session: AsyncSession):
    repo = UserRepository(db_session)
    user = await repo.create(
        username="alice",
        email="alice@example.com",
        hashed_password=hash_password("Password1"),
    )
    service = UserService(repo)
    result = await service.update_profile(user, UpdateProfileRequest(full_name="Alice Smith"))
    assert result.full_name == "Alice Smith"


# ── Change password ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_change_password_success(db_session: AsyncSession):
    repo = UserRepository(db_session)
    user = await repo.create(
        username="bob",
        email="bob@example.com",
        hashed_password=hash_password("OldPass1"),
    )
    service = UserService(repo)
    await service.change_password(
        user,
        ChangePasswordRequest(current_password="OldPass1", new_password="NewPass1"),
    )
    # Fetch again — password should have changed
    updated = await repo.get_by_id(user.id)
    from app.core.security import verify_password
    assert verify_password("NewPass1", updated.hashed_password)


@pytest.mark.asyncio
async def test_change_password_wrong_current(db_session: AsyncSession):
    repo = UserRepository(db_session)
    user = await repo.create(
        username="charlie",
        email="charlie@example.com",
        hashed_password=hash_password("RealPass1"),
    )
    service = UserService(repo)
    with pytest.raises(AuthenticationError):
        await service.change_password(
            user,
            ChangePasswordRequest(current_password="WrongPass", new_password="NewPass1"),
        )
