"""Regression cases found while reviewing the consolidated lifecycle owner."""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from src.api.domain.lifecycle import LifecycleConflict
from src.api.models import AgentStatus, Deployment, DeploymentEvent
from src.api.models.schemas import deployment_allowed_actions
from src.api.services.deployment_lifecycle import (
    _derive_agent_desired_state,
    create_deployment_record,
    mark_stale_deployment_observation,
    record_runtime_heartbeat,
    request_agent_stop,
    request_deployment_action,
)


async def running_target(db, agent, target):
    agent.status = "running"
    target.status = "running"
    target.desired_action = "deploy"
    target.desired_state = "running"
    target.target_revision = 1
    target.observed_state = "running"
    target.observed_revision = 1
    target.observed_at = datetime.now(timezone.utc)
    await db.commit()


@pytest.mark.asyncio
async def test_target_start_cannot_supersede_completed_agent_stop(
    db_session, test_agent, test_deployment
):
    await running_target(db_session, test_agent, test_deployment)
    await request_agent_stop(db=db_session, agent_id=test_agent.id)
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=test_deployment.id,
        target_revision=2,
        status="stopped",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    with pytest.raises(LifecycleConflict, match="stop"):
        await request_deployment_action(
            db=db_session, deployment_id=test_deployment.id, action="scale", requested_replicas=2
        )
    assert test_agent.desired_state == "stopped"
    assert test_deployment.target_revision == 2


@pytest.mark.asyncio
async def test_stale_monitor_cannot_revive_agent_under_stop_fence(
    db_session, test_agent, test_deployment
):
    await running_target(db_session, test_agent, test_deployment)
    sibling = Deployment(
        agent_id=test_agent.id,
        status="running",
        desired_action="deploy",
        desired_state="running",
        target_revision=1,
    )
    db_session.add(sibling)
    await db_session.commit()
    await request_agent_stop(db=db_session, agent_id=test_agent.id)
    now = datetime.now(timezone.utc)
    for target in (test_deployment, sibling):
        await record_runtime_heartbeat(
            db=db_session,
            agent_id=test_agent.id,
            deployment_id=target.id,
            target_revision=2,
            status="stopped",
            now=now,
        )
    await db_session.commit()
    assert test_agent.status == "stopped"
    for target, when in ((test_deployment, now - timedelta(minutes=5)), (sibling, now)):
        await record_runtime_heartbeat(
            db=db_session,
            agent_id=test_agent.id,
            deployment_id=target.id,
            target_revision=2,
            status="running",
            now=when,
        )
    await db_session.commit()
    await mark_stale_deployment_observation(
        db=db_session,
        deployment_id=test_deployment.id,
        expected_revision=2,
        stale_before=now - timedelta(minutes=2),
        now=now,
        failure_message="stale current target",
    )
    await db_session.commit()
    assert test_agent.status != "running"
    assert test_agent.desired_state == "stopped"


@pytest.mark.asyncio
async def test_identical_current_heartbeat_refreshes_time_without_transition_spam(
    db_session, test_agent, test_deployment
):
    await running_target(db_session, test_agent, test_deployment)
    now = datetime.now(timezone.utc)
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=test_deployment.id,
        target_revision=1,
        status="running",
        now=now,
    )
    await db_session.commit()
    before = await db_session.scalar(select(func.count()).select_from(DeploymentEvent))
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=test_deployment.id,
        target_revision=1,
        status="running",
        now=now + timedelta(seconds=30),
    )
    await db_session.commit()
    assert await db_session.scalar(select(func.count()).select_from(DeploymentEvent)) == before
    assert test_deployment.observed_at.replace(tzinfo=timezone.utc) == now + timedelta(seconds=30)


@pytest.mark.asyncio
async def test_legacy_active_deployment_prevents_agent_only_work_confirmation(
    db_session, test_agent, test_deployment
):
    test_agent.status = AgentStatus.CREATING.value
    test_deployment.status = "running"
    await db_session.commit()
    result = await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        target_revision=0,
        status="running",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    assert result.qualified is False
    assert test_agent.status == AgentStatus.CREATING.value
    assert test_agent.last_heartbeat is not None


@pytest.mark.asyncio
async def test_legacy_scoped_stopped_observation_updates_status_without_backfill(
    db_session, test_agent, test_deployment
):
    test_deployment.status = "running"
    await db_session.commit()
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=test_deployment.id,
        target_revision=0,
        status="stopped",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    assert test_deployment.status == "stopped"
    assert test_deployment.desired_action is None
    assert test_deployment.observed_state == "stopped"
    assert test_deployment.observed_revision == 0


@pytest.mark.asyncio
async def test_pending_termination_cannot_be_replaced_with_stop(
    db_session, test_agent, test_deployment, client
):
    await running_target(db_session, test_agent, test_deployment)
    await request_deployment_action(
        db=db_session, deployment_id=test_deployment.id, action="terminate"
    )
    await db_session.commit()
    detail = await client.get(f"/v1/deployments/{test_deployment.id}")
    assert detail.status_code == 200
    assert "stop" not in detail.json()["allowed_actions"]
    assert detail.json()["can_stop"] is False
    assert detail.json()["can_restart"] is False
    assert detail.json()["can_terminate"] is False
    with pytest.raises(LifecycleConflict):
        await request_deployment_action(
            db=db_session, deployment_id=test_deployment.id, action="scale", requested_replicas=0
        )


