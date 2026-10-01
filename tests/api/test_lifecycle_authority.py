"""Lifecycle state must come from the owner or authenticated runtime evidence."""

from datetime import datetime, timedelta, timezone
import json
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import (
    Alert,
    AlertType,
    Agent,
    AgentStatus,
    Deployment,
    DeploymentEvent,
    DeploymentVersion,
)
from src.api.services.deployment_lifecycle import (
    record_runtime_heartbeat,
    create_deployment_record,
    request_agent_stop,
    request_deployment_action,
)


@pytest_asyncio.fixture(autouse=True)
async def developer_principal(db_session: AsyncSession, test_user):
    test_user.roles = ["DEVELOPER"]
    await db_session.commit()


@pytest.mark.asyncio
async def test_deployment_creation_records_intent_without_inventing_execution(
    client: AsyncClient, test_agent: Agent, db_session: AsyncSession
):
    response = await client.post(
        "/v1/deployments",
        json={"agent_id": str(test_agent.id), "replicas": 2},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["desired_action"] == "create"
    assert body["desired_state"] == "running"
    assert body["target_revision"] == 1
    assert body["observed_state"] is None
    assert body["started_at"] is None

    await db_session.refresh(test_agent)
    assert test_agent.status == AgentStatus.CREATING.value
    assert test_agent.observed_state is None


@pytest.mark.asyncio
async def test_agent_wide_stop_fences_pending_and_ready_targets_without_claiming_stopped(
    client: AsyncClient,
    test_agent: Agent,
    test_deployment: Deployment,
    db_session: AsyncSession,
):
    test_agent.status = AgentStatus.RUNNING.value
    test_deployment.status = "running"
    test_deployment.desired_state = "running"
    test_deployment.desired_action = "create"
    test_deployment.target_revision = 4
    ready = Deployment(
        agent_id=test_agent.id,
        status="ready",
        replicas=1,
    )
    pending = Deployment(
        agent_id=test_agent.id,
        status="pending",
        replicas=1,
    )
    ready.desired_state = "running"
    ready.desired_action = "create"
    ready.target_revision = 7
    pending.desired_state = "running"
    pending.desired_action = "create"
    pending.target_revision = 2
    test_deployment.desired_state = "running"
    test_deployment.desired_action = "create"
    test_deployment.target_revision = 4
    db_session.add_all([ready, pending])
    await db_session.commit()
    original_started_at = test_deployment.started_at

    response = await client.post(f"/v1/agents/{test_agent.id}/stop")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "pending"
    assert body["desired_action"] == "stop"
    assert body["desired_state"] == "stopped"
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)
    await db_session.refresh(ready)
    await db_session.refresh(pending)
    assert test_agent.status == AgentStatus.RUNNING.value
    for deployment, revision in ((test_deployment, 4), (ready, 7), (pending, 2)):
        assert deployment.status in {"running", "ready", "pending"}
        assert deployment.desired_action == "stop"
        assert deployment.desired_state == "stopped"
        assert deployment.target_revision == revision + 1
        assert deployment.ended_at is None
    assert test_deployment.started_at == original_started_at


@pytest.mark.asyncio
async def test_agent_stop_preserves_historical_stopped_and_killed_targets(
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
):
    test_agent.status = AgentStatus.RUNNING.value
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 2
    stopped = Deployment(
        agent_id=test_agent.id,
        status="stopped",
        replicas=1,
        desired_action="stop",
        desired_state="stopped",
        target_revision=3,
    )
    killed = Deployment(
        agent_id=test_agent.id,
        status="killed",
        replicas=1,
        desired_action="terminate",
        desired_state="terminated",
        target_revision=4,
    )
    db_session.add_all([stopped, killed])
    await db_session.commit()

    agent = await request_agent_stop(agent_id=test_agent.id, db=db_session)
    await db_session.commit()
    await db_session.refresh(test_deployment)
    await db_session.refresh(stopped)
    await db_session.refresh(killed)

    assert test_deployment.agent_stop_revision == agent.stop_fence_revision
    assert test_deployment.target_revision == 3
    assert stopped.agent_stop_revision is None
    assert stopped.target_revision == 3
    assert killed.agent_stop_revision is None
    assert killed.target_revision == 4


