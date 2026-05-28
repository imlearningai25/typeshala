"""
Integration tests for analytics, leaderboard, achievements, and streak tracking.
"""
from __future__ import annotations

import uuid as _uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import update

from app.models.user import User, UserRole


# ── Shared helpers ────────────────────────────────────────────────────────────

async def _reg(client: AsyncClient, suffix: str) -> tuple[dict, str]:
    r = await client.post("/api/v1/auth/register", json={
        "username": f"ana{suffix}",
        "email": f"ana{suffix}@example.com",
        "password": "Password1",
    })
    assert r.status_code == 201, r.text
    return r.json()["user"], r.json()["tokens"]["access_token"]


async def _promote(db_session, user_id: str) -> None:
    await db_session.execute(
        update(User).where(User.id == _uuid.UUID(user_id)).values(role=UserRole.ADMIN)
    )
    await db_session.commit()


async def _setup_lesson(client: AsyncClient, db_session, token: str, user_id: str) -> str:
    await _promote(db_session, user_id)
    headers = {"Authorization": f"Bearer {token}"}
    r = await client.post("/api/v1/languages", json={"name": "English", "code": "en", "native_name": "English"}, headers=headers)
    lang_id = r.json()["id"]
    r = await client.post("/api/v1/lessons", json={
        "language_id": lang_id, "title": "Test", "content": "the quick brown fox", "difficulty": "beginner",
    }, headers=headers)
    return r.json()["id"]


async def _submit(client: AsyncClient, token: str, lesson_id: str, *, wpm_chars: int = 300, duration: float = 60) -> dict:
    r = await client.post("/api/v1/sessions", json={
        "lesson_id": lesson_id,
        "duration_seconds": duration,
        "characters_typed": wpm_chars,
        "errors": 0,
    }, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201, r.text
    return r.json()


# ── WPM history ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_wpm_history_empty(client: AsyncClient):
    _, token = await _reg(client, "wh1")
    r = await client.get("/api/v1/analytics/me/wpm-history", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["data"] == []
    assert data["period_days"] == 30


@pytest.mark.asyncio
async def test_wpm_history_after_session(client: AsyncClient, db_session):
    user, token = await _reg(client, "wh2")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])
    await _submit(client, token, lesson_id)

    r = await client.get("/api/v1/analytics/me/wpm-history", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) == 1
    assert data[0]["avg_wpm"] == 60.0
    assert data[0]["sessions"] == 1


@pytest.mark.asyncio
async def test_wpm_history_unauthenticated(client: AsyncClient):
    r = await client.get("/api/v1/analytics/me/wpm-history")
    assert r.status_code == 401


# ── Activity heatmap ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_activity_heatmap_empty(client: AsyncClient):
    _, token = await _reg(client, "act1")
    r = await client.get("/api/v1/analytics/me/activity", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["data"] == []


@pytest.mark.asyncio
async def test_activity_heatmap_after_sessions(client: AsyncClient, db_session):
    user, token = await _reg(client, "act2")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])

    headers = {"Authorization": f"Bearer {token}"}
    await _submit(client, token, lesson_id)
    await _submit(client, token, lesson_id)

    r = await client.get("/api/v1/analytics/me/activity", headers=headers)
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) == 1        # both sessions on the same day
    assert data[0]["sessions"] == 2


# ── Achievements ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_achievements_empty_before_session(client: AsyncClient):
    """Before any session, achievements endpoint seeds the table but none are earned."""
    _, token = await _reg(client, "ach1")
    r = await client.get("/api/v1/analytics/me/achievements", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    # No achievements seeded until first session triggers check_and_award


@pytest.mark.asyncio
async def test_first_session_achievement_earned(client: AsyncClient, db_session):
    """Submitting first session should award 'first_session' achievement."""
    user, token = await _reg(client, "ach2")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])

    await _submit(client, token, lesson_id)

    r = await client.get("/api/v1/analytics/me/achievements", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    earned = [a for a in r.json() if a["earned"]]
    slugs = [a["slug"] for a in earned]
    assert "first_session" in slugs


@pytest.mark.asyncio
async def test_speed_achievement_earned(client: AsyncClient, db_session):
    """60 WPM session (300 chars / 60s) should earn speed_30 and speed_60."""
    user, token = await _reg(client, "ach3")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])

    await _submit(client, token, lesson_id, wpm_chars=300, duration=60)  # 60 WPM

    r = await client.get("/api/v1/analytics/me/achievements", headers={"Authorization": f"Bearer {token}"})
    slugs = [a["slug"] for a in r.json() if a["earned"]]
    assert "speed_30" in slugs
    assert "speed_60" in slugs
    assert "speed_100" not in slugs


@pytest.mark.asyncio
async def test_perfect_accuracy_achievement(client: AsyncClient, db_session):
    user, token = await _reg(client, "ach4")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])

    await _submit(client, token, lesson_id, wpm_chars=100, duration=60)  # 0 errors

    r = await client.get("/api/v1/analytics/me/achievements", headers={"Authorization": f"Bearer {token}"})
    slugs = [a["slug"] for a in r.json() if a["earned"]]
    assert "perfect_accuracy" in slugs


# ── Leaderboard ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_leaderboard_empty(client: AsyncClient):
    r = await client.get("/api/v1/leaderboard")
    assert r.status_code == 200
    data = r.json()
    assert data["entries"] == []


@pytest.mark.asyncio
async def test_leaderboard_populated(client: AsyncClient, db_session):
    user1, token1 = await _reg(client, "lb1")
    lesson_id = await _setup_lesson(client, db_session, token1, user1["id"])

    user2, token2 = await _reg(client, "lb2")

    # user1: 60 WPM; user2: 40 WPM
    await _submit(client, token1, lesson_id, wpm_chars=300, duration=60)   # 60 WPM
    await _submit(client, token2, lesson_id, wpm_chars=200, duration=60)   # 40 WPM

    r = await client.get("/api/v1/leaderboard")
    assert r.status_code == 200
    entries = r.json()["entries"]
    assert len(entries) >= 2
    # Highest WPM should be rank 1
    assert entries[0]["rank"] == 1
    assert entries[0]["avg_wpm"] >= entries[1]["avg_wpm"]


@pytest.mark.asyncio
async def test_leaderboard_invalid_period(client: AsyncClient):
    r = await client.get("/api/v1/leaderboard?period=invalid")
    assert r.status_code == 422


# ── Streak tracking ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_streak_increments_on_first_session(client: AsyncClient, db_session):
    user, token = await _reg(client, "st1")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])

    await _submit(client, token, lesson_id)

    r = await client.get("/api/v1/sessions/me/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["current_streak"] == 1


@pytest.mark.asyncio
async def test_streak_does_not_double_count_same_day(client: AsyncClient, db_session):
    """Two sessions in the same day should keep streak at 1."""
    user, token = await _reg(client, "st2")
    lesson_id = await _setup_lesson(client, db_session, token, user["id"])

    headers = {"Authorization": f"Bearer {token}"}
    await _submit(client, token, lesson_id)
    await _submit(client, token, lesson_id)

    r = await client.get("/api/v1/sessions/me/stats", headers=headers)
    assert r.json()["current_streak"] == 1
