"""Database-backed owner for agent and deployment lifecycle transitions."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.domain.lifecycle import (
    ACTIVE_DEPLOYMENT_STATUSES,
    LifecycleConflict,
    aggregate_observed_state,
    deployment_completion,
    deployment_intent,
)
from src.api.models import (
    Agent,
    AgentLog,
    AgentStatus,
    Alert,
    AlertType,
    Deployment,
    DeploymentEvent,
    DeploymentVersion,
)
from src.api.time_utils import as_utc, as_utc_naive, utc_now_naive


@dataclass(frozen=True)
class RuntimeObservation:
    agent: Agent
    previous_agent_status: str
    deployment: Deployment | None = None
    deployment_event_type: str | None = None
    deployment_event_status: str | None = None
    qualified: bool = False


@dataclass(frozen=True)
class StaleObservation:
    agent: Agent
    previous_status: str
    failed_deployments: tuple[Deployment, ...]


async def _locked_agent(db: AsyncSession, agent_id: uuid.UUID) -> Agent | None:
    result = await db.execute(
        select(Agent)
        .where(Agent.id == agent_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def _locked_deployment(
    db: AsyncSession, *, deployment_id: uuid.UUID, agent_id: uuid.UUID
) -> Deployment | None:
    result = await db.execute(
        select(Deployment)
        .where(Deployment.id == deployment_id, Deployment.agent_id == agent_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def _advance_agent_intent(
    db: AsyncSession,
    agent: Agent,
    *,
    action: str,
    desired_state: str | None,
) -> None:
    revision = int(agent.target_revision or 0)
    preserve_stop_fence = agent.stop_fence_revision is not None and action not in {
        "create",
        "deploy",
        "stop",
    }
    result = await db.execute(
        update(Agent)
        .where(Agent.id == agent.id, Agent.target_revision == revision)
        .values(
            desired_action=agent.desired_action if preserve_stop_fence else action,
            desired_state=agent.desired_state if preserve_stop_fence else desired_state,
            target_revision=revision + 1,
        )
        .execution_options(synchronize_session=False)
    )
    if result.rowcount != 1:
        raise LifecycleConflict("Agent lifecycle intent changed concurrently")
    await db.refresh(agent)


async def _derive_agent_desired_state(db: AsyncSession, agent_id: uuid.UUID) -> str | None:
    result = await db.execute(
        select(Deployment.desired_state).where(
            Deployment.agent_id == agent_id,
            (Deployment.desired_action.is_not(None))
            | (Deployment.desired_state.is_not(None))
            | (Deployment.target_revision > 0)
            | (Deployment.observed_state.is_not(None))
            | Deployment.status.in_(ACTIVE_DEPLOYMENT_STATUSES),
        )
    )
    states = [row[0] for row in result.all()]
    if not states or any(state is None for state in states):
        return None
    if any(state == "running" for state in states):
        return "running"
    if all(state in {"stopped", "terminated"} for state in states):
        return "stopped"
    return None


async def _aggregate_agent_observation(db: AsyncSession, agent_id: uuid.UUID) -> str | None:
    result = await db.execute(
        select(
            Deployment.observed_state,
            Deployment.observed_revision,
            Deployment.target_revision,
        ).where(
            Deployment.agent_id == agent_id,
            (Deployment.desired_action.is_not(None))
            | (Deployment.target_revision > 0)
            | (Deployment.observed_state.is_not(None))
            | Deployment.status.in_(ACTIVE_DEPLOYMENT_STATUSES),
        )
    )
    # Unknown or superseded targets must still prevent an all-stopped claim.
    return aggregate_observed_state(
        [
            state if observed_revision == target_revision else None
            for state, observed_revision, target_revision in result.all()
        ]
    )


async def _supersede_stop_fence(db: AsyncSession, agent: Agent) -> None:
    """An explicit agent-wide deployment supersedes the prior stop scope."""
    if agent.stop_fence_revision is None:
        return
    agent.stop_fence_revision = None
    agent.stop_fence_completed_revision = None


async def create_agent_record(*, agent: Agent, db: AsyncSession, action: str = "create") -> Agent:
    """Initialize a new agent as unobserved and record the creation intent."""
    agent.status = AgentStatus.CREATING.value
    agent.desired_action = action
    agent.desired_state = "registered"
    agent.target_revision = 1
    agent.observed_state = None
    agent.observed_revision = None
    agent.observed_at = None
    db.add(agent)
    await db.flush()
    return agent


def _create_deployment_version(deployment: Deployment, db: AsyncSession) -> DeploymentVersion:
    config_snapshot = {"replicas": deployment.replicas, "version": deployment.version}
    version = DeploymentVersion(
        deployment_id=deployment.id,
        version=1,
        config_snapshot=json.dumps(config_snapshot),
        status="current",
    )
    db.add(version)
    return version


async def create_deployment_record(
    *,
    agent: Agent,
    db: AsyncSession,
    replicas: int = 1,
    version: str = "v1.0.0",
    event_type: str = "create",
    action: str = "create",
) -> Deployment:
    """Create a pending deployment and atomically advance its agent intent."""
    current_agent = await _locked_agent(db, agent.id)
    if current_agent is None:
        raise LifecycleConflict("Agent not found")
    if current_agent.status == AgentStatus.DELETING.value:
        raise LifecycleConflict("Cannot deploy an agent that is being deleted")
    await _supersede_stop_fence(db, current_agent)

    deployment = Deployment(
        agent_id=current_agent.id,
        status="pending",
        version=version,
        replicas=replicas,
        started_at=None,
        desired_action=action,
        desired_state="running",
        observed_state=None,
        target_revision=1,
        observed_revision=None,
        observed_at=None,
    )
    db.add(deployment)
    await db.flush()
    _create_deployment_version(deployment, db)
    db.add(
        DeploymentEvent(
            deployment_id=deployment.id,
            event_type=event_type,
            status="pending",
        )
    )
    await _advance_agent_intent(
        db,
        current_agent,
        action=action,
        desired_state="running",
    )
    return deployment


async def request_deployment_action(
    *,
    deployment_id: uuid.UUID,
    db: AsyncSession,
    action: str,
    requested_replicas: int | None = None,
    rollback_version: int | None = None,
) -> tuple[Deployment, Agent, str]:
    """Record one target's user intent and advance both target revisions."""
    owner_result = await db.execute(
        select(Deployment.agent_id).where(Deployment.id == deployment_id)
    )
    agent_id = owner_result.scalar_one_or_none()
    if agent_id is None:
        raise LifecycleConflict("Deployment not found")
    agent = await _locked_agent(db, agent_id)
    if agent is None:
        raise LifecycleConflict("Agent not found")
    deployment = await _locked_deployment(db, deployment_id=deployment_id, agent_id=agent_id)
    if deployment is None:
        raise LifecycleConflict("Deployment not found")

    repeated_stop = (
        action == "scale"
        and requested_replicas == 0
        and deployment.desired_action == "stop"
        and deployment.desired_state == "stopped"
        and (
            deployment.status == "pending"
            or (
                deployment.status == "stopped"
                and deployment.observed_state == "stopped"
                and deployment.observed_revision == deployment.target_revision
            )
        )
    )
    if repeated_stop:
        return deployment, agent, "deployment_stopped"

    target_version = None
    snapshot = None
    if action == "rollback":
        version_result = await db.execute(
            select(DeploymentVersion).where(
                DeploymentVersion.deployment_id == deployment.id,
                DeploymentVersion.version == rollback_version,
            )
        )
        target_version = version_result.scalar_one_or_none()
        if target_version is None:
            raise LookupError(f"Version {rollback_version} not found for this deployment")
        snapshot = json.loads(target_version.config_snapshot)
        requested_replicas = int(snapshot.get("replicas", deployment.replicas))

    intent = deployment_intent(
        action=action,
        current_status=deployment.status,
        current_replicas=deployment.replicas,
        requested_replicas=requested_replicas,
        current_desired_action=deployment.desired_action,
        current_desired_state=deployment.desired_state,
    )
    if agent.stop_fence_revision is not None and intent.desired_state == "running":
        raise LifecycleConflict(
            "Cannot request a deployment to run while an Agent-wide stop is in effect"
        )
    if snapshot is not None:
        deployment.version = snapshot.get("version", deployment.version)
    old_revision = int(deployment.target_revision or 0)
    result = await db.execute(
        update(Deployment)
        .where(Deployment.id == deployment.id, Deployment.target_revision == old_revision)
        .values(
            target_revision=old_revision + 1,
            desired_action=intent.action,
            desired_state=intent.desired_state,
            status=intent.status,
            replicas=intent.replicas,
        )
        .execution_options(synchronize_session=False)
    )
    if result.rowcount != 1:
        raise LifecycleConflict("Deployment lifecycle intent changed concurrently")
    await db.refresh(deployment)
    if target_version is not None:
        current_versions = await db.execute(
            select(DeploymentVersion).where(
                DeploymentVersion.deployment_id == deployment.id,
                DeploymentVersion.status == "current",
            )
        )
        for current_version in current_versions.scalars().all():
            current_version.status = "superseded"
            current_version.rolled_back_at = utc_now_naive()
        target_version.status = "current"
        target_version.rolled_back_at = None
    db.add(
        DeploymentEvent(
            deployment_id=deployment.id,
            event_type=intent.event_type,
            status=intent.event_status,
        )
    )

    desired_state = await _derive_agent_desired_state(db, agent.id)
    await _advance_agent_intent(
        db,
        agent,
        action=intent.action,
        desired_state=desired_state,
    )
    return deployment, agent, intent.usage_event_type


