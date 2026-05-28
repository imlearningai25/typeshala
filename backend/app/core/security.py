"""
Security utilities:
  - Bcrypt password hashing / verification
  - JWT access + refresh token creation / decoding
  - Redis-backed token blacklist (logout + rotation)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.core.exceptions import AuthenticationError, TokenBlacklistedError, TokenExpiredError
from app.core.redis import redis_delete, redis_exists, redis_set

# ── Password ────────────────────────────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ── JWT ─────────────────────────────────────────────────────────────────────────
TokenType = Literal["access", "refresh"]

_BLACKLIST_PREFIX = "blacklist:"
_REFRESH_PREFIX = "refresh:"


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    """Create a short-lived JWT access token."""
    expire = _now_utc() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": _now_utc(),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Create a long-lived refresh token and store its jti in Redis."""
    jti = str(uuid.uuid4())
    expire = _now_utc() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "exp": expire,
        "iat": _now_utc(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def decode_token(token: str, expected_type: TokenType = "access") -> dict[str, Any]:
    """
    Decode and validate a JWT.
    Raises typed exceptions instead of raw JWTError so the API layer
    can return consistent HTTP responses.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        if "expired" in str(exc).lower():
            raise TokenExpiredError() from exc
        raise AuthenticationError() from exc

    if payload.get("type") != expected_type:
        raise AuthenticationError("Invalid token type")

    jti: str = payload.get("jti", "")
    if await redis_exists(f"{_BLACKLIST_PREFIX}{jti}"):
        raise TokenBlacklistedError()

    return payload


async def blacklist_token(jti: str, ttl_seconds: int) -> None:
    """Add a token JTI to the blacklist with TTL matching its expiry."""
    await redis_set(f"{_BLACKLIST_PREFIX}{jti}", "1", ex=ttl_seconds)


async def rotate_refresh_token(old_token: str) -> tuple[str, str]:
    """
    Validate the incoming refresh token, blacklist it, and issue a new pair.
    Implements refresh-token rotation — each refresh token is single-use.
    """
    payload = await decode_token(old_token, expected_type="refresh")
    subject: str = payload["sub"]
    old_jti: str = payload["jti"]
    exp: int = payload["exp"]

    # Remaining TTL of the old token
    remaining_ttl = max(0, exp - int(_now_utc().timestamp()))
    await blacklist_token(old_jti, remaining_ttl)

    new_access = create_access_token(subject)
    new_refresh = create_refresh_token(subject)
    return new_access, new_refresh
