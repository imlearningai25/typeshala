"""
FastAPI application factory.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import AppException
from app.core.logging import configure_logging, get_logger
from app.core.middleware import register_middleware
from app.core.redis import close_redis_pool, get_redis_pool
from app.database import engine

logger = get_logger(__name__)


def _init_sentry() -> None:
    """Initialise Sentry SDK — no-op if SENTRY_DSN is empty."""
    if not settings.SENTRY_DSN:
        logger.info("Sentry DSN not set — error tracking disabled")
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            release=f"typeshala@{settings.APP_VERSION}",
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,
        )
        logger.info("Sentry initialised (env=%s)", settings.ENVIRONMENT)
    except ImportError:
        logger.warning("sentry-sdk not installed — skipping Sentry init")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    configure_logging()
    _init_sentry()

    logger.info(
        "Starting %s v%s [%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )

    # Warm up Redis pool
    await get_redis_pool()
    logger.info("Redis pool initialised")

    yield  # ← application runs here

    # Teardown
    await close_redis_pool()
    await engine.dispose()
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.APP_VERSION,
        docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
        openapi_url="/api/openapi.json" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # ── Middleware ─────────────────────────────────────────────────────────────
    register_middleware(app)

    # ── Exception handlers ─────────────────────────────────────────────────────
    @app.exception_handler(AppException)
    async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error": type(exc).__name__},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    # ── Routers ────────────────────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # ── Prometheus metrics ─────────────────────────────────────────────────────
    try:
        from app.core.metrics import create_instrumentator
        instrumentator = create_instrumentator()
        instrumentator.instrument(app).expose(
            app,
            endpoint="/metrics",
            include_in_schema=False,
        )
        logger.info("Prometheus /metrics endpoint mounted")
    except ImportError:
        logger.warning("prometheus-fastapi-instrumentator not installed — metrics disabled")

    return app


app = create_app()
