"""
Pytest fixtures shared across all tests.

  - SQLite in-memory DB  : no Postgres Docker required
  - fakeredis v2         : in-process Redis for blacklist / rate-limit
  - Both injected via FastAPI dependency overrides + module-level pool patch
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

import fakeredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.base import Base

# ── In-memory SQLite ───────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── fakeredis v2 factory ───────────────────────────────────────────────────────
def _make_fake_redis() -> fakeredis.FakeAsyncRedis:
    server = fakeredis.FakeServer()
    return fakeredis.FakeAsyncRedis(server=server, decode_responses=True)


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def fake_redis() -> AsyncGenerator[fakeredis.FakeAsyncRedis, None]:
    r = _make_fake_redis()
    yield r
    await r.aclose()


@pytest_asyncio.fixture
async def client(
    db_session: AsyncSession,
    fake_redis: fakeredis.FakeAsyncRedis,
) -> AsyncGenerator[AsyncClient, None]:
    import app.core.redis as redis_module
    from app.core.redis import get_redis

    redis_module._redis_pool = fake_redis

    async def override_get_db():
        yield db_session

    async def override_get_redis():
        yield fake_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c

    app.dependency_overrides.clear()
    redis_module._redis_pool = None