@pytest.mark.asyncio
async def test_unbound_runtime_heartbeat_is_liveness_only_after_deployment_intent(
    client: AsyncClient,
    test_agent: Agent,
    db_session: AsyncSession,
):
    # The fixture agent already has an authenticated runtime key only after register.
    register_response = await client.post(
        "/v1/agents/register",
        json={"name": "authority-heartbeat", "metadata": {}, "capabilities": ["heartbeat"]},
    )
    assert register_response.status_code == 200
    runtime = register_response.json()
    agent_id = runtime["agent_id"]
    agent = await db_session.get(Agent, uuid.UUID(agent_id))

    deploy_response = await client.post(f"/v1/agents/{agent_id}/deploy")
    assert deploy_response.status_code == 200
    deployment = (
        await db_session.execute(
            select(Deployment).where(Deployment.agent_id == uuid.UUID(agent_id))
        )
    ).scalar_one()
    previous_heartbeat = agent.last_heartbeat

    heartbeat_response = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {runtime['api_key']}"},
        json={
            "agent_id": agent_id,
            "status": "running",
            "message": "listener connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    assert heartbeat_response.status_code == 200
    await db_session.refresh(agent)
    await db_session.refresh(deployment)
    assert agent.last_heartbeat is not None
    assert agent.last_heartbeat != previous_heartbeat
    assert deployment.status == "pending"
    assert deployment.observed_state is None
    assert deployment.started_at is None


@pytest.mark.asyncio
async def test_command_listener_heartbeat_cannot_confirm_deployment_readiness(
    client: AsyncClient, db_session: AsyncSession
):
    register_response = await client.post(
        "/v1/agents/register",
        json={"name": "listener-only", "metadata": {}, "capabilities": ["heartbeat"]},
    )
    assert register_response.status_code == 200
    runtime = register_response.json()
    agent_id = runtime["agent_id"]
    deploy_response = await client.post(f"/v1/agents/{agent_id}/deploy")
    assert deploy_response.status_code == 200
    deployment = await db_session.get(
        Deployment, uuid.UUID(deploy_response.json()["deployment_id"])
    )
    agent = await db_session.get(Agent, uuid.UUID(agent_id))
    previous_status = agent.status

    response = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {runtime['api_key']}"},
        json={
            "agent_id": agent_id,
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "component": "command_listener",
            "deployment_id": str(deployment.id),
            "target_revision": deployment.target_revision,
        },
    )

    assert response.status_code == 200
    await db_session.refresh(agent)
    await db_session.refresh(deployment)
    assert agent.last_heartbeat is not None
    assert agent.status == previous_status
    assert deployment.status == "pending"
    assert deployment.observed_state is None
    assert deployment.started_at is None


@pytest.mark.asyncio
async def test_user_agent_status_ingest_is_reported_without_runtime_state_mutation(
    client: AsyncClient, test_agent: Agent, db_session: AsyncSession
):
    before = (
        test_agent.status,
        test_agent.last_heartbeat,
        getattr(test_agent, "observed_state", None),
    )

    response = await client.post(
        "/v1/ingest/agent-status",
        json={"agent_id": str(test_agent.id), "status": "failed", "error_message": "reported"},
    )

    assert response.status_code == 200
    await db_session.refresh(test_agent)
    assert (
        test_agent.status,
        test_agent.last_heartbeat,
        getattr(test_agent, "observed_state", None),
    ) == before


@pytest.mark.asyncio
async def test_user_deployment_ingest_preserves_reported_event_without_completing_intent(
    client: AsyncClient, test_agent: Agent, test_deployment: Deployment, db_session: AsyncSession
):
    original_status = test_deployment.status
    original_started_at = test_deployment.started_at

    response = await client.post(
        "/v1/ingest/deployment",
        json={
            "deployment_id": str(test_deployment.id),
            "event": "stopped",
            "status": "stopped",
            "node_id": "reported-node",
        },
    )

    assert response.status_code == 200
    await db_session.refresh(test_deployment)
    assert test_deployment.status == original_status
    assert test_deployment.started_at == original_started_at
    assert test_deployment.ended_at is None
    assert test_deployment.node_id is None
    assert test_deployment.observed_state is None
    events = (
        (
            await db_session.execute(
                select(DeploymentEvent).where(DeploymentEvent.deployment_id == test_deployment.id)
            )
        )
        .scalars()
        .all()
    )
    assert any(
        event.event_type == "stopped"
        and event.status == "stopped"
        and event.node_id == "reported-node"
        for event in events
    )


