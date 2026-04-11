"""Tests for /v1/pico routes — learner progress state and event ingestion."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_get_pico_state_default(client: AsyncClient):
    response = await client.get("/v1/pico/state")
    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "FREE"
    assert data["xp_total"] == 0
    assert data["current_level"] == 1
    assert data["level_progress"] == {
        "current_level": 1,
        "current_level_floor_xp": 0,
        "next_level": 2,
        "next_level_target_xp": 100,
        "xp_into_level": 0,
        "xp_to_next_level": 100,
        "progress_percent": 0,
    }
    assert data["cost_threshold_usd"] is None
    assert data["approval_gate_enabled"] is False
    assert data["completed_lessons"] == []
    assert data["completed_tracks"] == []
    assert data["badges"] == []
    assert data["milestones"] == []
    assert data["event_counts"] == {}
    assert data["recent_events"] == []
    assert data["tutor_sessions_used"] == 0
    assert data["tutor_access"] == {
        "plan": "FREE",
        "limit": 3,
        "remaining": 3,
        "used": 0,
        "limit_reached": False,
        "reset_policy": "lifetime",
        "note": "Free currently includes 3 grounded tutor lookups total. Counts do not reset automatically yet.",
    }
    assert data["updated_at"]


@pytest.mark.asyncio
async def test_post_pico_lesson_completed_updates_state(client: AsyncClient):
    response = await client.post(
        "/v1/pico/events",
        json={"event": "lesson_completed", "lesson_id": "lesson-1", "track_id": "track-a"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["xp_total"] == 125
    assert data["current_level"] == 2
    assert data["completed_lessons"] == ["lesson-1"]
    assert data["completed_tracks"] == []
    assert data["milestones"] == ["first_lesson_finished"]
    assert data["event_counts"]["lesson_completed"] == 1
    assert data["recent_events"][-1]["event"] == "lesson_completed"
    assert data["recent_events"][-1]["lesson_id"] == "lesson-1"
    assert data["recent_events"][-1]["track_id"] == "track-a"
    assert data["recent_events"][-1]["xp_awarded"] == 125
    assert data["recent_events"][-1]["metadata"]["auto_progress"] == {
        "completed_tracks": [],
        "badges": [],
        "milestones": ["first_lesson_finished"],
    }


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
    assert data["xp_total"] == 125
    assert data["completed_lessons"] == ["lesson-1"]
    assert data["event_counts"]["lesson_completed"] == 2
    assert data["recent_events"][-1]["xp_awarded"] == 0


@pytest.mark.asyncio
async def test_lesson_completion_auto_awards_track_and_badge_progress(client: AsyncClient):
    await client.post(
        "/v1/pico/events",
        json={"event": "lesson_completed", "lesson_id": "install-hermes-locally"},
    )
    response = await client.post(
        "/v1/pico/events",
        json={"event": "lesson_completed", "lesson_id": "run-your-first-agent"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["completed_lessons"] == [
        "install-hermes-locally",
        "run-your-first-agent",
    ]
    assert data["completed_tracks"] == ["track-a"]
    assert data["badges"] == ["first-boot"]
    assert data["milestones"] == ["first_lesson_finished", "first_track_finished"]
    assert data["xp_total"] == 400
    assert data["current_level"] == 3
    assert data["recent_events"][-1]["metadata"]["auto_progress"] == {
        "completed_tracks": ["track-a"],
        "badges": ["first-boot"],
        "milestones": ["first_track_finished"],
    }


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
    assert data["milestones"] == [
        "first_track_finished",
        "launch_ready",
        "grounded_tutor_used",
    ]
    assert data["tutor_sessions_used"] == 2
    assert data["tutor_access"]["remaining"] == 1
    assert data["xp_total"] == 395
    assert data["current_level"] == 3
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
async def test_free_plan_tutor_limit_blocks_extra_sessions(client: AsyncClient):
    first = await client.post(
        "/v1/pico/events",
        json={"event": "tutor_session_used", "tutor_sessions": 2},
    )
    assert first.status_code == 200

    second = await client.post(
        "/v1/pico/events",
        json={"event": "tutor_session_used", "tutor_sessions": 2},
    )
    assert second.status_code == 403
    assert second.json()["detail"] == (
        "Free currently includes 3 grounded tutor lookups total. "
        "You have 1 remaining and requested 2. Counts do not reset automatically yet."
    )

    state_response = await client.get("/v1/pico/state")
    state = state_response.json()
    assert state["tutor_sessions_used"] == 2
    assert state["tutor_access"]["remaining"] == 1
    assert state["tutor_access"]["limit_reached"] is False


@pytest.mark.asyncio
async def test_starter_plan_gets_higher_tutor_limit(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user,
):
    test_user.plan = "STARTER"
    db_session.add(test_user)
    await db_session.commit()

    response = await client.post(
        "/v1/pico/events",
        json={"event": "tutor_session_used", "tutor_sessions": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "STARTER"
    assert data["tutor_sessions_used"] == 5
    assert data["tutor_access"]["limit"] == 25
    assert data["tutor_access"]["remaining"] == 20


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
    assert data["milestones"] == ["budget_guardrail_set", "approval_guardrail_live"]


@pytest.mark.asyncio
async def test_post_pico_event_aliases_normalize_to_canonical_counts(client: AsyncClient):
    response = await client.post(
        "/v1/pico/events",
        json={"event": "first_agent_deployed", "metadata": {"template_id": "personal_assistant"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["xp_total"] == 195
    assert data["current_level"] == 2
    assert data["event_counts"] == {"starter_agent_deployed": 1}
    assert data["milestones"] == ["starter_agent_live"]
    assert data["recent_events"][-1]["event"] == "starter_agent_deployed"
    assert data["recent_events"][-1]["metadata"] == {
        "template_id": "personal_assistant",
        "auto_progress": {
            "completed_tracks": [],
            "badges": [],
            "milestones": ["starter_agent_live"],
        },
    }
