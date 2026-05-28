"""
Integration tests for /languages/* and /lessons/* endpoints.
"""
from __future__ import annotations

import uuid as _uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import update

from app.models.user import User, UserRole


# ── Shared helper ─────────────────────────────────────────────────────────────

async def _promote_to_admin(db_session, user_id: str) -> None:
    """Promote user to admin via direct DB manipulation (SQLite-safe UUID conversion)."""
    await db_session.execute(
        update(User)
        .where(User.id == _uuid.UUID(user_id))
        .values(role=UserRole.ADMIN)
    )
    await db_session.commit()


LANG_PAYLOAD = {
    "name": "English",
    "code": "en",
    "native_name": "English",
    "flag_emoji": "🇬🇧",
}

LESSON_PAYLOAD = {
    "title": "Home Row Keys",
    "content": "asdf jkl; asdf jkl; the quick brown fox",
    "difficulty": "beginner",
    "order_index": 1,
    "description": "Practice the home row",
}


# ── Language public endpoints ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_languages_empty(client: AsyncClient):
    r = await client.get("/api/v1/languages")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_language_requires_admin(client: AsyncClient):
    r = await client.post("/api/v1/languages", json=LANG_PAYLOAD)
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_nonexistent_language(client: AsyncClient):
    r = await client.get("/api/v1/languages/xx")
    assert r.status_code == 404


# ── Lesson public endpoints ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_lessons_empty(client: AsyncClient):
    r = await client.get("/api/v1/lessons")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_nonexistent_lesson(client: AsyncClient):
    r = await client.get(f"/api/v1/lessons/{_uuid.uuid4()}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_create_lesson_requires_admin(client: AsyncClient):
    r = await client.post("/api/v1/lessons", json={
        **LESSON_PAYLOAD,
        "language_id": str(_uuid.uuid4()),
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_list_lessons_filter_by_nonexistent_language(client: AsyncClient):
    r = await client.get("/api/v1/lessons?language=nope")
    assert r.status_code == 404


# ── Admin language CRUD ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_can_create_and_retrieve_language(
    client: AsyncClient, db_session
):
    r = await client.post("/api/v1/auth/register", json={
        "username": "langadmin",
        "email": "langadmin@example.com",
        "password": "Admin1234",
    })
    assert r.status_code == 201
    token = r.json()["tokens"]["access_token"]
    user_id = r.json()["user"]["id"]

    await _promote_to_admin(db_session, user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    r = await client.post("/api/v1/languages", json=LANG_PAYLOAD, headers=headers)
    assert r.status_code == 201
    lang = r.json()
    assert lang["code"] == "en"
    assert lang["lesson_count"] == 0

    # Get one
    r = await client.get("/api/v1/languages/en")
    assert r.status_code == 200
    assert r.json()["name"] == "English"

    # List all
    r = await client.get("/api/v1/languages")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # Duplicate code → 409
    r = await client.post("/api/v1/languages", json=LANG_PAYLOAD, headers=headers)
    assert r.status_code == 409

    # Update
    r = await client.patch("/api/v1/languages/en", json={"flag_emoji": "🇺🇸"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["flag_emoji"] == "🇺🇸"

    # Delete
    r = await client.delete("/api/v1/languages/en", headers=headers)
    assert r.status_code == 204

    # Gone
    r = await client.get("/api/v1/languages/en")
    assert r.status_code == 404


# ── Admin lesson CRUD ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_can_create_lesson(client: AsyncClient, db_session):
    r = await client.post("/api/v1/auth/register", json={
        "username": "lessonadmin",
        "email": "lessonadmin@example.com",
        "password": "Admin1234",
    })
    token = r.json()["tokens"]["access_token"]
    user_id = r.json()["user"]["id"]
    await _promote_to_admin(db_session, user_id)

    headers = {"Authorization": f"Bearer {token}"}

    # Prerequisite: create a language
    r = await client.post("/api/v1/languages", json=LANG_PAYLOAD, headers=headers)
    lang_id = r.json()["id"]

    # Create lesson
    r = await client.post("/api/v1/lessons", json={
        **LESSON_PAYLOAD,
        "language_id": lang_id,
    }, headers=headers)
    assert r.status_code == 201
    lesson = r.json()
    assert lesson["title"] == "Home Row Keys"
    assert lesson["language_code"] == "en"
    lesson_id = lesson["id"]

    # Public retrieval (no auth)
    r = await client.get(f"/api/v1/lessons/{lesson_id}")
    assert r.status_code == 200

    # Paginated list
    r = await client.get("/api/v1/lessons")
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # Filter by language code
    r = await client.get("/api/v1/lessons?language=en")
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # Filter by difficulty match
    r = await client.get("/api/v1/lessons?difficulty=beginner")
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # Filter by difficulty no-match
    r = await client.get("/api/v1/lessons?difficulty=advanced")
    assert r.status_code == 200
    assert r.json()["total"] == 0

    # Update lesson
    r = await client.patch(f"/api/v1/lessons/{lesson_id}", json={"title": "Updated Title"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"

    # Delete lesson
    r = await client.delete(f"/api/v1/lessons/{lesson_id}", headers=headers)
    assert r.status_code == 204

    r = await client.get(f"/api/v1/lessons/{lesson_id}")
    assert r.status_code == 404
