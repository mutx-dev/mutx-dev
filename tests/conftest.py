"""
Pytest configuration and fixtures for MUTX API tests.
"""

import asyncio
from datetime import datetime, timezone
from collections.abc import AsyncGenerator
import os
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from fastapi import FastAPI
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set environment before any imports
os.environ.setdefault("DATABASE_REQUIRED_ON_STARTUP", "false")
os.environ.setdefault("JWT_SECRET", "test-secret-key-that-is-long-enough-32")

# Use an isolated SQLite database for tests by default.
# Do not inherit DATABASE_URL from the shell, or tests can accidentally hit a
# real/dev database and fail in misleading ways.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

# Configure pytest-asyncio
pytest_plugins = ("pytest_asyncio",)


@compiles(PGUUID, "sqlite")
def compile_uuid_sqlite(_type, _compiler, **_kw):
    return "CHAR(36)"


def create_test_app() -> FastAPI:
    """Create a test FastAPI application."""
    from src.api.routes import (
        agents,
        deployments,
        api_keys,
        auth,
        webhooks,
        clawhub,
        agent_runtime,
        newsletter,
        ingest,
        leads,
        runs,
        usage,
        analytics,
        budgets,
        monitoring,
        swarms,
    )

    app = FastAPI(title="MUTX Test API")

    # Include routers
    app.include_router(agents.router, prefix="/v1")
    app.include_router(deployments.router, prefix="/v1")
    app.include_router(api_keys.router, prefix="/v1")
    app.include_router(auth.router, prefix="/v1")
    app.include_router(webhooks.router, prefix="/v1")
    app.include_router(clawhub.router, prefix="/v1")
    app.include_router(agent_runtime.router, prefix="/v1")
    app.include_router(newsletter.router, prefix="/v1")
    app.include_router(leads.router, prefix="/v1")
    app.include_router(leads.contacts_router, prefix="/v1")
    app.include_router(ingest.router, prefix="/v1")
    app.include_router(runs.router, prefix="/v1")
    app.include_router(usage.router, prefix="/v1")
    app.include_router(analytics.router, prefix="/v1")
    app.include_router(budgets.router, prefix="/v1")
    app.include_router(monitoring.router, prefix="/v1")
    app.include_router(swarms.router, prefix="/v1")

    # Health check endpoint
    @app.get("/")
    async def root():
        return {"message": "mutx.dev API", "version": "1.0.0"}

    @app.get("/ready")
    async def ready():
        # Simple ready check for tests
        return {
            "status": "ready",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": "ready",
            "error": None,
        }

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create test database engine."""
    # Import models before Base.metadata.create_all() so SQLAlchemy has the
    # declarative tables registered. Without this, create_all() can silently
    # create an empty schema and tests fail later with misleading "no such table"
    # errors.
    from src.api.models import models as _models  # noqa: F401
    from src.api.database import Base

    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in TEST_DATABASE_URL else {},
        poolclass=StaticPool if "sqlite" in TEST_DATABASE_URL else None,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession, test_user):
    """Create test client with database and auth overrides."""
    from src.api.database import get_db
    from src.api.middleware.auth import (
        get_current_user,
        get_current_user_optional,
        get_current_user_or_api_key,
    )
    from src.api.routes.webhooks import get_webhook_auth
    from src.api.routes.ingest import get_ingest_auth

    # Create test app
    test_app = create_test_app()

    async def override_get_db():
        yield db_session

    # Override get_current_user to return test user
    async def override_get_current_user():
        return test_user

    # Override get_current_user_or_api_key to return test user
    async def override_get_current_user_or_api_key():
        return test_user

    async def override_get_current_user_optional():
        return test_user

    async def override_get_webhook_auth():
        return test_user

    async def override_get_ingest_auth():
        return test_user

    # Override dependencies
    test_app.dependency_overrides[get_db] = override_get_db
    test_app.dependency_overrides[get_current_user] = override_get_current_user
    test_app.dependency_overrides[get_current_user_optional] = override_get_current_user_optional
    test_app.dependency_overrides[get_current_user_or_api_key] = (
        override_get_current_user_or_api_key
    )
    test_app.dependency_overrides[get_webhook_auth] = override_get_webhook_auth
    test_app.dependency_overrides[get_ingest_auth] = override_get_ingest_auth

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        client.app = test_app
        yield client

    test_app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def client_no_auth(db_session: AsyncSession):
    """Create test client without auth override (for testing auth)."""
    from src.api.database import get_db

    test_app = create_test_app()

    async def override_get_db():
        yield db_session

    test_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        client.app = test_app
        yield client

    test_app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def other_user_client(db_session: AsyncSession, other_user):
    """Create test client authenticated as other_user."""
    from src.api.database import get_db
    from src.api.middleware.auth import (
        get_current_user,
        get_current_user_optional,
        get_current_user_or_api_key,
    )
    from src.api.routes.webhooks import get_webhook_auth
    from src.api.routes.ingest import get_ingest_auth

    test_app = create_test_app()

    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return other_user

    async def override_get_current_user_or_api_key():
        return other_user

    async def override_get_current_user_optional():
        return other_user

    async def override_get_webhook_auth():
        return other_user

    async def override_get_ingest_auth():
        return other_user

    test_app.dependency_overrides[get_db] = override_get_db
    test_app.dependency_overrides[get_current_user] = override_get_current_user
    test_app.dependency_overrides[get_current_user_optional] = override_get_current_user_optional
    test_app.dependency_overrides[get_current_user_or_api_key] = (
        override_get_current_user_or_api_key
    )
    test_app.dependency_overrides[get_webhook_auth] = override_get_webhook_auth
    test_app.dependency_overrides[get_ingest_auth] = override_get_ingest_auth

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        client.app = test_app
        yield client

    test_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    from src.api.models.models import User

    user = User(
        id=uuid.UUID("11111111-1111-4111-a111-111111111111"),
        email="test@mutx.dev",
        password_hash="hashedpassword",
        is_active=True,
        is_email_verified=True,
        name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def other_user(db_session: AsyncSession):
    """Create another test user for authorization tests."""
    from src.api.models.models import User

    user = User(
        id=uuid.UUID("22222222-2222-4222-a222-222222222222"),
        email="other@example.com",
        password_hash="hashedpassword",
        is_active=True,
        name="Other User",
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def test_agent(db_session: AsyncSession, test_user):
    """Create a test agent."""
    from src.api.models.models import Agent, AgentStatus

    agent = Agent(
        id=uuid.UUID("33333333-3333-4333-a333-333333333333"),
        name="test-agent",
        description="A test agent",
        config='{"model": "gpt-4"}',
        user_id=test_user.id,
        status=AgentStatus.CREATING,
    )
    db_session.add(agent)
    await db_session.commit()
    return agent


@pytest_asyncio.fixture
async def test_deployment(db_session: AsyncSession, test_agent):
    """Create a test deployment."""
    from src.api.models.models import Deployment

    deployment = Deployment(
        id=uuid.UUID("44444444-4444-4444-a444-444444444444"),
        agent_id=test_agent.id,
        status="running",
        replicas=1,
    )
    db_session.add(deployment)
    await db_session.commit()
    return deployment
