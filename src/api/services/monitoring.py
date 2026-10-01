"""Supervise qualified runtime observations and authenticated-agent liveness."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, Deployment
from src.api.services.deployment_lifecycle import (
    StaleObservation,
    mark_agent_heartbeat_stale,
    mark_stale_deployment_observation,
)
from src.api.services.webhook_service import trigger_agent_status_event, trigger_deployment_event

logger = logging.getLogger(__name__)

STALE_THRESHOLD_SECONDS = 120


async def _emit_stale_observation(session: AsyncSession, result: StaleObservation) -> None:
    agent = result.agent
    for deployment in result.failed_deployments:
        try:
            await trigger_deployment_event(
                session,
                agent.user_id,
                deployment.id,
                agent.id,
                event_type="monitor_failed",
                status="failed",
            )
        except Exception:
            logger.exception(
                "Monitor webhook emission failed for deployment.event",
                extra={"agent_id": str(agent.id), "deployment_id": str(deployment.id)},
            )
    if result.previous_status != agent.status:
        try:
            await trigger_agent_status_event(
                session,
                agent.user_id,
                agent.id,
                result.previous_status,
                agent.status,
                agent.name,
            )
        except Exception:
            logger.exception(
                "Monitor webhook emission failed for agent.status",
                extra={"agent_id": str(agent.id), "new_status": agent.status},
            )


async def monitor_agent_health(session: AsyncSession) -> None:
    """Fail stale current targets after rechecking their revision and evidence time."""
    now = datetime.now(timezone.utc)
    stale_before = now - timedelta(seconds=STALE_THRESHOLD_SECONDS)
    failure_message = (
        "System: Agent deployment marked as FAILED due to stale qualified runtime evidence "
        f"({STALE_THRESHOLD_SECONDS}s)."
    )

    stale_targets = await session.execute(
        select(Deployment.id, Deployment.target_revision)
        .where(
            Deployment.observed_state.in_(["running", "ready"]),
            Deployment.observed_revision == Deployment.target_revision,
            Deployment.observed_at.is_not(None),
            Deployment.observed_at < stale_before,
        )
        .order_by(Deployment.agent_id, Deployment.id)
    )
    for deployment_id, target_revision in stale_targets.all():
        result = await mark_stale_deployment_observation(
            db=session,
            deployment_id=deployment_id,
            expected_revision=target_revision,
            stale_before=stale_before,
            now=now,
            failure_message=failure_message,
        )
        if result is not None:
            logger.warning(
                "Monitor marked stale deployment evidence failed",
                extra={"agent_id": str(result.agent.id), "deployment_id": str(deployment_id)},
            )
            await _emit_stale_observation(session, result)

    current_agent_observation = and_(
        Agent.observed_revision == Agent.target_revision,
        Agent.observed_at.is_not(None),
    )
    stale_agents = await session.execute(
        select(Agent.id).where(
            Agent.status == "running",
            or_(
                and_(
                    current_agent_observation,
                    Agent.observed_state.in_(["running", "ready"]),
                    Agent.observed_at < stale_before,
                ),
                and_(
                    not_(current_agent_observation),
                    Agent.last_heartbeat.is_not(None),
                    Agent.last_heartbeat < stale_before,
                ),
            ),
        )
    )
    for (agent_id,) in stale_agents.all():
        result = await mark_agent_heartbeat_stale(
            db=session,
            agent_id=agent_id,
            stale_before=stale_before,
            now=now,
            failure_message=(
                "System: Agent marked as FAILED due to stale current runtime evidence "
                f"({STALE_THRESHOLD_SECONDS}s)."
            ),
        )
        if result is not None:
            logger.warning(
                "Monitor marked stale agent evidence failed",
                extra={"agent_id": str(agent_id)},
            )
            await _emit_stale_observation(session, result)
