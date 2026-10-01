from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from src.api.models import Alert, AlertType, Deployment, DeploymentEvent
from src.api.models.models import AgentStatus
from src.api.services.monitoring import monitor_agent_health


@pytest.mark.asyncio
async def test_monitoring_health_uses_app_state_start_time(client: AsyncClient, test_user):
    test_user.roles = ["ADMIN"]
    client.app.state.start_time = datetime.now(timezone.utc).timestamp() - 5

    response = await client.get("/v1/monitoring/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["database"] == "healthy"
    assert payload["uptime_seconds"] >= 5


@pytest.mark.asyncio
async def test_monitor_marks_current_qualified_deployment_failed_on_stale_evidence(
    db_session, test_agent, test_deployment
):
    stale_at = datetime.now(timezone.utc) - timedelta(seconds=121)
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 1
    test_agent.last_heartbeat = stale_at
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 1
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 1
    test_deployment.observed_at = stale_at
    await db_session.commit()

    await monitor_agent_health(db_session)
    assert test_deployment.ended_at is not None
    assert test_deployment.ended_at.tzinfo is None
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)

    assert test_agent.status == AgentStatus.FAILED.value
    assert test_deployment.status == "failed"
    assert test_deployment.error_message is not None

    events = (
        (
            await db_session.execute(
                select(DeploymentEvent).where(DeploymentEvent.deployment_id == test_deployment.id)
            )
        )
        .scalars()
        .all()
    )
    assert any(event.event_type == "monitor_failed" for event in events)


@pytest.mark.asyncio
async def test_monitor_does_not_fail_new_deployment_of_old_agent_without_heartbeat(
    client, db_session, test_user, test_agent
):
    test_user.roles = ["DEVELOPER"]
    test_agent.created_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    test_agent.last_heartbeat = None
    await db_session.commit()

    response = await client.post(f"/v1/agents/{test_agent.id}/deploy")
    assert response.status_code == 200
    deployment = (
        await db_session.execute(select(Deployment).where(Deployment.agent_id == test_agent.id))
    ).scalar_one()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(deployment)

    assert deployment.status == "pending"
    assert deployment.ended_at is None
    assert deployment.error_message is None
    assert test_agent.last_heartbeat is None
    alerts = (
        (await db_session.execute(select(Alert).where(Alert.agent_id == test_agent.id)))
        .scalars()
        .all()
    )
    assert alerts == []
    events = (
        (
            await db_session.execute(
                select(DeploymentEvent).where(DeploymentEvent.deployment_id == deployment.id)
            )
        )
        .scalars()
        .all()
    )
    assert [event.event_type for event in events] == ["deploy"]


@pytest.mark.asyncio
async def test_monitor_does_not_promote_old_creating_agent_without_runtime_evidence(
    db_session, test_agent
):
    test_agent.status = AgentStatus.CREATING.value
    test_agent.created_at = datetime.now(timezone.utc) - timedelta(seconds=11)
    test_agent.last_heartbeat = None
    await db_session.commit()

    await monitor_agent_health(db_session)

    await db_session.refresh(test_agent)
    deployments = (
        (await db_session.execute(select(Deployment).where(Deployment.agent_id == test_agent.id)))
        .scalars()
        .all()
    )

    assert test_agent.status == AgentStatus.CREATING.value
    assert test_agent.last_heartbeat is None
    assert deployments == []


@pytest.mark.asyncio
async def test_monitor_does_not_recover_failed_agent_or_resolve_alert_by_elapsed_time(
    db_session, test_agent, test_deployment
):
    test_agent.status = AgentStatus.FAILED.value
    test_agent.updated_at = datetime.now(timezone.utc) - timedelta(seconds=31)
    test_deployment.status = "failed"
    test_deployment.error_message = (
        "System: Agent marked as FAILED due to heartbeat timeout (120s)."
    )
    test_deployment.ended_at = datetime.now(timezone.utc)
    alert = Alert(
        agent_id=test_agent.id,
        type=AlertType.AGENT_DOWN,
        message="Agent is down",
        resolved=False,
    )
    db_session.add(alert)
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)
    await db_session.refresh(alert)

    assert test_agent.status == AgentStatus.FAILED.value
    assert test_agent.last_heartbeat is None
    assert test_deployment.status == "failed"
    assert test_deployment.error_message is not None
    assert test_deployment.ended_at is not None
    assert alert.resolved is False
    assert alert.resolved_at is None

    events = (
        (
            await db_session.execute(
                select(DeploymentEvent).where(DeploymentEvent.deployment_id == test_deployment.id)
            )
        )
        .scalars()
        .all()
    )
    assert not any(event.event_type == "monitor_restarted" for event in events)


