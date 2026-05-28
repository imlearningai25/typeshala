"""
Auth endpoints:
  POST /auth/register  — create account
  POST /auth/login     — issue tokens
  POST /auth/refresh   — rotate refresh token
  POST /auth/logout    — blacklist current access token
  GET  /auth/me        — shortcut to get own profile
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.deps import get_auth_service, get_current_user, get_user_service
from app.core.rate_limit import rate_limit
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth import AuthService
from app.services.user import UserService

router = APIRouter(tags=["auth"])

_bearer = HTTPBearer(auto_error=False)

# Tighter rate limit on auth endpoints
_auth_limiter = Depends(rate_limit(max_requests=10, window_seconds=60, prefix="auth"))


@router.post(
    "/register",
    response_model=dict,
    status_code=201,
    summary="Register a new user",
    dependencies=[_auth_limiter],
)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    user, tokens = await service.register(data)
    return {
        "user": UserResponse.model_validate(user).model_dump(),
        "tokens": tokens.model_dump(),
    }


@router.post(
    "/login",
    response_model=dict,
    summary="Login with username/email + password",
    dependencies=[_auth_limiter],
)
async def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    user, tokens = await service.login(data)
    return {
        "user": UserResponse.model_validate(user).model_dump(),
        "tokens": tokens.model_dump(),
    }


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh(
    data: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.refresh(data.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout — blacklist current access token",
)
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    service: AuthService = Depends(get_auth_service),
    _current_user: User = Depends(get_current_user),
) -> MessageResponse:
    if credentials:
        payload = await decode_token(credentials.credentials, expected_type="access")
        jti: str = payload["jti"]
        exp: int = payload["exp"]
        await service.logout(jti, exp)
    return MessageResponse(message="Successfully logged out")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get own profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)
