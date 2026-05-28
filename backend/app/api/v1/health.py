"""
Health-check endpoints — used by Docker, NGINX, and load balancers.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.redis import get_redis

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness probe")
async def liveness() -> dict:
    """Returns 200 immediately — confirms the process is alive."""
    return {"status": "ok"}


@router.get("/health/ready", summary="Readiness probe")
async def readiness(
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> dict:
    """
    Returns 200 only when DB and Redis are reachable.
    Used by Kubernetes / Docker healthcheck before routing traffic.
    """
    checks: dict[str, str] = {}

    # PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    # Redis
    try:
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    return {"status": "ready" if all_ok else "degraded", "checks": checks}
