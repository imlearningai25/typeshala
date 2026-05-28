"""
User management endpoints:
  GET    /users/me               - own profile
  PATCH  /users/me               - update own profile
  POST   /users/me/password      - change own password
  GET    /users/{username}       - public profile
  GET    /users                  - paginated user list (admin only)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    get_current_admin,
    get_current_user,
    get_user_service,
)
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import (
    ChangePasswordRequest,
    PaginatedUsersResponse,
    PublicUserResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.user import UserService

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserResponse, summary="Get own full profile")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse, summary="Update own profile")
async def update_my_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    return await service.update_profile(current_user, data)


@router.post(
    "/me/password",
    response_model=MessageResponse,
    summary="Change own password",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> MessageResponse:
    await service.change_password(current_user, data)
    return MessageResponse(message="Password updated successfully")


@router.get(
    "/{username}",
    response_model=PublicUserResponse,
    summary="Get public profile by username",
)
async def get_user_profile(
    username: str,
    service: UserService = Depends(get_user_service),
) -> PublicUserResponse:
    return await service.get_public_profile(username)


@router.get(
    "",
    response_model=PaginatedUsersResponse,
    summary="List users (admin only)",
    dependencies=[Depends(get_current_admin)],
)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    service: UserService = Depends(get_user_service),
) -> PaginatedUsersResponse:
    return await service.list_users(page=page, page_size=page_size, search=search)
