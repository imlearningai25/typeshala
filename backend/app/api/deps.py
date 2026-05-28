"""
FastAPI dependencies shared across route handlers.

`get_current_user`  — resolves Bearer token → User (raises 401 on failure)
`get_current_admin` — same but also checks role
`get_user_service`  — injects UserService with a DB-backed repository
`get_auth_service`  — injects AuthService with a DB-backed repository
"""
from __future__ import annotations

import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.services.auth import AuthService
from app.services.user import UserService

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate Bearer JWT and return the corresponding User.
    Raises 401 if token is missing, invalid, expired, or blacklisted.
    Raises 401 if user no longer exists or is inactive.
    """
    if not credentials:
        raise AuthenticationError("No credentials provided")

    payload = await decode_token(credentials.credentials, expected_type="access")
    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError("Token missing subject claim")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationError("Invalid user ID in token")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Extend get_current_user with admin role check."""
    if current_user.role not in (UserRole.ADMIN, UserRole.MODERATOR):
        raise AuthorizationError()
    return current_user


# ── Service factories (dependency injection) ───────────────────────────────────

def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_user_service(repo: UserRepository = Depends(get_user_repo)) -> UserService:
    return UserService(repo)


def get_auth_service(repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(repo)
