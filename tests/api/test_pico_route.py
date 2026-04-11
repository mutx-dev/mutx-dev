"""Tests for /v1/pico routes — learner progress state and event ingestion."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_pico_state_default(client: AsyncClient):
    response = await client.get("/v1/pico/state")
    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "FREE"
    assert data["xp_total"] == 0
    assert data["current_level"] == 1
    assert data["cost_threshold_usd"] is None
    assert data["approval_gate_enabled"] is False
    assert data["completed_lessons"] == []
    assert data["completed_tracks"] == []
    assert data["badges"] == []
    assert data["milestones"] == []
    assert data["event_counts"] == {}
    assert data["recent_events"] == []
    assert data["tutor_sessions_used"] == 0
    assert data["updated_at"]


@pytest.mark.asyncio
async def test_post_pico_lesson_completed_updates_state(client: AsyncClient):
    response = await client.post(
        "/v1/pico/events",
        json={"event": "lesson_completed", "lesson_id": "lesson-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["xp_total"] == 50
    assert data["current_level"] == 1
    assert data["completed_lessons"] == ["lesson-1"]
    assert data["event_counts"]["lesson_completed"] == 1
    assert data["recent_events"][-1]["event"] == "lesson_completed"
    assert data["recent_events"][-1]["lesson_id"] == "lesson-1"
    assert data["recent_events"][-1]["xp_awarded"] == 50


@pytest.mark.asyncio
async def test_post_duplicate_lesson_event_is_deduped_for_xp(client: AsyncClient):
    await client.post(
        "/v1/pico/events",
        json={"event": "lesson_completed", "lesson_id": "lesson-1"},
    )
    response = await client.post(
        "/v1/pico/events",
        json={"event": "lesson_completed", "lesson_id": "lesson-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["xp_total"] == 50
    assert data["completed_lessons"] == ["lesson-1"]
    assert data["event_counts"]["lesson_completed"] == 2
    assert data["recent_events"][-1]["xp_awarded"] == 0


@pytest.mark.asyncio
async def test_post_pico_events_roundtrip_state(client: AsyncClient):
    await client.post(
        "/v1/pico/events",
        json={"event": "track_completed", "track_id": "track-1"},
    )
    await client.post(
        "/v1/pico/events",
        json={"event": "badge_earned", "badge_id": "first_ship"},
    )
    await client.post(
        "/v1/pico/events",
        json={"event": "milestone_reached", "milestone_id": "launch_ready"},
    )
    await client.post(
        "/v1/pico/events",
        json={"event": "tutor_session_used", "tutor_sessions": 2},
    )

    response = await client.get("/v1/pico/state")
    assert response.status_code == 200
    data = response.json()
    assert data["completed_tracks"] == ["track-1"]
    assert data["badges"] == ["first_ship"]
    assert data["milestones"] == ["launch_ready"]
    assert data["tutor_sessions_used"] == 2
    assert data["xp_total"] == 245
    assert data["current_level"] == 2
    assert data["event_counts"]["track_completed"] == 1
    assert data["event_counts"]["badge_earned"] == 1
    assert data["event_counts"]["milestone_reached"] == 1
    assert data["event_counts"]["tutor_session_used"] == 1
    assert [item["event"] for item in data["recent_events"]][-4:] == [
        "track_completed",
        "badge_earned",
        "milestone_reached",
        "tutor_session_used",
    ]


@pytest.mark.asyncio
async def test_post_pico_threshold_and_gate_flags(client: AsyncClient):
    threshold_response = await client.post(
        "/v1/pico/events",
        json={"event": "cost_threshold_set", "metadata": {"threshold_usd": 42}},
    )
    assert threshold_response.status_code == 200
    approval_response = await client.post(
        "/v1/pico/events",
        json={"event": "approval_gate_enabled"},
    )
    assert approval_response.status_code == 200

    data = approval_response.json()
    assert data["cost_threshold_usd"] == 42
    assert data["approval_gate_enabled"] is True
