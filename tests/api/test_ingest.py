from datetime import datetime

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ingest_agent_status(client: AsyncClient, test_user, test_agent):
    response = await client.post(
        "/ingest/agent-status",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "node_id": "test-node"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "updated"

@pytest.mark.asyncio
async def test_ingest_metrics(client: AsyncClient, test_user, test_agent):
    response = await client.post(
        "/ingest/metrics",
        json={
            "agent_id": str(test_agent.id),
            "cpu_usage": 50.0,
            "memory_usage": 1024.0
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"

@pytest.mark.asyncio
async def test_ingest_deployment(client: AsyncClient, test_user, test_deployment):
    response = await client.post(
        "/ingest/deployment",
        json={
            "deployment_id": str(test_deployment.id),
            "event": "healthy",
            "status": "running",
            "node_id": "test-node"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "processed"

@pytest.mark.asyncio
async def test_ingest_unauthorized_agent(client: AsyncClient, test_user):
    # Mocking another user's agent
    other_agent_id = "00000000-0000-0000-0000-000000000000"
    
    response = await client.post(
        "/ingest/agent-status",
        json={
            "agent_id": other_agent_id,
            "status": "running"
        }
    )
    # Since agent_id doesn't exist in DB, it should be 404
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_agent_runtime_heartbeat_triggers_heartbeat_webhook_without_status_change(
    client: AsyncClient, db_session, test_agent, monkeypatch
):
    from src.api.routes.agent_runtime import get_current_agent
    import src.api.routes.agent_runtime as agent_runtime_routes
    from src.api.models.models import AgentStatus

    test_agent.status = AgentStatus.RUNNING.value
    await db_session.commit()

    delivered: list[tuple[str, dict]] = []

    async def mock_trigger_webhook_event(db, event, payload):
        delivered.append((event, payload))
        return 1

    monkeypatch.setattr(agent_runtime_routes, "trigger_webhook_event", mock_trigger_webhook_event)
    client.app.dependency_overrides[get_current_agent] = lambda: test_agent

    response = await client.post(
        "/agents/heartbeat",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "message": "still alive",
            "platform": "linux",
            "hostname": "agent-01",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    assert response.status_code == 200
    assert [event for event, _ in delivered] == ["agent.heartbeat"]
    assert delivered[0][1]["agent_id"] == str(test_agent.id)
    assert delivered[0][1]["status"] == "running"
    assert delivered[0][1]["previous_status"] == "running"
    assert delivered[0][1]["message"] == "still alive"
    assert delivered[0][1]["platform"] == "linux"
    assert delivered[0][1]["hostname"] == "agent-01"
    assert delivered[0][1]["timestamp"]

    client.app.dependency_overrides.pop(get_current_agent, None)


@pytest.mark.asyncio
async def test_agent_runtime_heartbeat_emits_status_webhook_on_status_change(
    client: AsyncClient, db_session, test_agent, monkeypatch
):
    from src.api.routes.agent_runtime import get_current_agent
    import src.api.routes.agent_runtime as agent_runtime_routes
    from src.api.models.models import AgentStatus

    test_agent.status = AgentStatus.RUNNING.value
    await db_session.commit()

    test_agent.status = AgentStatus.CREATING.value
    await db_session.commit()

    delivered: list[tuple[str, dict]] = []

    async def mock_trigger_webhook_event(db, event, payload):
        delivered.append((event, payload))
        return 1

    monkeypatch.setattr(agent_runtime_routes, "trigger_webhook_event", mock_trigger_webhook_event)
    client.app.dependency_overrides[get_current_agent] = lambda: test_agent

    response = await client.post(
        "/agents/heartbeat",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    assert response.status_code == 200
    assert [event for event, _ in delivered] == ["agent.heartbeat", "agent.status"]
    assert delivered[1][1]["old_status"] == "creating"
    assert delivered[1][1]["new_status"] == "running"

    client.app.dependency_overrides.pop(get_current_agent, None)


@pytest.mark.asyncio
async def test_agent_runtime_heartbeat_returns_ok_when_webhook_dispatch_fails(
    client: AsyncClient, db_session, test_agent, monkeypatch
):
    from src.api.routes.agent_runtime import get_current_agent
    import src.api.routes.agent_runtime as agent_runtime_routes
    from src.api.models.models import AgentStatus

    test_agent.status = AgentStatus.CREATING.value
    await db_session.commit()

    emitted_events: list[str] = []

    async def mock_trigger_webhook_event(db, event, payload):
        emitted_events.append(event)
        raise RuntimeError("webhook dispatch unavailable")

    monkeypatch.setattr(agent_runtime_routes, "trigger_webhook_event", mock_trigger_webhook_event)
    client.app.dependency_overrides[get_current_agent] = lambda: test_agent

    response = await client.post(
        "/agents/heartbeat",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    assert response.status_code == 200
    assert emitted_events == ["agent.heartbeat", "agent.status"]

    await db_session.refresh(test_agent)
    assert test_agent.status == AgentStatus.RUNNING.value
    assert test_agent.last_heartbeat is not None

    client.app.dependency_overrides.pop(get_current_agent, None)


@pytest.mark.asyncio
async def test_runtime_manager_delete_runtime_clears_default_runtime_reference():
    from src.api.services.agent_runtime import RuntimeConfig, RuntimeManager

    RuntimeManager._runtimes = {}
    RuntimeManager._default_runtime = None

    runtime = RuntimeManager.get_or_create_default(RuntimeConfig(default_timeout=123))

    assert RuntimeManager.delete_runtime(runtime.runtime_id) is True
    assert RuntimeManager.get_runtime(runtime.runtime_id) is None
    assert RuntimeManager._default_runtime is None

    replacement = RuntimeManager.get_or_create_default(RuntimeConfig(default_timeout=456))

    assert replacement.runtime_id != runtime.runtime_id
    assert replacement.config.default_timeout == 456

    RuntimeManager._runtimes = {}
    RuntimeManager._default_runtime = None
