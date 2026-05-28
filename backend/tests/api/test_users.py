"""
Integration tests for /users/* endpoints.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _register_and_login(client: AsyncClient, suffix: str = "") -> tuple[dict, str]:
    """Register a user and return (user_data, access_token)."""
    payload = {
        "username": f"user{suffix}",
        "email": f"user{suffix}@example.com",
        "password": "Password1",
    }
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    return data["user"], data["tokens"]["access_token"]


# -- GET /users/me -------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_own_profile(client: AsyncClient):
    user, token = await _register_and_login(client, "alpha")
    r = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["username"] == "useralpha"


@pytest.mark.asyncio
async def test_get_own_profile_unauthenticated(client: AsyncClient):
    r = await client.get("/api/v1/users/me")
    assert r.status_code == 401


# -- PATCH /users/me -----------------------------------------------------------

@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient):
    _, token = await _register_and_login(client, "beta")
    r = await client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Beta User"},
    )
    assert r.status_code == 200
    assert r.json()["full_name"] == "Beta User"


@pytest.mark.asyncio
async def test_update_profile_partial(client: AsyncClient):
    """Sending only avatar_url must not overwrite full_name set earlier."""
    _, token = await _register_and_login(client, "gamma")
    headers = {"Authorization": f"Bearer {token}"}

    await client.patch("/api/v1/users/me", headers=headers, json={"full_name": "Gamma"})
    r = await client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"avatar_url": "https://example.com/avatar.png"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["full_name"] == "Gamma"
    assert data["avatar_url"] == "https://example.com/avatar.png"


# -- POST /users/me/password ---------------------------------------------------

@pytest.mark.asyncio
async def test_change_password(client: AsyncClient):
    _, token = await _register_and_login(client, "delta")
    r = await client.post(
        "/api/v1/users/me/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Password1", "new_password": "NewPass99"},
    )
    assert r.status_code == 200
    assert r.json()["message"] == "Password updated successfully"


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient):
    _, token = await _register_and_login(client, "epsilon")
    r = await client.post(
        "/api/v1/users/me/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "WrongOld1", "new_password": "NewPass99"},
    )
    assert r.status_code == 401


# -- GET /users/{username} -----------------------------------------------------

@pytest.mark.asyncio
async def test_get_public_profile(client: AsyncClient):
    await _register_and_login(client, "zeta")
    r = await client.get("/api/v1/users/userzeta")
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "userzeta"
    # Public profile must NOT expose email
    assert "email" not in data


@pytest.mark.asyncio
async def test_get_nonexistent_user(client: AsyncClient):
    r = await client.get("/api/v1/users/nobody_here")
    assert r.status_code == 404