@pytest.mark.asyncio
async def test_agent_stop_fence_survives_target_actions_and_requires_newer_bound_evidence(
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
):
    test_agent.status = AgentStatus.FAILED.value
    targets = [
        test_deployment,
        Deployment(agent_id=test_agent.id, status="ready", replicas=1),
        Deployment(agent_id=test_agent.id, status="pending", replicas=1),
    ]
    for revision, target in enumerate(targets, start=1):
        target.target_revision = revision
        target.desired_action = "create"
        target.desired_state = "running"
        target.observed_state = "running" if revision < 3 else None
        target.observed_revision = revision if revision < 3 else None
        target.observed_at = datetime.now(timezone.utc) if revision < 3 else None
    db_session.add_all(targets[1:])
    await db_session.commit()
    original_revisions = [target.target_revision for target in targets]

    agent = await request_agent_stop(agent_id=test_agent.id, db=db_session)
    first_fence = agent.stop_fence_revision
    fenced_revisions = [target.target_revision for target in targets]
    assert agent.desired_action == "stop"
    assert agent.desired_state == "stopped"
    assert first_fence == agent.target_revision
    assert all(target.agent_stop_revision == first_fence for target in targets)
    assert fenced_revisions == [revision + 1 for revision in original_revisions]

    # An identical target stop is idempotent and preserves the accepted fence revision.
    target, agent, _ = await request_deployment_action(
        deployment_id=targets[0].id,
        db=db_session,
        action="scale",
        requested_replicas=0,
    )
    assert target.agent_stop_revision == first_fence
    assert target.target_revision == fenced_revisions[0]
    assert agent.stop_fence_revision == first_fence
    assert agent.desired_action == "stop"
    assert targets[1].target_revision == fenced_revisions[1]
    await db_session.commit()

    # A genuine Agent-wide deploy clears the stop fence before a newer stop is requested.
    new_target = await create_deployment_record(
        agent=test_agent,
        db=db_session,
        event_type="deploy",
        action="deploy",
    )
    await db_session.commit()
    targets.append(new_target)
    prior_revisions = [target.target_revision for target in targets]

    agent = await request_agent_stop(agent_id=test_agent.id, db=db_session)
    current_fence = agent.stop_fence_revision
    current_revisions = [target.target_revision for target in targets]
    assert current_fence > first_fence
    assert all(target.agent_stop_revision == current_fence for target in targets)
    assert current_revisions == [revision + 1 for revision in prior_revisions]
    for target, old_revision in zip(targets, prior_revisions, strict=True):
        await record_runtime_heartbeat(
            db=db_session,
            agent_id=test_agent.id,
            deployment_id=target.id,
            target_revision=old_revision,
            status="stopped",
            now=datetime.now(timezone.utc),
        )
    await db_session.commit()
    await db_session.refresh(agent)
    assert agent.stop_fence_revision == current_fence
    assert agent.stop_fence_completed_revision is None

    # Running evidence under the current fence is visible on its target, but never revives Agent.
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=targets[0].id,
        target_revision=current_revisions[0],
        status="running",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    await db_session.refresh(agent)
    await db_session.refresh(targets[0])
    assert targets[0].observed_state == "running"
    assert agent.status == AgentStatus.FAILED.value
    assert agent.stop_fence_completed_revision is None

    # The fence closes only after every current target reports stopped.
    for index, target in enumerate(targets):
        await record_runtime_heartbeat(
            db=db_session,
            agent_id=test_agent.id,
            deployment_id=target.id,
            target_revision=current_revisions[index],
            status="stopped",
            now=datetime.now(timezone.utc),
        )
        await db_session.commit()
        await db_session.refresh(agent)
        if index < len(targets) - 1:
            assert agent.stop_fence_completed_revision is None
            assert agent.status != AgentStatus.STOPPED.value
    assert agent.stop_fence_completed_revision == current_fence
    assert agent.status == AgentStatus.STOPPED.value
    assert agent.observed_state == AgentStatus.STOPPED.value


