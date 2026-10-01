from datetime import datetime, timezone
from pathlib import Path
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select

from src.api.models import Deployment


@pytest_asyncio.fixture(autouse=True)
async def developer_principals(db_session, test_user, other_user):
    test_user.roles = ["DEVELOPER"]
    other_user.roles = ["DEVELOPER"]
    await db_session.commit()


@pytest.mark.asyncio
async def test_registered_agent_api_key_authenticates_runtime_status_and_heartbeat(
    client: AsyncClient, db_session, test_user
):
    register_response = await client.post(
        "/v1/agents/register",
        json={
            "name": "runtime-auth-contract",
            "description": "runtime auth contract coverage",
            "metadata": {"demo": True},
            "capabilities": ["heartbeat"],
        },
    )

    assert register_response.status_code == 200
    payload = register_response.json()
    agent_id = payload["agent_id"]
    api_key = payload["api_key"]
    assert api_key.startswith("mutx_agent_")
    assert payload["desired_action"] == "register"
    assert payload["desired_state"] == "registered"
    assert payload["observed_state"] is None
    assert payload["target_revision"] == 1

    runtime_headers = {"Authorization": f"Bearer {api_key}"}

    status_response = await client.get(f"/v1/agents/{agent_id}/status", headers=runtime_headers)
    assert status_response.status_code == 200
    assert status_response.json()["agent_id"] == agent_id
    assert status_response.json()["status"] == "creating"
    assert status_response.json()["target_revision"] == 1
    assert status_response.json()["observed_state"] is None
    assert status_response.json()["uptime_seconds"] is None

    heartbeat_response = await client.post(
        "/v1/agents/heartbeat",
        headers=runtime_headers,
        json={
            "agent_id": agent_id,
            "status": "running",
            "message": "contract ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    assert heartbeat_response.status_code == 200
    assert heartbeat_response.json()["agent_id"] == agent_id


@pytest.mark.asyncio
async def test_agent_status_requires_runtime_auth_not_just_agent_id(
    client_no_auth: AsyncClient, test_agent
):
    unauthenticated_response = await client_no_auth.get(f"/v1/agents/{test_agent.id}/status")

    assert unauthenticated_response.status_code == 401
    assert unauthenticated_response.json()["detail"] == "Missing authorization header"


@pytest.mark.asyncio
async def test_agent_commands_static_route_is_not_shadowed(client: AsyncClient):
    register_response = await client.post(
        "/v1/agents/register",
        json={
            "name": "commands-route-contract",
            "description": "static route ordering coverage",
            "metadata": {},
            "capabilities": ["commands"],
        },
    )
    assert register_response.status_code == 200
    agent = register_response.json()

    response = await client.get(
        "/v1/agents/commands",
        params={"agent_id": agent["agent_id"]},
        headers={"Authorization": f"Bearer {agent['api_key']}"},
    )

    assert response.status_code == 200
    assert response.json() == {"commands": []}


@pytest.mark.asyncio
async def test_connected_agent_runtime_sdk_uses_status_auth_contract(client: AsyncClient):
    import importlib.util

    module_path = Path(__file__).resolve().parents[2] / "sdk" / "mutx" / "agent_runtime.py"
    spec = importlib.util.spec_from_file_location("mutx_agent_runtime_module", module_path)
    agent_runtime_module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(agent_runtime_module)
    MutxAgentClient = agent_runtime_module.MutxAgentClient

    register_response = await client.post(
        "/v1/agents/register",
        json={
            "name": "sdk-connect-contract",
            "description": "sdk connect contract coverage",
            "metadata": {"demo": True},
            "capabilities": ["heartbeat"],
        },
    )

    assert register_response.status_code == 200
    payload = register_response.json()

    sdk_client = MutxAgentClient(mutx_url="http://testserver")

    transport = client._transport
    sdk_client._client = __import__("httpx").AsyncClient(
        transport=transport,
        base_url=sdk_client.api_base_url,
        timeout=sdk_client.timeout,
        headers={"Content-Type": "application/json"},
    )

    connected = await sdk_client.connect(payload["agent_id"], payload["api_key"])

    assert connected is True
    assert sdk_client.is_registered is True

    heartbeat_response = await sdk_client.heartbeat(status="running", message="sdk connect ok")
    assert heartbeat_response["agent_id"] == payload["agent_id"]

    await sdk_client.close()


@pytest.mark.asyncio
async def test_agent_status_auth_rejects_other_agent_api_key(client: AsyncClient):
    first = await client.post(
        "/v1/agents/register",
        json={
            "name": "owner-a",
            "description": "ownership check a",
            "metadata": {"demo": True},
            "capabilities": ["heartbeat"],
        },
    )
    second = await client.post(
        "/v1/agents/register",
        json={
            "name": "owner-b",
            "description": "ownership check b",
            "metadata": {"demo": True},
            "capabilities": ["heartbeat"],
        },
    )

    assert first.status_code == 200
    assert second.status_code == 200

    first_payload = first.json()
    second_payload = second.json()

    wrong_auth_response = await client.get(
        f"/v1/agents/{second_payload['agent_id']}/status",
        headers={"Authorization": f"Bearer {first_payload['api_key']}"},
    )

    assert wrong_auth_response.status_code == 403
    assert wrong_auth_response.json()["detail"] == "Agent ID mismatch"


@pytest.mark.asyncio
async def test_heartbeat_event_payload_shape_and_timing_contract(client: AsyncClient, monkeypatch):
    emitted_events = []

    async def fake_trigger_webhook_event(*args, **kwargs):
        # Preserve call shape: (db, user_id, event, payload)
        emitted_events.append((args[2], args[3]))
        return 1

    monkeypatch.setattr(
        "src.api.routes.agent_runtime.trigger_webhook_event", fake_trigger_webhook_event
    )

    register_response = await client.post(
        "/v1/agents/register",
        json={
            "name": "runtime-heartbeat-shape",
            "description": "heartbeat contract coverage",
            "metadata": {"contract": True},
            "capabilities": ["heartbeat"],
        },
    )
    assert register_response.status_code == 200
    payload = register_response.json()
    agent_id = payload["agent_id"]
    api_key = payload["api_key"]

    # 1) current Agent-scoped evidence records a live state transition.
    heartbeat_response = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "agent_id": agent_id,
            "status": "running",
            "message": "still running",
            "timestamp": "2026-03-14T14:00:00Z",
            "platform": "test-platform",
            "hostname": "test-host",
            "target_revision": payload["target_revision"],
        },
    )
    assert heartbeat_response.status_code == 200

    body = heartbeat_response.json()
    assert body["status"] == "ok"
    assert body["agent_id"] == agent_id
    assert "timestamp" in body

    assert len(emitted_events) == 2
    event_name, event_payload = emitted_events.pop(0)
    assert event_name == "agent.heartbeat"
    assert event_payload["agent_id"] == agent_id
    assert event_payload["agent_name"] == "runtime-heartbeat-shape"
    assert event_payload["status"] == "running"
    assert event_payload["reported_status"] == "running"
    assert event_payload["previous_status"] == "creating"
    assert event_payload["timestamp"] == body["timestamp"]
    status_name, initial_status_payload = emitted_events.pop(0)
    assert status_name == "agent.status"
    assert initial_status_payload["old_status"] == "creating"
    assert initial_status_payload["new_status"] == "running"

    # 2) status change emits heartbeat + status event with identical timestamp
    emitted_events.clear()

    status_change_response = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "agent_id": agent_id,
            "status": "failed",
            "message": "stopped by policy",
            "timestamp": "2026-03-14T14:01:00Z",
            "platform": "test-platform",
            "hostname": "test-host",
            "target_revision": payload["target_revision"],
        },
    )
    assert status_change_response.status_code == 200

    status_body = status_change_response.json()

    assert len(emitted_events) == 2
    heartbeat_event_name, heartbeat_event_payload = emitted_events[0]
    status_event_name, status_event_payload = emitted_events[1]

    assert heartbeat_event_name == "agent.heartbeat"
    assert status_event_name == "agent.status"
    assert heartbeat_event_payload["agent_id"] == agent_id
    assert status_event_payload["agent_id"] == agent_id
    assert heartbeat_event_payload["timestamp"] == status_body["timestamp"]
    assert status_event_payload["timestamp"] == status_body["timestamp"]
    assert status_event_payload["old_status"] == "running"
    assert status_event_payload["new_status"] == "failed"


