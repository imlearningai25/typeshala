"""
v1 API router — registers all sub-routers.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import admin, analytics, auth, health, languages, sessions, users

api_router = APIRouter()

# Core
api_router.include_router(health.router)

# Phase 2: Auth + Users
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(users.router, prefix="/users")

# Phase 3: Languages / Lessons / Sessions
api_router.include_router(languages.router)
api_router.include_router(sessions.router)

# Phase 4: Analytics + Leaderboard
api_router.include_router(analytics.router)

# Phase 5: Admin
api_router.include_router(admin.router)