@pytest.mark.asyncio
async def test_standalone_agent_stop_uses_current_agent_revision(
    client: AsyncClient, db_session: AsyncSession
):
    register = await client.post(
        "/v1/agents/register",
        json={"name": "standalone-stop", "metadata": {}, "capabilities": ["heartbeat"]},
    )
    assert register.status_code == 200
    runtime = register.json()
    agent_id = runtime["agent_id"]
    agent = await db_session.get(Agent, uuid.UUID(agent_id))

    running = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {runtime['api_key']}"},
        json={
            "agent_id": agent_id,
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_revision": runtime["target_revision"],
        },
    )
    assert running.status_code == 200
    await db_session.refresh(agent)
    assert agent.status == AgentStatus.RUNNING.value

    stopped = await client.post(f"/v1/agents/{agent_id}/stop")
    assert stopped.status_code == 200
    stop_receipt = stopped.json()
    assert stop_receipt["status"] == "pending"
    assert stop_receipt["target_revision"] == runtime["target_revision"] + 1

    unversioned_stop = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {runtime['api_key']}"},
        json={
            "agent_id": agent_id,
            "status": "stopped",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert unversioned_stop.status_code == 200
    await db_session.refresh(agent)
    assert agent.status == AgentStatus.RUNNING.value
    assert agent.stop_fence_completed_revision is None

    stop_ack = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {runtime['api_key']}"},
        json={
            "agent_id": agent_id,
            "status": "stopped",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_revision": stop_receipt["target_revision"],
        },
    )
    assert stop_ack.status_code == 200
    await db_session.refresh(agent)
    assert agent.status == AgentStatus.STOPPED.value
    assert agent.stop_fence_completed_revision == stop_receipt["target_revision"]

    stale = await client.post(
        "/v1/agents/heartbeat",
        headers={"Authorization": f"Bearer {runtime['api_key']}"},
        json={
            "agent_id": agent_id,
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_revision": runtime["target_revision"],
        },
    )
    assert stale.status_code == 200
    await db_session.refresh(agent)
    assert agent.status == AgentStatus.STOPPED.value


@pytest.mark.asyncio
async def test_historical_revision_zero_can_receive_new_bound_evidence(
    client: AsyncClient,
    test_agent: Agent,
    test_deployment: Deployment,
):
    from src.api.auth.dependencies import get_current_agent

    assert test_deployment.target_revision == 0
    assert test_deployment.observed_state is None
    client.app.dependency_overrides[get_current_agent] = lambda: test_agent
    response = await client.post(
        "/v1/agents/heartbeat",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deployment_id": str(test_deployment.id),
            "target_revision": 0,
        },
    )

    assert response.status_code == 200
    client.app.dependency_overrides.pop(get_current_agent, None)
    assert test_deployment.status == "running"
    assert test_deployment.observed_state == "running"
    assert test_deployment.observed_revision == 0
    assert test_deployment.observed_at is not None


@pytest.mark.asyncio
async def test_only_current_bound_runtime_evidence_reconciles_stale_failure(
    client: AsyncClient,
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
):
    from src.api.auth.dependencies import get_current_agent

    test_agent.status = AgentStatus.FAILED.value
    test_agent.target_revision = 3
    test_deployment.status = "failed"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 2
    test_deployment.observed_state = "failed"
    test_deployment.observed_revision = 2
    test_deployment.observed_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    alert = Alert(
        agent_id=test_agent.id,
        type=AlertType.AGENT_DOWN,
        message="stale runtime",
        resolved=False,
    )
    db_session.add(alert)
    await db_session.commit()
    client.app.dependency_overrides[get_current_agent] = lambda: test_agent

    unbound = await client.post(
        "/v1/agents/heartbeat",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert unbound.status_code == 200
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)
    await db_session.refresh(alert)
    assert test_agent.status == AgentStatus.FAILED.value
    assert test_deployment.status == "failed"
    assert alert.resolved is False

    current = await client.post(
        "/v1/agents/heartbeat",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deployment_id": str(test_deployment.id),
            "target_revision": 2,
        },
    )
    assert current.status_code == 200
    client.app.dependency_overrides.pop(get_current_agent, None)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)
    await db_session.refresh(alert)
    assert test_agent.status == AgentStatus.RUNNING.value
    assert test_deployment.status == "running"
    assert test_deployment.observed_revision == 2
    assert alert.resolved is True
    assert alert.resolved_at is not None