@pytest.mark.asyncio
async def test_desired_state_ignores_untracked_history_but_tracks_legacy_active_rows(
    db_session, test_agent, test_deployment
):
    test_agent.status = "running"
    test_deployment.status = "running"
    test_deployment.desired_action = "deploy"
    test_deployment.desired_state = "running"
    test_deployment.target_revision = 1
    historical = Deployment(agent_id=test_agent.id, status="stopped", replicas=1)
    db_session.add(historical)
    await db_session.commit()

    await request_deployment_action(
        db=db_session,
        deployment_id=test_deployment.id,
        action="scale",
        requested_replicas=0,
    )
    assert test_agent.desired_state == "stopped"

    legacy_active = Deployment(agent_id=test_agent.id, status="ready", replicas=1)
    db_session.add(legacy_active)
    await db_session.commit()
    assert await _derive_agent_desired_state(db_session, test_agent.id) is None


def test_deployment_allowed_action_defaults_preserve_legacy_status_projection():
    assert deployment_allowed_actions("pending") == ["stop", "terminate"]
    assert deployment_allowed_actions("running") == ["stop", "restart", "scale", "terminate"]


@pytest.mark.asyncio
async def test_repeated_agent_and_target_stop_preserve_pending_revisions(
    db_session, test_agent, test_deployment
):
    await running_target(db_session, test_agent, test_deployment)
    agent = await request_agent_stop(db=db_session, agent_id=test_agent.id)
    accepted_fence = agent.stop_fence_revision
    accepted_agent_revision = agent.target_revision
    accepted_target_revision = test_deployment.target_revision
    event_count = await db_session.scalar(select(func.count()).select_from(DeploymentEvent))

    repeated_agent = await request_agent_stop(db=db_session, agent_id=test_agent.id)
    target, repeated_agent, _ = await request_deployment_action(
        db=db_session,
        deployment_id=test_deployment.id,
        action="scale",
        requested_replicas=0,
    )
    await db_session.commit()

    assert repeated_agent.stop_fence_revision == accepted_fence
    assert repeated_agent.target_revision == accepted_agent_revision
    assert target.agent_stop_revision == accepted_fence
    assert target.target_revision == accepted_target_revision
    assert await db_session.scalar(select(func.count()).select_from(DeploymentEvent)) == event_count


@pytest.mark.asyncio
async def test_new_agent_stop_preserves_completed_target_termination(
    db_session, test_agent, test_deployment
):
    await running_target(db_session, test_agent, test_deployment)
    agent = await request_agent_stop(db=db_session, agent_id=test_agent.id)
    first_fence = agent.stop_fence_revision
    stopped_revision = test_deployment.target_revision
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=test_deployment.id,
        target_revision=stopped_revision,
        status="stopped",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()

    test_deployment, _, _ = await request_deployment_action(
        db=db_session,
        deployment_id=test_deployment.id,
        action="terminate",
    )
    termination_revision = test_deployment.target_revision
    await record_runtime_heartbeat(
        db=db_session,
        agent_id=test_agent.id,
        deployment_id=test_deployment.id,
        target_revision=termination_revision,
        status="stopped",
        now=datetime.now(timezone.utc),
    )
    await db_session.commit()
    assert test_deployment.status == "killed"

    await create_deployment_record(
        agent=test_agent,
        db=db_session,
        event_type="deploy",
        action="deploy",
    )
    await db_session.commit()
    new_fence = (
        await request_agent_stop(db=db_session, agent_id=test_agent.id)
    ).stop_fence_revision
    await db_session.commit()
    await db_session.refresh(test_deployment)

    assert new_fence != first_fence
    assert test_deployment.status == "killed"
    assert test_deployment.desired_action == "terminate"
    assert test_deployment.desired_state == "terminated"
    assert test_deployment.target_revision == termination_revision


@pytest.mark.asyncio
async def test_new_agent_stop_preserves_pending_target_termination_intent(
    db_session, test_agent, test_deployment
):
    await running_target(db_session, test_agent, test_deployment)
    await request_agent_stop(db=db_session, agent_id=test_agent.id)
    test_deployment, _, _ = await request_deployment_action(
        db=db_session,
        deployment_id=test_deployment.id,
        action="terminate",
    )
    termination_revision = test_deployment.target_revision
    await db_session.commit()

    await create_deployment_record(
        agent=test_agent,
        db=db_session,
        event_type="deploy",
        action="deploy",
    )
    await db_session.commit()
    agent = await request_agent_stop(db=db_session, agent_id=test_agent.id)
    await db_session.commit()
    await db_session.refresh(test_deployment)

    assert test_deployment.status == "pending"
    assert test_deployment.desired_action == "terminate"
    assert test_deployment.desired_state == "terminated"
    assert test_deployment.target_revision == termination_revision
    assert test_deployment.agent_stop_revision == agent.stop_fence_revision
