"""
Integration tests for /auth/* endpoints.
Uses the AsyncClient + in-memory SQLite from conftest.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


# ── Helpers ────────────────────────────────────────────────────────────────────

REGISTER_PAYLOAD = {
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "Password1",
}


async def _register(client: AsyncClient, payload: dict | None = None) -> dict:
    payload = payload or REGISTER_PAYLOAD
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def _login(client: AsyncClient, username: str = "testuser", password: str = "Password1") -> dict:
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


# ── Register ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    data = await _register(client)
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "testuser@example.com"
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert "hashed_password" not in data["user"]


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    await _register(client)
    r = await client.post("/api/v1/auth/register", json={
        **REGISTER_PAYLOAD,
        "email": "other@example.com",
    })
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await _register(client)
    r = await client.post("/api/v1/auth/register", json={
        **REGISTER_PAYLOAD,
        "username": "differentuser",
    })
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "no_digits_here",  # fails strength check
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_username(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={
        "username": "bad username!",  # spaces and ! not allowed
        "email": "x@example.com",
        "password": "Password1",
    })
    assert r.status_code == 422


# ── Login ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_with_username(client: AsyncClient):
    await _register(client)
    data = await _login(client)
    assert data["user"]["username"] == "testuser"
    assert "access_token" in data["tokens"]


@pytest.mark.asyncio
async def test_login_with_email(client: AsyncClient):
    await _register(client)
    data = await _login(client, username="testuser@example.com")
    assert data["user"]["username"] == "testuser"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await _register(client)
    r = await client.post("/api/v1/auth/login", json={
        "username": "testuser",
        "password": "WrongPassword1",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={
        "username": "nobody",
        "password": "Password1",
    })
    assert r.status_code == 401


# ── Protected endpoint ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_me_with_valid_token(client: AsyncClient):
    await _register(client)
    login_data = await _login(client)
    access_token = login_data["tokens"]["access_token"]

    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert r.status_code == 200
    assert r.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_get_me_without_token(client: AsyncClient):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_invalid_token(client: AsyncClient):
    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.valid.token"},
    )
    assert r.status_code == 401


# ── Refresh ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    await _register(client)
    login_data = await _login(client)
    refresh_token = login_data["tokens"]["refresh_token"]

    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    # New refresh token must differ from the old one (rotation)
    assert data["refresh_token"] != refresh_token


@pytest.mark.asyncio
async def test_refresh_token_single_use(client: AsyncClient):
    """After rotation, the old refresh token must be blacklisted."""
    await _register(client)
    login_data = await _login(client)
    refresh_token = login_data["tokens"]["refresh_token"]

    # First refresh — ok
    r1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r1.status_code == 200

    # Reusing the same refresh token — must fail
    r2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r2.status_code == 401


# ── Logout ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_logout_success(client: AsyncClient):
    await _register(client)
    login_data = await _login(client)
    access_token = login_data["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    r = await client.post("/api/v1/auth/logout", headers=headers)
    assert r.status_code == 200
    assert r.json()["message"] == "Successfully logged out"


@pytest.mark.asyncio
async def test_logout_blacklists_token(client: AsyncClient):
    """After logout, the access token must no longer be usable."""
    await _register(client)
    login_data = await _login(client)
    access_token = login_data["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    await client.post("/api/v1/auth/logout", headers=headers)

    # Attempt to use the same token after logout
    r = await client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 401