@pytest.mark.asyncio
async def test_runtime_reconciliation_handles_multiple_failed_siblings(
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
):
    test_agent.status = AgentStatus.FAILED.value
    test_agent.target_revision = 7
    failed_siblings = [
        test_deployment,
        Deployment(
            agent_id=test_agent.id,
            status="failed",
            replicas=1,
            desired_action="deploy",
            desired_state="running",
            target_revision=5,
            observed_state="failed",
            observed_revision=5,
            observed_at=datetime.now(timezone.utc) - timedelta(minutes=2),
        ),
    ]
    for deployment, revision in zip(failed_siblings, (3, 5), strict=True):
        deployment.status = "failed"
        deployment.desired_action = "deploy"
        deployment.desired_state = "running"
        deployment.target_revision = revision
        deployment.observed_state = "failed"
        deployment.observed_revision = revision
        deployment.observed_at = datetime.now(timezone.utc) - timedelta(minutes=2)
    running = Deployment(
        agent_id=test_agent.id,
        status="pending",
        replicas=1,
        desired_action="restart",
        desired_state="running",
        target_revision=6,
    )
    alert = Alert(
        agent_id=test_agent.id,
        type=AlertType.AGENT_DOWN,
        message="failed siblings remain",
        resolved=False,
    )
    db_session.add_all([failed_siblings[1], running, alert])
    await db_session.commit()

    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=running.id,
        target_revision=6,
        status="running",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    await db_session.refresh(test_agent)
    await db_session.refresh(alert)

    assert test_agent.status == AgentStatus.RUNNING.value
    assert alert.resolved is False


@pytest.mark.asyncio
async def test_aggregate_ignores_observations_from_superseded_target_revisions(
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
):
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 8
    test_deployment.status = "pending"
    test_deployment.desired_action = "restart"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 2
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 1
    other = Deployment(
        agent_id=test_agent.id,
        status="deploying",
        replicas=1,
        desired_action="deploy",
        desired_state="running",
        target_revision=5,
    )
    db_session.add(other)
    await db_session.commit()

    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=other.id,
        target_revision=5,
        status="failed",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    await db_session.refresh(test_agent)

    assert test_agent.status == AgentStatus.FAILED.value
    assert test_agent.observed_state == AgentStatus.FAILED.value


@pytest.mark.asyncio
@pytest.mark.parametrize("older_observation", [None, "running"])
async def test_one_stopped_target_cannot_confirm_agent_stop_with_unknown_work(
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
    older_observation: str | None,
):
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 8
    test_deployment.status = "pending"
    test_deployment.desired_action = "restart"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 2
    test_deployment.observed_state = older_observation
    test_deployment.observed_revision = 1 if older_observation else None
    stopped_target = Deployment(
        agent_id=test_agent.id,
        status="pending",
        desired_action="stop",
        desired_state="stopped",
        target_revision=5,
    )
    db_session.add(stopped_target)
    await db_session.commit()

    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=stopped_target.id,
        target_revision=5,
        status="stopped",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    await db_session.refresh(test_agent)

    assert stopped_target.status == "stopped"
    assert test_deployment.status == "pending"
    assert test_agent.status == AgentStatus.RUNNING.value
    assert test_agent.observed_state is None


@pytest.mark.asyncio
async def test_rollback_restores_snapshot_through_the_lifecycle_owner(
    db_session: AsyncSession,
    test_agent: Agent,
    test_deployment: Deployment,
):
    test_deployment.status = "running"
    test_deployment.replicas = 4
    test_deployment.version = "v4"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 3
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 3
    historical_version = DeploymentVersion(
        deployment_id=test_deployment.id,
        version=1,
        status="superseded",
        config_snapshot=json.dumps({"replicas": 1, "version": "v1"}),
    )
    db_session.add(historical_version)
    await db_session.commit()

    deployment, _, _ = await request_deployment_action(
        deployment_id=test_deployment.id,
        db=db_session,
        action="rollback",
        rollback_version=1,
    )
    await db_session.commit()

    assert deployment.replicas == 1
    assert deployment.version == "v1"
    assert deployment.status == "pending"
    assert deployment.target_revision == 4
    assert deployment.observed_state == "running"
    assert deployment.observed_revision == 3
    assert historical_version.status == "current"
