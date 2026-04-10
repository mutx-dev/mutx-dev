"""Tests for /v1/onboarding route — operator onboarding state management."""

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# GET /v1/onboarding  — fetch onboarding state
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_onboarding_state_default(client: AsyncClient):
    """GET onboarding returns default pending state."""
    response = await client.get("/v1/onboarding")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "openclaw"
    assert data["status"] in ("pending", "in_progress", "completed")
    assert "current_step" in data
    assert "completed_steps" in data
    assert "steps" in data
    assert isinstance(data["steps"], list)


@pytest.mark.asyncio
async def test_get_onboarding_state_with_provider(client: AsyncClient):
    """GET onboarding with provider query param."""
    response = await client.get("/v1/onboarding", params={"provider": "openclaw"})
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "openclaw"


# ---------------------------------------------------------------------------
# POST /v1/onboarding  — update onboarding state
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_onboarding_complete_step(client: AsyncClient):
    """POST with complete_step action advances onboarding."""
    response = await client.post(
        "/v1/onboarding",
        json={
            "action": "complete_step",
            "provider": "openclaw",
            "step": "auth",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "current_step" in data
    assert "status" in data
    assert "auth" in data["completed_steps"]


@pytest.mark.asyncio
async def test_onboarding_complete_step_with_payload(client: AsyncClient):
    """POST with payload carries extra data."""
    response = await client.post(
        "/v1/onboarding",
        json={
            "action": "complete_step",
            "provider": "openclaw",
            "step": "provider",
            "payload": {"selected_provider": "openclaw"},
        },
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_onboarding_complete_all(client: AsyncClient):
    """POST with complete action marks all steps done."""
    response = await client.post(
        "/v1/onboarding",
        json={"action": "complete", "provider": "openclaw"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_onboarding_reset(client: AsyncClient):
    """POST with reset action returns to default state."""
    # Complete first
    await client.post(
        "/v1/onboarding",
        json={"action": "complete", "provider": "openclaw"},
    )
    # Then reset
    response = await client.post(
        "/v1/onboarding",
        json={"action": "reset", "provider": "openclaw"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_onboarding_skip(client: AsyncClient):
    """POST with skip action marks onboarding as skipped."""
    response = await client.post(
        "/v1/onboarding",
        json={"action": "skip", "provider": "openclaw"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "skipped"


@pytest.mark.asyncio
async def test_onboarding_dismiss_checklist(client: AsyncClient):
    """POST with dismiss_checklist sets checklist_dismissed."""
    response = await client.post(
        "/v1/onboarding",
        json={"action": "dismiss_checklist", "provider": "openclaw"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["checklist_dismissed"] is True


@pytest.mark.asyncio
async def test_onboarding_invalid_step(client: AsyncClient):
    """POST with invalid step returns 400."""
    response = await client.post(
        "/v1/onboarding",
        json={"action": "complete_step", "provider": "openclaw", "step": "nonexistent"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_onboarding_update_missing_action(client: AsyncClient):
    """POST without action returns 422."""
    response = await client.post(
        "/v1/onboarding",
        json={"provider": "openclaw"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_update_empty_action(client: AsyncClient):
    """POST with empty action string returns 422 (min_length=1)."""
    response = await client.post(
        "/v1/onboarding",
        json={"action": "", "provider": "openclaw"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_roundtrip(client: AsyncClient):
    """POST then GET returns the updated state."""
    await client.post(
        "/v1/onboarding",
        json={"action": "complete_step", "provider": "openclaw", "step": "auth"},
    )
    response = await client.get("/v1/onboarding", params={"provider": "openclaw"})
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "openclaw"
