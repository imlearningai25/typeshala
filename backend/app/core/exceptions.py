"""
Domain-specific exceptions with HTTP status codes.
FastAPI exception handlers are registered in main.py.
"""
from __future__ import annotations

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base class for all application exceptions."""

    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(status_code=status_code, detail=detail)


# ── Auth ───────────────────────────────────────────────────────────────────────
class AuthenticationError(AppException):
    def __init__(self, detail: str = "Could not validate credentials") -> None:
        super().__init__(detail, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(AppException):
    def __init__(self, detail: str = "Insufficient permissions") -> None:
        super().__init__(detail, status.HTTP_403_FORBIDDEN)


class TokenExpiredError(AppException):
    def __init__(self) -> None:
        super().__init__("Token has expired", status.HTTP_401_UNAUTHORIZED)


class TokenBlacklistedError(AppException):
    def __init__(self) -> None:
        super().__init__("Token has been revoked", status.HTTP_401_UNAUTHORIZED)


# ── Resource ───────────────────────────────────────────────────────────────────
class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(f"{resource} not found", status.HTTP_404_NOT_FOUND)


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(detail, status.HTTP_409_CONFLICT)


# ── Validation ─────────────────────────────────────────────────────────────────
class ValidationError(AppException):
    def __init__(self, detail: str = "Validation failed") -> None:
        super().__init__(detail, status.HTTP_422_UNPROCESSABLE_ENTITY)


# ── Rate Limit ─────────────────────────────────────────────────────────────────
class RateLimitError(AppException):
    def __init__(self) -> None:
        super().__init__("Too many requests. Please slow down.", status.HTTP_429_TOO_MANY_REQUESTS)