async def request_agent_stop(*, agent_id: uuid.UUID, db: AsyncSession) -> Agent:
    """Fence every live or starting target before recording an agent-wide stop."""
    agent = await _locked_agent(db, agent_id)
    if agent is None:
        raise LifecycleConflict("Agent not found")
    if (
        agent.stop_fence_revision is not None
        and agent.desired_action == "stop"
        and agent.desired_state == "stopped"
    ):
        return agent
    result = await db.execute(
        select(Deployment)
        .where(Deployment.agent_id == agent.id)
        .order_by(Deployment.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    deployments = result.scalars().all()
    affected = [
        deployment
        for deployment in deployments
        if deployment.status != "killed"
        and deployment.desired_state != "terminated"
        and (
            deployment.status in ACTIVE_DEPLOYMENT_STATUSES
            or deployment.desired_state == "running"
            or deployment.agent_stop_revision is not None
        )
    ]
    pending_terminations = [
        deployment
        for deployment in deployments
        if deployment.status != "killed" and deployment.desired_state == "terminated"
    ]
    await _advance_agent_intent(db, agent, action="stop", desired_state="stopped")
    fence_revision = int(agent.target_revision or 0)
    agent.stop_fence_revision = fence_revision
    agent.stop_fence_completed_revision = None

    for deployment in affected:
        revision = int(deployment.target_revision or 0)
        updated = await db.execute(
            update(Deployment)
            .where(Deployment.id == deployment.id, Deployment.target_revision == revision)
            .values(
                target_revision=revision + 1,
                desired_action="stop",
                desired_state="stopped",
                status="pending",
                agent_stop_revision=fence_revision,
            )
            .execution_options(synchronize_session=False)
        )
        if updated.rowcount != 1:
            raise LifecycleConflict("Deployment lifecycle intent changed concurrently")
        await db.refresh(deployment)
        db.add(
            DeploymentEvent(
                deployment_id=deployment.id,
                event_type="stop",
                status="pending",
            )
        )

    # A pending termination already requests the stopped runtime outcome. Keep
    # that intent and its revision intact while attaching its observation to the
    # new Agent-wide fence. A completed killed target stays outside the fence.
    for deployment in pending_terminations:
        revision = int(deployment.target_revision or 0)
        updated = await db.execute(
            update(Deployment)
            .where(Deployment.id == deployment.id, Deployment.target_revision == revision)
            .values(agent_stop_revision=fence_revision)
            .execution_options(synchronize_session=False)
        )
        if updated.rowcount != 1:
            raise LifecycleConflict("Deployment lifecycle intent changed concurrently")
        await db.refresh(deployment)

    return agent


async def _complete_agent_stop_fence(db: AsyncSession, *, agent: Agent, now: datetime) -> bool:
    fence_revision = agent.stop_fence_revision
    if fence_revision is None:
        return False
    result = await db.execute(
        select(
            Deployment.observed_state,
            Deployment.observed_revision,
            Deployment.target_revision,
        ).where(
            Deployment.agent_id == agent.id,
            Deployment.agent_stop_revision == fence_revision,
        )
    )
    targets = result.all()
    if not targets or any(
        state != "stopped" or observed_revision != target_revision
        for state, observed_revision, target_revision in targets
    ):
        return False
    agent.stop_fence_completed_revision = fence_revision
    agent.status = AgentStatus.STOPPED.value
    agent.observed_state = AgentStatus.STOPPED.value
    agent.observed_revision = int(agent.target_revision or 0)
    agent.observed_at = as_utc(now)
    return True


async def _resolve_agent_down_alerts_after_runtime(
    db: AsyncSession, *, agent: Agent, now: datetime
) -> None:
    failed_result = await db.execute(
        select(Deployment.id)
        .where(
            Deployment.agent_id == agent.id,
            Deployment.observed_state == AgentStatus.FAILED.value,
            Deployment.observed_revision == Deployment.target_revision,
            Deployment.status == "failed",
        )
        .limit(1)
    )
    if failed_result.scalar_one_or_none() is not None:
        return
    alert_result = await db.execute(
        select(Alert).where(
            Alert.agent_id == agent.id,
            Alert.type == AlertType.AGENT_DOWN,
            Alert.resolved.is_(False),
        )
    )
    for alert in alert_result.scalars().all():
        alert.resolved = True
        alert.resolved_at = as_utc_naive(now)


async def record_runtime_heartbeat(
    *,
    db: AsyncSession,
    agent_id: uuid.UUID,
    status: str,
    now: datetime,
    component: str = "agent_runtime",
    deployment_id: uuid.UUID | None = None,
    target_revision: int | None = None,
    node_id: str | None = None,
    error_message: str | None = None,
) -> RuntimeObservation | None:
    """Record runtime liveness and accept only current target-bound evidence."""
    agent = await _locked_agent(db, agent_id)
    if agent is None:
        return None
    previous_status = agent.status
    observation_time = as_utc(now)
    agent.last_heartbeat = observation_time

    if component == "command_listener":
        return RuntimeObservation(agent, previous_status)

    if deployment_id is None:
        if target_revision is None or target_revision != int(agent.target_revision or 0):
            return RuntimeObservation(agent, previous_status)
        tracked_result = await db.execute(
            select(Deployment.id)
            .where(
                Deployment.agent_id == agent.id,
                (Deployment.desired_action.is_not(None))
                | (Deployment.target_revision > 0)
                | (Deployment.observed_state.is_not(None))
                | Deployment.status.in_(ACTIVE_DEPLOYMENT_STATUSES),
            )
            .limit(1)
        )
        has_tracked_deployment = tracked_result.scalar_one_or_none() is not None
        if agent.stop_fence_revision is not None:
            fence_result = await db.execute(
                select(Deployment.id)
                .where(
                    Deployment.agent_id == agent.id,
                    Deployment.agent_stop_revision == agent.stop_fence_revision,
                )
                .limit(1)
            )
            has_fenced_targets = fence_result.scalar_one_or_none() is not None
            if status == "stopped" and not has_fenced_targets:
                agent.status = AgentStatus.STOPPED.value
                agent.observed_state = AgentStatus.STOPPED.value
                agent.observed_revision = int(agent.target_revision or 0)
                agent.observed_at = observation_time
                agent.stop_fence_completed_revision = agent.stop_fence_revision
            return RuntimeObservation(agent, previous_status, qualified=not has_fenced_targets)
        if not has_tracked_deployment:
            agent.status = status
            agent.observed_state = status
            agent.observed_revision = int(agent.target_revision or 0)
            agent.observed_at = observation_time
            if status == AgentStatus.RUNNING.value:
                await _resolve_agent_down_alerts_after_runtime(db, agent=agent, now=now)
            return RuntimeObservation(agent, previous_status, qualified=True)
        return RuntimeObservation(agent, previous_status)

    if target_revision is None:
        return RuntimeObservation(agent, previous_status)

    deployment = await _locked_deployment(
        db,
        deployment_id=deployment_id,
        agent_id=agent.id,
    )
    if deployment is None or int(deployment.target_revision or 0) != target_revision:
        return RuntimeObservation(agent, previous_status, deployment=deployment)

    old_status = deployment.status
    old_observed_state = deployment.observed_state
    old_observed_revision = deployment.observed_revision
    evidence_changed = old_observed_revision != target_revision or old_observed_state != status
    deployment.observed_state = status
    deployment.observed_revision = target_revision
    deployment.observed_at = observation_time
    if node_id is not None:
        deployment.node_id = node_id

    fenced_target = (
        agent.stop_fence_revision is not None
        and deployment.agent_stop_revision == agent.stop_fence_revision
    )
    completed_status = (
        None
        if fenced_target and status == "running"
        else deployment_completion(
            desired_state=deployment.desired_state,
            reported_state=status,
        )
    )
    legacy_projection = (
        target_revision == 0
        and deployment.desired_action is None
        and deployment.desired_state is None
        and status in {"running", "stopped"}
    )
    if completed_status is None and legacy_projection:
        completed_status = status

    event_type = None
    if completed_status is not None:
        deployment.status = completed_status
        status_changed = old_status != completed_status
        if completed_status == "running":
            if (evidence_changed and not legacy_projection) or deployment.started_at is None:
                deployment.started_at = as_utc_naive(now)
            if evidence_changed or status_changed:
                deployment.ended_at = None
                deployment.error_message = None
        else:
            if evidence_changed or status_changed:
                deployment.ended_at = as_utc_naive(now)
                if completed_status == "failed":
                    deployment.error_message = error_message or "Runtime reported failure"
        if evidence_changed or status_changed:
            event_type = f"heartbeat_{status}"
    elif evidence_changed:
        event_type = f"heartbeat_{status}"

    if event_type is not None:
        db.add(
            DeploymentEvent(
                deployment_id=deployment.id,
                event_type=event_type,
                status=completed_status or deployment.status,
                node_id=deployment.node_id,
                error_message=error_message,
            )
        )

    if fenced_target:
        completed_fence = await _complete_agent_stop_fence(db, agent=agent, now=now)
        if not completed_fence:
            agent.stop_fence_completed_revision = None
    else:
        aggregate = await _aggregate_agent_observation(db, agent.id)
        if aggregate is not None:
            agent.observed_state = aggregate
            agent.status = aggregate
            agent.observed_revision = int(agent.target_revision or 0)
            agent.observed_at = observation_time
            if aggregate == AgentStatus.RUNNING.value:
                await _resolve_agent_down_alerts_after_runtime(db, agent=agent, now=now)

    return RuntimeObservation(
        agent,
        previous_status,
        deployment=deployment,
        deployment_event_type=event_type,
        deployment_event_status=completed_status or deployment.status,
        qualified=True,
    )


async def mark_stale_deployment_observation(
    *,
    db: AsyncSession,
    deployment_id: uuid.UUID,
    expected_revision: int,
    stale_before: datetime,
    now: datetime,
    failure_message: str,
) -> StaleObservation | None:
    """Fail one stale target only if its qualified observation is still current."""
    owner_result = await db.execute(
        select(Deployment.agent_id).where(Deployment.id == deployment_id)
    )
    agent_id = owner_result.scalar_one_or_none()
    if agent_id is None:
        return None
    agent = await _locked_agent(db, agent_id)
    if agent is None:
        return None
    deployment = await _locked_deployment(
        db,
        deployment_id=deployment_id,
        agent_id=agent.id,
    )
    if deployment is None:
        return None
    if (
        int(deployment.target_revision or 0) != expected_revision
        or deployment.observed_revision != expected_revision
        or deployment.observed_state not in {"running", "ready"}
        or deployment.observed_at is None
        or as_utc(deployment.observed_at) >= as_utc(stale_before)
    ):
        return None

    previous_status = agent.status
    now_utc = as_utc(now)
    deployment.observed_state = AgentStatus.FAILED.value
    if agent.stop_fence_revision is None and deployment.desired_state == "running":
        deployment.status = "failed"
        deployment.ended_at = as_utc_naive(now_utc)
        deployment.error_message = failure_message
    db.add(
        DeploymentEvent(
            deployment_id=deployment.id,
            event_type="monitor_failed",
            status="failed",
            node_id=deployment.node_id,
            error_message=failure_message,
        )
    )

    if agent.stop_fence_revision is None:
        aggregate = await _aggregate_agent_observation(db, agent.id)
        if aggregate is not None:
            agent.status = aggregate
            agent.observed_state = aggregate
            agent.observed_revision = int(agent.target_revision or 0)
            agent.observed_at = now_utc

    if agent.status == AgentStatus.FAILED.value and previous_status != AgentStatus.FAILED.value:
        db.add(
            Alert(
                agent_id=agent.id,
                type=AlertType.AGENT_DOWN,
                message=f"Agent {agent.name} has stale deployment runtime evidence",
            )
        )
        db.add(
            AgentLog(
                agent_id=agent.id,
                level="error",
                message=failure_message,
                timestamp=now_utc,
            )
        )
    return StaleObservation(agent, previous_status, (deployment,))


async def mark_agent_heartbeat_stale(
    *,
    db: AsyncSession,
    agent_id: uuid.UUID,
    stale_before: datetime,
    now: datetime,
    failure_message: str,
) -> StaleObservation | None:
    """Fail stale current Agent evidence, or stale legacy liveness without such evidence."""
    agent = await _locked_agent(db, agent_id)
    if agent is None or agent.status != AgentStatus.RUNNING.value:
        return None

    has_current_observation = (
        agent.observed_revision == int(agent.target_revision or 0) and agent.observed_at is not None
    )
    if has_current_observation:
        if agent.observed_state not in {"running", "ready"} or as_utc(agent.observed_at) >= as_utc(
            stale_before
        ):
            return None
    elif agent.last_heartbeat is None or as_utc(agent.last_heartbeat) >= as_utc(stale_before):
        return None

    current_work_result = await db.execute(
        select(Deployment.id)
        .where(
            Deployment.agent_id == agent.id,
            (Deployment.desired_action.is_not(None))
            | (Deployment.target_revision > 0)
            | (Deployment.observed_state.is_not(None)),
            Deployment.observed_state.in_(["running", "ready"]),
            Deployment.observed_revision == Deployment.target_revision,
        )
        .limit(1)
    )
    if current_work_result.scalar_one_or_none() is not None:
        return None

    previous_status = agent.status
    now_utc = as_utc(now)
    agent.status = AgentStatus.FAILED.value
    agent.observed_state = AgentStatus.FAILED.value
    agent.observed_revision = int(agent.target_revision or 0)
    db.add(
        Alert(
            agent_id=agent.id,
            type=AlertType.AGENT_DOWN,
            message=f"Agent {agent.name} has stale runtime evidence",
        )
    )
    db.add(
        AgentLog(
            agent_id=agent.id,
            level="error",
            message=failure_message,
            timestamp=now_utc,
        )
    )

    return StaleObservation(agent, previous_status, ())
