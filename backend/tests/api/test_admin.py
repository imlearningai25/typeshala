"""
Integration tests for /admin/* endpoints.
"""
from __future__ import annotations

import uuid as _uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import update

from app.models.user import User, UserRole


async def _reg(client: AsyncClient, suffix: str) -> tuple[dict, str]:
    r = await client.post("/api/v1/auth/register", json={
        "username": f"adm{suffix}",
        "email": f"adm{suffix}@example.com",
        "password": "Password1",
    })
    assert r.status_code == 201, r.text
    return r.json()["user"], r.json()["tokens"]["access_token"]


async def _promote(db_session, user_id: str) -> None:
    await db_session.execute(
        update(User).where(User.id == _uuid.UUID(user_id)).values(role=UserRole.ADMIN)
    )
    await db_session.commit()


# ── Auth guards ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_stats_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/admin/stats")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_stats_requires_admin_role(client: AsyncClient):
    _, token = await _reg(client, "guard1")
    r = await client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_users_list_requires_admin(client: AsyncClient):
    _, token = await _reg(client, "guard2")
    r = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


# ── System stats ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_system_stats_zero_state(client: AsyncClient, db_session):
    user, token = await _reg(client, "stats1")
    await _promote(db_session, user["id"])

    r = await client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["total_users"] >= 1
    assert data["active_users"] >= 1
    assert data["total_sessions"] == 0
    assert data["total_languages"] == 0
    assert data["total_lessons"] == 0


@pytest.mark.asyncio
async def test_system_stats_after_content(client: AsyncClient, db_session):
    user, token = await _reg(client, "stats2")
    await _promote(db_session, user["id"])
    headers = {"Authorization": f"Bearer {token}"}

    # Create a language + lesson
    r = await client.post("/api/v1/languages", json={"name": "English", "code": "en", "native_name": "English"}, headers=headers)
    lang_id = r.json()["id"]
    await client.post("/api/v1/lessons", json={
        "language_id": lang_id, "title": "Test", "content": "hello world test",
        "difficulty": "beginner",
    }, headers=headers)

    r = await client.get("/api/v1/admin/stats", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total_languages"] == 1
    assert data["total_lessons"] == 1


# ── User management ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_users(client: AsyncClient, db_session):
    admin, token = await _reg(client, "lu1")
    await _promote(db_session, admin["id"])

    # Register two more users
    await _reg(client, "lu2")
    await _reg(client, "lu3")

    r = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 3
    assert len(data["items"]) >= 3


@pytest.mark.asyncio
async def test_list_users_search(client: AsyncClient, db_session):
    admin, token = await _reg(client, "ls1")
    await _promote(db_session, admin["id"])
    await _reg(client, "unique_name_xyz")

    r = await client.get(
        "/api/v1/admin/users?search=unique_name",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] >= 1
    assert any("unique_name" in u["username"] for u in r.json()["items"])


@pytest.mark.asyncio
async def test_promote_user_to_admin(client: AsyncClient, db_session):
    admin, admin_token = await _reg(client, "pu1")
    await _promote(db_session, admin["id"])

    regular, _ = await _reg(client, "pu2")

    r = await client.patch(
        f"/api/v1/admin/users/{regular['id']}/role",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_demote_admin_to_user(client: AsyncClient, db_session):
    admin, admin_token = await _reg(client, "dm1")
    await _promote(db_session, admin["id"])

    target, _ = await _reg(client, "dm2")
    await _promote(db_session, target["id"])

    r = await client.patch(
        f"/api/v1/admin/users/{target['id']}/role",
        json={"role": "user"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "user"


@pytest.mark.asyncio
async def test_deactivate_user(client: AsyncClient, db_session):
    admin, admin_token = await _reg(client, "da1")
    await _promote(db_session, admin["id"])

    target, _ = await _reg(client, "da2")

    r = await client.patch(
        f"/api/v1/admin/users/{target['id']}/active",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["is_active"] is False


@pytest.mark.asyncio
async def test_update_nonexistent_user_role(client: AsyncClient, db_session):
    admin, token = await _reg(client, "ne1")
    await _promote(db_session, admin["id"])

    r = await client.patch(
        f"/api/v1/admin/users/{_uuid.uuid4()}/role",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_invalid_role_value(client: AsyncClient, db_session):
    admin, token = await _reg(client, "iv1")
    await _promote(db_session, admin["id"])

    r = await client.patch(
        f"/api/v1/admin/users/{admin['id']}/role",
        json={"role": "superuser"},   # invalid enum
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422
