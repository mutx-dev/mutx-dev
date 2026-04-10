"""Tests for /v1/sessions route — list, action validation, delete."""

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# GET /v1/sessions  — list sessions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_sessions_returns_valid_structure(client: AsyncClient):
    """Sessions list returns 200 with a sessions list."""
    response = await client.get("/v1/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
    for session in data["sessions"]:
        assert "id" in session
        assert "source" in session


@pytest.mark.asyncio
async def test_list_sessions_with_agent_id(client: AsyncClient, test_agent):
    """Sessions list accepts an optional agent_id query param."""
    response = await client.get(
        "/v1/sessions", params={"agent_id": str(test_agent.id)}
    )
    # May return 200 (empty) or error depending on gateway state
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data


# ---------------------------------------------------------------------------
# POST /v1/sessions  — session action
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_session_action_invalid_action(client: AsyncClient):
    """Invalid action returns 400."""
    response = await client.post(
        "/v1/sessions?action=bogus",
        json={"session_key": "test-session"},
    )
    assert response.status_code == 400
    assert "Invalid action" in response.json()["detail"]


@pytest.mark.asyncio
async def test_session_action_set_thinking_invalid_level(client: AsyncClient):
    """set-thinking with invalid level returns 400."""
    response = await client.post(
        "/v1/sessions?action=set-thinking",
        json={"session_key": "test-session", "level": "superultra"},
    )
    assert response.status_code == 400
    assert "Invalid thinking level" in response.json()["detail"]


@pytest.mark.asyncio
async def test_session_action_set_thinking_valid_returns_200(client: AsyncClient):
    """Valid set-thinking request returns 200 with applied status."""
    response = await client.post(
        "/v1/sessions?action=set-thinking",
        json={"session_key": "test-session", "level": "high"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "applied" in data
    assert "action" in data


@pytest.mark.asyncio
async def test_session_action_set_verbose_invalid_level(client: AsyncClient):
    """set-verbose with invalid level returns 400."""
    response = await client.post(
        "/v1/sessions?action=set-verbose",
        json={"session_key": "test-session", "level": "extra"},
    )
    assert response.status_code == 400
    assert "Invalid verbose level" in response.json()["detail"]


@pytest.mark.asyncio
async def test_session_action_set_verbose_valid(client: AsyncClient):
    """Valid set-verbose returns 200 with applied status."""
    response = await client.post(
        "/v1/sessions?action=set-verbose",
        json={"session_key": "test-session", "level": "on"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "applied" in data


@pytest.mark.asyncio
async def test_session_action_set_reasoning_invalid_level(client: AsyncClient):
    """set-reasoning with invalid level returns 400."""
    response = await client.post(
        "/v1/sessions?action=set-reasoning",
        json={"session_key": "test-session", "level": "maybe"},
    )
    assert response.status_code == 400
    assert "Invalid reasoning level" in response.json()["detail"]


@pytest.mark.asyncio
async def test_session_action_set_reasoning_valid(client: AsyncClient):
    """Valid set-reasoning returns 200 with applied status."""
    response = await client.post(
        "/v1/sessions?action=set-reasoning",
        json={"session_key": "test-session", "level": "stream"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "applied" in data


@pytest.mark.asyncio
async def test_session_action_set_label_too_long(client: AsyncClient):
    """set-label with label > 100 chars returns 400."""
    response = await client.post(
        "/v1/sessions?action=set-label",
        json={"session_key": "test-session", "label": "x" * 101},
    )
    assert response.status_code == 400
    assert "Label must be" in response.json()["detail"]


@pytest.mark.asyncio
async def test_session_action_set_label_missing(client: AsyncClient):
    """set-label without label returns 400."""
    response = await client.post(
        "/v1/sessions?action=set-label",
        json={"session_key": "test-session"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_session_action_set_label_valid(client: AsyncClient):
    """Valid set-label returns 200 with applied status."""
    response = await client.post(
        "/v1/sessions?action=set-label",
        json={"session_key": "test-session", "label": "My Session"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "applied" in data


# ---------------------------------------------------------------------------
# DELETE /v1/sessions  — delete session
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_session_returns_applied_status(client: AsyncClient):
    """Delete session returns 200 with applied status."""
    response = await client.request(
        "DELETE",
        "/v1/sessions",
        json={"session_key": "test-session"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "applied" in data
    assert "action" in data
