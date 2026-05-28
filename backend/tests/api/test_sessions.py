"""
Integration tests for /sessions/* endpoints.
"""
from __future__ import annotations

import uuid as _uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import update

from app.models.user import User, UserRole


async def _register_login(client: AsyncClient, suffix: str) -> tuple[dict, str]:
    r = await client.post("/api/v1/auth/register", json={
        "username": f"typist{suffix}",
        "email": f"typist{suffix}@example.com",
        "password": "Password1",
    })
    assert r.status_code == 201
    data = r.json()
    return data["user"], data["tokens"]["access_token"]


async def _promote_to_admin(db_session, user_id: str) -> None:
    await db_session.execute(
        update(User)
        .where(User.id == _uuid.UUID(user_id))
        .values(role=UserRole.ADMIN)
    )
    await db_session.commit()


async def _create_lang_and_lesson(client: AsyncClient, db_session, token: str, user_id: str) -> str:
    """Promote user to admin, create language + lesson, return lesson_id."""
    await _promote_to_admin(db_session, user_id)

    headers = {"Authorization": f"Bearer {token}"}
    r = await client.post("/api/v1/languages", json={
        "name": "English", "code": "en", "native_name": "English",
    }, headers=headers)
    assert r.status_code == 201
    lang_id = r.json()["id"]

    r = await client.post("/api/v1/lessons", json={
        "language_id": lang_id,
        "title": "Test Lesson",
        "content": "the quick brown fox jumps over the lazy dog",
        "difficulty": "beginner",
    }, headers=headers)
    assert r.status_code == 201
    return r.json()["id"]


# ── Session submission ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_submit_session_unauthenticated(client: AsyncClient):
    r = await client.post("/api/v1/sessions", json={
        "lesson_id": str(_uuid.uuid4()),
        "duration_seconds": 30,
        "characters_typed": 50,
        "errors": 2,
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_submit_session_nonexistent_lesson(client: AsyncClient):
    _, token = await _register_login(client, "alpha")
    r = await client.post(
        "/api/v1/sessions",
        json={
            "lesson_id": str(_uuid.uuid4()),
            "duration_seconds": 30,
            "characters_typed": 50,
            "errors": 2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_submit_session_errors_exceed_chars(client: AsyncClient):
    _, token = await _register_login(client, "beta")
    r = await client.post(
        "/api/v1/sessions",
        json={
            "lesson_id": str(_uuid.uuid4()),
            "duration_seconds": 30,
            "characters_typed": 10,
            "errors": 20,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_submit_session_success(client: AsyncClient, db_session):
    user, token = await _register_login(client, "gamma")
    lesson_id = await _create_lang_and_lesson(client, db_session, token, user["id"])

    r = await client.post(
        "/api/v1/sessions",
        json={
            "lesson_id": lesson_id,
            "duration_seconds": 60,
            "characters_typed": 200,
            "errors": 5,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["wpm"] > 0
    assert 0 <= data["accuracy"] <= 100
    assert data["lesson_id"] == lesson_id


@pytest.mark.asyncio
async def test_submit_session_metrics_correct(client: AsyncClient, db_session):
    """WPM and accuracy must match the expected formulas."""
    user, token = await _register_login(client, "delta")
    lesson_id = await _create_lang_and_lesson(client, db_session, token, user["id"])

    # 300 chars, 0 errors, 60 seconds → WPM = (300/5)/1 = 60, accuracy = 100%
    r = await client.post(
        "/api/v1/sessions",
        json={
            "lesson_id": lesson_id,
            "duration_seconds": 60.0,
            "characters_typed": 300,
            "errors": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["wpm"] == 60.0
    assert data["accuracy"] == 100.0


# ── Session history ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_my_sessions_empty(client: AsyncClient):
    _, token = await _register_login(client, "epsilon")
    r = await client.get(
        "/api/v1/sessions/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 0


@pytest.mark.asyncio
async def test_my_sessions_after_submit(client: AsyncClient, db_session):
    user, token = await _register_login(client, "zeta")
    lesson_id = await _create_lang_and_lesson(client, db_session, token, user["id"])

    headers = {"Authorization": f"Bearer {token}"}

    for _ in range(2):
        await client.post("/api/v1/sessions", json={
            "lesson_id": lesson_id,
            "duration_seconds": 45,
            "characters_typed": 150,
            "errors": 3,
        }, headers=headers)

    r = await client.get("/api/v1/sessions/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["total"] == 2


@pytest.mark.asyncio
async def test_my_stats_empty(client: AsyncClient):
    _, token = await _register_login(client, "eta")
    r = await client.get(
        "/api/v1/sessions/me/stats",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total_sessions"] == 0
    assert data["average_wpm"] == 0.0


@pytest.mark.asyncio
async def test_my_stats_after_session(client: AsyncClient, db_session):
    user, token = await _register_login(client, "theta")
    lesson_id = await _create_lang_and_lesson(client, db_session, token, user["id"])

    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/v1/sessions", json={
        "lesson_id": lesson_id,
        "duration_seconds": 60,
        "characters_typed": 300,
        "errors": 0,
    }, headers=headers)

    r = await client.get("/api/v1/sessions/me/stats", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total_sessions"] == 1
    assert data["best_wpm"] == 60.0
    assert data["average_accuracy"] == 100.0