@pytest.mark.asyncio
async def test_identical_current_deployment_heartbeat_does_not_repeat_transition_webhooks(
    client: AsyncClient, db_session, monkeypatch
):
    emitted_events: list[str] = []

    async def fake_trigger_webhook_event(_db, _user_id, event, _payload):
        emitted_events.append(event)
        return 1

    async def fake_trigger_deployment_event(
        _db, _user_id, _deployment_id, _agent_id, *, event_type, status=None
    ):
        emitted_events.append("deployment.event")
        return 1

    monkeypatch.setattr(
        "src.api.routes.agent_runtime.trigger_webhook_event", fake_trigger_webhook_event
    )
    monkeypatch.setattr(
        "src.api.routes.agent_runtime.trigger_deployment_event", fake_trigger_deployment_event
    )

    register = await client.post(
        "/v1/agents/register",
        json={"name": "duplicate-heartbeat", "metadata": {}, "capabilities": ["heartbeat"]},
    )
    assert register.status_code == 200
    runtime = register.json()
    deployed = await client.post(f"/v1/agents/{runtime['agent_id']}/deploy")
    assert deployed.status_code == 200
    deployment = (
        await db_session.execute(
            select(Deployment).where(Deployment.agent_id == uuid.UUID(runtime["agent_id"]))
        )
    ).scalar_one()
    headers = {"Authorization": f"Bearer {runtime['api_key']}"}
    body = {
        "agent_id": runtime["agent_id"],
        "status": "running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "deployment_id": str(deployment.id),
        "target_revision": deployment.target_revision,
    }

    first = await client.post("/v1/agents/heartbeat", headers=headers, json=body)
    assert first.status_code == 200
    assert emitted_events == ["agent.heartbeat", "agent.status", "deployment.event"]
    emitted_events.clear()

    second = await client.post(
        "/v1/agents/heartbeat",
        headers=headers,
        json={**body, "timestamp": datetime.now(timezone.utc).isoformat()},
    )
    assert second.status_code == 200
    assert emitted_events == ["agent.heartbeat"]


