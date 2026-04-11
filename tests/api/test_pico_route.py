"""Tests for /v1/pico/state — PicoMUTX learner state persistence."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_pico_state_returns_default_shape(client: AsyncClient):
    response = await client.get("/v1/pico/state")
    assert response.status_code == 200
    data = response.json()["state"]
    assert data["effective_plan"] == "starter"
    assert data["focus_track_id"] == "track-a-first-agent"
    assert data["xp"] >= 0
    assert isinstance(data["started_lesson_ids"], list)
    assert isinstance(data["completed_lesson_ids"], list)
    assert isinstance(data["alert_config"], dict)
    assert isinstance(data["approval_gate"], dict)


@pytest.mark.asyncio
async def test_put_pico_state_merges_nested_config(client: AsyncClient):
    response = await client.put(
        "/v1/pico/state",
        json={
            "patch": {
                "focus_track_id": "track-d-controlled-agent",
                "alert_config": {"enabled": True, "monthly_budget_usd": 49},
                "approval_gate": {"enabled": True},
            }
        },
    )
    assert response.status_code == 200
    state = response.json()["state"]
    assert state["focus_track_id"] == "track-d-controlled-agent"
    assert state["alert_config"]["enabled"] is True
    assert state["alert_config"]["monthly_budget_usd"] == 49
    assert state["alert_config"]["notify_email"] is True
    assert state["approval_gate"]["enabled"] is True
    assert state["approval_gate"]["risky_action"] == "deployment_change"


@pytest.mark.asyncio
async def test_put_then_get_pico_state_roundtrip(client: AsyncClient):
    await client.put(
        "/v1/pico/state",
        json={
            "patch": {
                "started_lesson_ids": ["install-hermes-locally"],
                "completed_lesson_ids": ["install-hermes-locally"],
                "xp": 125,
            }
        },
    )

    response = await client.get("/v1/pico/state")
    assert response.status_code == 200
    state = response.json()["state"]
    assert state["completed_lesson_ids"] == ["install-hermes-locally"]
    assert state["xp"] == 125


@pytest.mark.asyncio
async def test_put_pico_state_replace_overwrites(client: AsyncClient):
    response = await client.put(
        "/v1/pico/state",
        json={
            "replace": True,
            "patch": {
                "focus_track_id": "track-b-deployed-agent",
                "xp": 10,
                "completed_lesson_ids": ["run-your-first-agent"],
            },
        },
    )
    assert response.status_code == 200
    state = response.json()["state"]
    assert state["focus_track_id"] == "track-b-deployed-agent"
    assert state["xp"] == 10
    assert state["completed_lesson_ids"] == ["run-your-first-agent"]
    assert state["alert_config"]["monthly_budget_usd"] == 25
