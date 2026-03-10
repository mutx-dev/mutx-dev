"""
Pytest configuration and fixtures for MUTX API tests.
"""
import asyncio
from collections.abc import AsyncGenerator
import os
import uuid
from datetime import datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set environment before any imports
os.environ.setdefault("DATABASE_REQUIRED_ON_STARTUP", "false")
os.environ.setdefault("JWT_SECRET", "test-secret-key")

# Use SQLite in-memory for tests (for local dev)
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

# Configure pytest-asyncio
pytest_plugins = ("pytest_asyncio",)


def create_test_app() -> FastAPI:
    """Create a test FastAPI application."""
    from src.api.routes import agents, deployments
    
    app = FastAPI(title="MUTX Test API")
    
    # Include routers
    app.include_router(agents.router)
    app.include_router(deployments.router)
    
    # Health check endpoint
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
    # Import Base from database to use the real models
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
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession, test_user):
    """Create test client with database and auth overrides."""
    from src.api.database import get_db
    from src.api.middleware.auth import get_current_user
    
    # Create test app
    test_app = create_test_app()
    
    async def override_get_db():
        yield db_session
    
    # Override get_current_user to return test user
    async def override_get_current_user():
        return test_user
    
    # Override dependencies
    test_app.dependency_overrides[get_db] = override_get_db
    test_app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test"
    ) as client:
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
    
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test"
    ) as client:
        yield client
    
    test_app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def other_user_client(db_session: AsyncSession, other_user):
    """Create test client authenticated as other_user."""
    from src.api.database import get_db
    from src.api.middleware.auth import get_current_user
    
    test_app = create_test_app()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_current_user():
        return other_user
    
    test_app.dependency_overrides[get_db] = override_get_db
    test_app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test"
    ) as client:
        yield client
    
    test_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    from src.api.models.models import User
    
    user = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        email="test@example.com",
        username="testuser",
        hashed_password="hashedpassword",
        is_active=True,
        name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def other_user(db_session: AsyncSession):
    """Create another test user for authorization tests."""
    from src.api.models.models import User
    
    user = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
        email="other@example.com",
        username="otheruser",
        hashed_password="hashedpassword",
        is_active=True,
        name="Other User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_agent(db_session: AsyncSession, test_user):
    """Create a test agent."""
    from src.api.models.models import Agent, AgentStatus
    
    agent = Agent(
        id=uuid.UUID("00000000-0000-0000-0000-000000000010"),
        name="test-agent",
        description="A test agent",
        config='{"model": "gpt-4"}',
        user_id=test_user.id,
        status=AgentStatus.CREATING,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest_asyncio.fixture
async def test_deployment(db_session: AsyncSession, test_agent):
    """Create a test deployment."""
    from src.api.models.models import Deployment
    
    deployment = Deployment(
        id=uuid.UUID("00000000-0000-0000-0000-000000000020"),
        agent_id=test_agent.id,
        status="running",
        replicas=1,
    )
    db_session.add(deployment)
    await db_session.commit()
    await db_session.refresh(deployment)
    return deployment
