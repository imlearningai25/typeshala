"""
AuthService — orchestrates registration, login, logout, and token refresh.

Business logic lives here; no SQL in this layer.
"""
from __future__ import annotations

from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    rotate_refresh_token,
    verify_password,
    blacklist_token,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    async def register(self, data: RegisterRequest) -> tuple[User, TokenResponse]:
        """Create a new user account and return tokens immediately."""
        # Guard against duplicates
        if await self._repo.username_exists(data.username):
            raise ConflictError("Username is already taken")
        if await self._repo.email_exists(data.email):
            raise ConflictError("Email address is already registered")

        user = await self._repo.create(
            username=data.username,
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        tokens = self._issue_tokens(str(user.id))
        return user, tokens

    async def login(self, data: LoginRequest) -> tuple[User, TokenResponse]:
        """Authenticate with username or email + password."""
        user = await self._repo.get_by_username_or_email(data.username)
        if not user or not verify_password(data.password, user.hashed_password):
            # Use identical error message to prevent username enumeration
            raise AuthenticationError("Invalid credentials")
        if not user.is_active:
            raise AuthenticationError("Account is disabled")

        tokens = self._issue_tokens(str(user.id))
        return user, tokens

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Rotate refresh token — old one is blacklisted, new pair issued."""
        new_access, new_refresh = await rotate_refresh_token(refresh_token)
        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
        )

    async def logout(self, access_token_jti: str, access_token_exp: int) -> None:
        """
        Blacklist the current access token so it cannot be reused
        until it would have expired naturally.
        """
        import time

        remaining = max(0, access_token_exp - int(time.time()))
        await blacklist_token(access_token_jti, remaining)

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _issue_tokens(user_id: str) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )
