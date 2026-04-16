"""Tests for Pico package generation routes."""

import io
import zipfile

import pytest
import pytest_asyncio
from httpx import AsyncClient

from src.api.models.pico_onboarding import OnboardingState
from src.api.routes import pico as pico_routes


@pytest_asyncio.fixture(autouse=True)
async def starter_plan(db_session, test_user):
    test_user.plan = "STARTER"
    db_session.add(test_user)
    await db_session.commit()
    await db_session.refresh(test_user)
    yield
    pico_routes._sessions.clear()


@pytest.mark.asyncio
async def test_generate_package_success(client: AsyncClient):
    response = await client.post(
        "/v1/pico/generate-package-legacy",
        json={"agent_name": "my-agent", "pain_points": ["manual_repetitive"]},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert "attachment" in response.headers["content-disposition"]
    assert "my-agent.zip" in response.headers["content-disposition"]

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        names = zf.namelist()
        assert "agent.md" in names
        assert "config.yaml" in names
        assert "skills/README.md" in names

        agent_md = zf.read("agent.md").decode()
        assert "my-agent" in agent_md
        assert "task-automator" in agent_md

        config_yaml = zf.read("config.yaml").decode()
        assert "my-agent" in config_yaml
        assert "task-automator" in config_yaml


@pytest.mark.asyncio
async def test_generate_package_default_template(client: AsyncClient):
    response = await client.post(
        "/v1/pico/generate-package-legacy",
        json={"agent_name": "generic-agent"},
    )
    assert response.status_code == 200

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        agent_md = zf.read("agent.md").decode()
        assert "general-purpose" in agent_md


@pytest.mark.asyncio
async def test_generate_package_with_model(client: AsyncClient):
    response = await client.post(
        "/v1/pico/generate-package-legacy",
        json={"agent_name": "model-agent", "model": "claude-3-opus"},
    )
    assert response.status_code == 200

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        config_yaml = zf.read("config.yaml").decode()
        assert "claude-3-opus" in config_yaml


@pytest.mark.asyncio
async def test_generate_package_empty_name(client: AsyncClient):
    response = await client.post(
        "/v1/pico/generate-package-legacy",
        json={"agent_name": "   "},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_generate_package_missing_name(client: AsyncClient):
    response = await client.post(
        "/v1/pico/generate-package-legacy",
        json={},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_generate_package_requires_auth(client_no_auth: AsyncClient):
    response = await client_no_auth.post(
        "/v1/pico/generate-package-legacy",
        json={"agent_name": "test"},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_generate_package_multiple_pain_points(client: AsyncClient):
    response = await client.post(
        "/v1/pico/generate-package-legacy",
        json={
            "agent_name": "multi-agent",
            "pain_points": ["data_overload", "scattered_knowledge"],
        },
    )
    assert response.status_code == 200

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        agent_md = zf.read("agent.md").decode()
        # Should use the first matching template
        assert "data-analyst" in agent_md
        assert "data_overload" in agent_md
        assert "scattered_knowledge" in agent_md


@pytest.mark.asyncio
async def test_generate_package_requires_existing_ready_session(client: AsyncClient):
    session_id = "ready-session"
    pico_routes._sessions[session_id] = {
        "history": [],
        "state": OnboardingState(
            stack="hermes",
            os="macos",
            provider="openai",
            goal="install",
        ),
    }

    response = await client.post(
        "/v1/pico/generate-package",
        json={"session_id": session_id},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