@pytest.mark.asyncio
async def test_monitor_emits_webhooks_for_observed_failure_without_fake_recovery(
    db_session, test_agent, test_deployment, monkeypatch
):
    webhook_calls: list[tuple[str, dict]] = []

    async def fake_trigger_agent_status_event(
        db, user_id, agent_id, old_status, new_status, agent_name
    ):
        webhook_calls.append(
            (
                "agent.status",
                {
                    "agent_id": str(agent_id),
                    "old_status": old_status,
                    "new_status": new_status,
                    "agent_name": agent_name,
                },
            )
        )

    async def fake_trigger_deployment_event(
        db, user_id, deployment_id, agent_id, event_type, status=None
    ):
        webhook_calls.append(
            (
                "deployment.event",
                {
                    "deployment_id": str(deployment_id),
                    "agent_id": str(agent_id),
                    "event_type": event_type,
                    "status": status,
                },
            )
        )

    monkeypatch.setattr(
        "src.api.services.monitoring.trigger_agent_status_event", fake_trigger_agent_status_event
    )
    monkeypatch.setattr(
        "src.api.services.monitoring.trigger_deployment_event", fake_trigger_deployment_event
    )

    test_agent.status = AgentStatus.RUNNING.value
    stale_at = datetime.now(timezone.utc) - timedelta(seconds=121)
    test_agent.target_revision = 1
    test_agent.last_heartbeat = stale_at
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 1
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 1
    test_deployment.observed_at = stale_at
    await db_session.commit()

    await monitor_agent_health(db_session)

    # Passing the old recovery delay supplies no new machine evidence.
    test_agent.updated_at = datetime.now(timezone.utc) - timedelta(seconds=31)
    await db_session.commit()
    await monitor_agent_health(db_session)

    deployment_events = [
        call[1]["event_type"] for call in webhook_calls if call[0] == "deployment.event"
    ]
    agent_statuses = [call[1]["new_status"] for call in webhook_calls if call[0] == "agent.status"]

    assert deployment_events == ["monitor_failed"]
    assert agent_statuses == ["failed"]


@pytest.mark.asyncio
async def test_monitor_status_transitions_survive_webhook_dispatch_failures(
    db_session, test_agent, test_deployment, monkeypatch
):
    async def raise_webhook_failure(*_args, **_kwargs):
        raise RuntimeError("webhook unavailable")

    monkeypatch.setattr(
        "src.api.services.monitoring.trigger_agent_status_event", raise_webhook_failure
    )
    monkeypatch.setattr(
        "src.api.services.monitoring.trigger_deployment_event", raise_webhook_failure
    )

    test_agent.status = AgentStatus.RUNNING.value
    stale_at = datetime.now(timezone.utc) - timedelta(seconds=121)
    test_agent.target_revision = 1
    test_agent.last_heartbeat = stale_at
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 1
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 1
    test_deployment.observed_at = stale_at
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)

    assert test_agent.status == AgentStatus.FAILED.value
    assert test_deployment.status == "failed"


@pytest.mark.asyncio
async def test_listener_liveness_does_not_mask_stale_qualified_work(
    db_session, test_agent, test_deployment
):
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 1
    # A fresh listener heartbeat cannot replace the old bound work observation.
    test_agent.last_heartbeat = datetime.now(timezone.utc)
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 1
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 1
    test_deployment.observed_at = datetime.now(timezone.utc) - timedelta(seconds=121)
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)

    assert test_agent.last_heartbeat is not None
    assert test_agent.status == AgentStatus.FAILED.value
    assert test_deployment.status == "failed"


@pytest.mark.asyncio
async def test_listener_liveness_does_not_mask_stale_standalone_agent_evidence(
    db_session, test_agent
):
    stale_at = datetime.now(timezone.utc) - timedelta(seconds=121)
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 4
    test_agent.observed_state = AgentStatus.RUNNING.value
    test_agent.observed_revision = 4
    test_agent.observed_at = stale_at
    test_agent.last_heartbeat = datetime.now(timezone.utc)
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)

    assert test_agent.status == AgentStatus.FAILED.value
    assert test_agent.observed_at.replace(tzinfo=timezone.utc) == stale_at


@pytest.mark.asyncio
async def test_current_standalone_agent_evidence_supersedes_stale_liveness(db_session, test_agent):
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 4
    test_agent.observed_state = AgentStatus.RUNNING.value
    test_agent.observed_revision = 4
    test_agent.observed_at = datetime.now(timezone.utc)
    test_agent.last_heartbeat = datetime.now(timezone.utc) - timedelta(seconds=121)
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)

    assert test_agent.status == AgentStatus.RUNNING.value


@pytest.mark.asyncio
async def test_monitor_rechecks_target_observation_before_failing(
    db_session, test_agent, test_deployment, monkeypatch
):
    import src.api.services.monitoring as monitoring

    stale_at = datetime.now(timezone.utc) - timedelta(seconds=121)
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.target_revision = 1
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 1
    test_deployment.observed_state = "running"
    test_deployment.observed_revision = 1
    test_deployment.observed_at = stale_at
    await db_session.commit()

    original_mark_stale = monitoring.mark_stale_deployment_observation

    async def refresh_before_recheck(**kwargs):
        # Simulate a genuine runtime heartbeat arriving after the monitor query.
        test_deployment.observed_at = datetime.now(timezone.utc)
        await db_session.flush()
        return await original_mark_stale(**kwargs)

    monkeypatch.setattr(monitoring, "mark_stale_deployment_observation", refresh_before_recheck)
    await monitoring.monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)

    assert test_deployment.status == "running"
    assert test_deployment.observed_state == "running"
    assert test_agent.status == AgentStatus.RUNNING.value
