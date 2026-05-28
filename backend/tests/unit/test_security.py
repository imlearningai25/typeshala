"""
Unit tests for the security module — password hashing and JWT.
Redis pool is patched with fakeredis so no real Redis is needed.
"""
from __future__ import annotations

import pytest
import fakeredis

from app.core.exceptions import AuthenticationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def patch_redis_pool(monkeypatch):
    """
    Patch the module-level Redis pool used by redis_exists / redis_set
    so JWT decode tests don't hit a real Redis server.
    """
    import app.core.redis as redis_module
    fake = fakeredis.FakeAsyncRedis(
        server=fakeredis.FakeServer(), decode_responses=True
    )
    monkeypatch.setattr(redis_module, "_redis_pool", fake)
    yield
    # monkeypatch restores automatically after test


# ── Password ───────────────────────────────────────────────────────────────────

def test_hash_is_non_deterministic():
    """bcrypt salt means same input → different hash each time."""
    h1 = hash_password("secret123")
    h2 = hash_password("secret123")
    assert h1 != h2


def test_verify_correct_password():
    hashed = hash_password("correct-horse-battery")
    assert verify_password("correct-horse-battery", hashed) is True


def test_verify_wrong_password():
    hashed = hash_password("correct-horse-battery")
    assert verify_password("wrong-password", hashed) is False


# ── Access token ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_access_token_roundtrip():
    token = create_access_token("user-123")
    payload = await decode_token(token, expected_type="access")
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"
    assert "jti" in payload


@pytest.mark.asyncio
async def test_access_token_has_extra_claims():
    token = create_access_token("user-abc", extra={"role": "admin"})
    payload = await decode_token(token, expected_type="access")
    assert payload["role"] == "admin"


# ── Refresh token ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_token_roundtrip():
    token = create_refresh_token("user-456")
    payload = await decode_token(token, expected_type="refresh")
    assert payload["sub"] == "user-456"
    assert payload["type"] == "refresh"


# ── Token type validation ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_access_used_as_refresh_raises():
    access = create_access_token("user-789")
    with pytest.raises(AuthenticationError):
        await decode_token(access, expected_type="refresh")


@pytest.mark.asyncio
async def test_refresh_used_as_access_raises():
    refresh = create_refresh_token("user-789")
    with pytest.raises(AuthenticationError):
        await decode_token(refresh, expected_type="access")


# ── Tampering ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_tampered_token_raises():
    token = create_access_token("user-abc")
    tampered = token[:-1] + ("X" if token[-1] != "X" else "Y")
    with pytest.raises(AuthenticationError):
        await decode_token(tampered)
