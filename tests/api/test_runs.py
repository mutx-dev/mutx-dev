from datetime import datetime
import uuid

import pytest

from src.api.models.models import Agent, AgentStatus


@pytest.mark.asyncio
async def test_create_run_persists_trace_data_and_returns_details(client, test_agent):
    response = await client.post(
        "/v1/runs",
        json={
            "agent_id": str(test_agent.id),
            "status": "completed",
            "input_text": "Summarize deployment logs",
            "output_text": "Deployment healthy with 0 failed checks.",
            "metadata": {"model": "gpt-4.1-mini", "latency_ms": 231},
            "traces": [
                {
                    "event_type": "prompt",
                    "message": "Prompt prepared",
                    "payload": {"tokens": 129},
                },
                {
                    "event_type": "tool_call",
                    "message": "Queried deployment metrics",
                    "payload": {"tool": "get_metrics"},
                },
            ],
        },
    )

    assert response.status_code == 201
    payload = response.json()

    assert payload["agent_id"] == str(test_agent.id)
    assert payload["status"] == "completed"
    assert payload["metadata"] == {"model": "gpt-4.1-mini", "latency_ms": 231}
    assert payload["trace_count"] == 2
    assert len(payload["traces"]) == 2
    assert payload["traces"][0]["event_type"] == "prompt"
    assert payload["traces"][1]["event_type"] == "tool_call"

    runs_response = await client.get(f"/v1/runs?agent_id={test_agent.id}")
    assert runs_response.status_code == 200
    history = runs_response.json()
    assert history["total"] == 1
    assert len(history["items"]) == 1
    assert history["items"][0]["trace_count"] == 2


@pytest.mark.asyncio
async def test_get_run_and_trace_query_support_filters_and_pagination(client, test_agent):
    create_response = await client.post(
        "/v1/runs",
        json={
            "agent_id": str(test_agent.id),
            "status": "completed",
            "input_text": "Analyze incident timeline",
            "output_text": "Two anomalies found",
            "traces": [
                {
                    "event_type": "step",
                    "message": "Parse request",
                    "payload": {"index": 0},
                },
                {
                    "event_type": "tool_call",
                    "message": "Query metrics store",
                    "payload": {"index": 1},
                },
                {
                    "event_type": "tool_call",
                    "message": "Query logs store",
                    "payload": {"index": 2},
                },
            ],
        },
    )
    assert create_response.status_code == 201
    run_id = create_response.json()["id"]

    run_response = await client.get(f"/v1/runs/{run_id}")
    assert run_response.status_code == 200
    assert run_response.json()["trace_count"] == 3
    assert len(run_response.json()["traces"]) == 3

    traces_response = await client.get(
        f"/v1/runs/{run_id}/traces?event_type=tool_call&skip=0&limit=1"
    )
    assert traces_response.status_code == 200

    traces_payload = traces_response.json()
    assert traces_payload["run_id"] == run_id
    assert traces_payload["event_type"] == "tool_call"
    assert traces_payload["total"] == 2
    assert len(traces_payload["items"]) == 1
    assert traces_payload["items"][0]["event_type"] == "tool_call"
    assert traces_payload["items"][0]["sequence"] == 1


@pytest.mark.asyncio
async def test_runs_are_scoped_by_authenticated_user(client, other_user_client, test_agent):
    create_response = await client.post(
        "/v1/runs",
        json={
            "agent_id": str(test_agent.id),
            "status": "completed",
            "input_text": "scope check",
            "traces": [],
        },
    )
    assert create_response.status_code == 201
    run_id = create_response.json()["id"]

    forbidden_response = await other_user_client.get(f"/v1/runs/{run_id}")
    assert forbidden_response.status_code == 403
    assert forbidden_response.json()["detail"] == "Not authorized to access this run"


@pytest.mark.asyncio
async def test_create_run_rejects_agent_not_owned_by_requesting_user(client, db_session, other_user):
    other_agent = Agent(
        id=uuid.UUID("66666666-6666-4666-a666-666666666666"),
        name="other-agent",
        description="another owner's agent",
        config='{"model": "gpt-4o"}',
        user_id=other_user.id,
        status=AgentStatus.RUNNING,
    )
    db_session.add(other_agent)
    await db_session.commit()

    response = await client.post(
        "/v1/runs",
        json={
            "agent_id": str(other_agent.id),
            "status": "completed",
            "input_text": "should fail",
            "metadata": {},
            "traces": [],
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to access this agent"


@pytest.mark.asyncio
async def test_create_run_accepts_explicit_timestamps(client, test_agent):
    started_at = datetime(2026, 3, 14, 10, 0, 0).isoformat()
    completed_at = datetime(2026, 3, 14, 10, 0, 1).isoformat()

    response = await client.post(
        "/v1/runs",
        json={
            "agent_id": str(test_agent.id),
            "status": "completed",
            "started_at": started_at,
            "completed_at": completed_at,
            "traces": [
                {
                    "event_type": "done",
                    "payload": {"ok": True},
                    "timestamp": completed_at,
                }
            ],
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["started_at"].startswith("2026-03-14T10:00:00")
    assert payload["completed_at"].startswith("2026-03-14T10:00:01")
    assert payload["traces"][0]["timestamp"].startswith("2026-03-14T10:00:01")


@pytest.mark.asyncio
async def test_list_runs_filter_by_status(client, test_agent):
    """Test filtering runs by status."""
    # Create multiple runs with different statuses
    for status in ["running", "completed", "failed"]:
        await client.post(
            "/v1/runs",
            json={
                "agent_id": str(test_agent.id),
                "status": status,
                "traces": [],
            },
        )

    # Filter by running
    running = await client.get("/v1/runs?status=running")
    assert running.status_code == 200
    assert running.json()["total"] == 1

    # Filter by completed
    completed = await client.get("/v1/runs?status=completed")
    assert completed.status_code == 200
    assert completed.json()["total"] == 1

    # Filter by failed
    failed = await client.get("/v1/runs?status=failed")
    assert failed.status_code == 200
    assert failed.json()["total"] == 1