@pytest.mark.asyncio
async def test_authenticated_termination_requires_current_deployment_revision(
    client: AsyncClient, db_session
):
    register = await client.post(
        "/v1/agents/register",
        json={"name": "termination-proof", "metadata": {}, "capabilities": ["heartbeat"]},
    )
    assert register.status_code == 200
    runtime = register.json()
    headers = {"Authorization": f"Bearer {runtime['api_key']}"}

    deployed = await client.post(f"/v1/agents/{runtime['agent_id']}/deploy")
    assert deployed.status_code == 200
    deployment_id = uuid.UUID(deployed.json()["deployment_id"])
    deployment = await db_session.get(Deployment, deployment_id)
    old_revision = deployment.target_revision

    terminated = await client.delete(f"/v1/deployments/{deployment_id}")
    assert terminated.status_code == 204
    await db_session.refresh(deployment)
    assert deployment.status == "pending"
    assert deployment.desired_action == "terminate"
    assert deployment.desired_state == "terminated"
    current_revision = deployment.target_revision
    assert current_revision == old_revision + 1

    stale = await client.post(
        "/v1/agents/heartbeat",
        headers=headers,
        json={
            "agent_id": runtime["agent_id"],
            "status": "stopped",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deployment_id": str(deployment_id),
            "target_revision": old_revision,
        },
    )
    assert stale.status_code == 200
    await db_session.refresh(deployment)
    assert deployment.status == "pending"
    assert deployment.observed_state is None

    confirmed = await client.post(
        "/v1/agents/heartbeat",
        headers=headers,
        json={
            "agent_id": runtime["agent_id"],
            "status": "stopped",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deployment_id": str(deployment_id),
            "target_revision": current_revision,
        },
    )
    assert confirmed.status_code == 200
    await db_session.refresh(deployment)
    assert deployment.status == "killed"
    assert deployment.desired_action == "terminate"
    assert deployment.desired_state == "terminated"
    assert deployment.observed_state == "stopped"
    assert deployment.observed_revision == current_revision


@pytest.mark.asyncio
async def test_heartbeat_webhook_failure_does_not_fail_heartbeat_response(
    client: AsyncClient, monkeypatch
):
    call_log = {
        "agent.heartbeat": 0,
        "agent.status": 0,
    }

    async def flaky_trigger_webhook_event(*args, **kwargs):
        # Preserve call shape: (db, user_id, event, payload)
        event_name = args[2]
        call_log[event_name] = call_log.get(event_name, 0) + 1

        if event_name == "agent.heartbeat":
            raise RuntimeError("webhook transport unavailable")

        return 1

    monkeypatch.setattr(
        "src.api.routes.agent_runtime.trigger_webhook_event", flaky_trigger_webhook_event
    )

    register_response = await client.post(
        "/v1/agents/register",
        json={
            "name": "runtime-heartbeat-failure",
            "description": "heartbeat failure coverage",
            "metadata": {"contract": "failure"},
            "capabilities": ["heartbeat"],
        },
    )
    assert register_response.status_code == 200
    payload = register_response.json()
    agent_id = payload["agent_id"]
    api_key = payload["api_key"]

    response = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "agent_id": agent_id,
            "status": "running",
            "message": "heartbeat still accepted despite webhook failure",
            "platform": "test-platform",
            "hostname": "test-host",
            "timestamp": "2026-03-14T14:02:00Z",
            "target_revision": payload["target_revision"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["agent_id"] == agent_id
    assert "timestamp" in body

    assert call_log["agent.heartbeat"] == 1
    assert call_log["agent.status"] == 1
