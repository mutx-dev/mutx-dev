"""Monitor authenticated agent heartbeats and record stale-runtime failures."""

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, AgentLog, Deployment, Alert, AlertType
from src.api.services.webhook_service import trigger_agent_status_event, trigger_deployment_event
from src.api.time_utils import as_utc, as_utc_naive

logger = logging.getLogger(__name__)

# --- Configuration ---
STALE_THRESHOLD_SECONDS = 120  # Time since the last received runtime heartbeat


async def _get_latest_deployment(session: AsyncSession, agent_id: uuid.UUID) -> Deployment | None:
    result = await session.execute(
        select(Deployment)
        .where(Deployment.agent_id == agent_id)
        .order_by(Deployment.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _record_deployment_event(
    session: AsyncSession,
    deployment: Deployment,
    *,
    event_type: str,
    status: str,
    error_message: str | None = None,
) -> None:
    from src.api.models import DeploymentEvent

    session.add(
        DeploymentEvent(
            deployment_id=deployment.id,
            event_type=event_type,
            status=status,
            node_id=deployment.node_id,
            error_message=error_message,
        )
    )


async def _emit_agent_status_webhook(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    agent_id: uuid.UUID,
    old_status: str,
    new_status: str,
    agent_name: str,
) -> None:
    try:
        await trigger_agent_status_event(
            session, user_id, agent_id, old_status, new_status, agent_name
        )
    except Exception:
        logger.exception(
            "Monitor webhook emission failed for agent.status",
            extra={"agent_id": str(agent_id), "old_status": old_status, "new_status": new_status},
        )


async def _emit_deployment_webhook(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    deployment_id: uuid.UUID,
    agent_id: uuid.UUID,
    event_type: str,
    status: str,
) -> None:
    try:
        await trigger_deployment_event(
            session,
            user_id,
            deployment_id,
            agent_id,
            event_type=event_type,
            status=status,
        )
    except Exception:
        logger.exception(
            "Monitor webhook emission failed for deployment.event",
            extra={
                "agent_id": str(agent_id),
                "deployment_id": str(deployment_id),
                "event_type": event_type,
                "status": status,
            },
        )


async def monitor_agent_health(session: AsyncSession):
    """Mark agents failed when their last runtime heartbeat is stale."""
    now = datetime.now(timezone.utc)
    deployment_now = as_utc_naive(now)

    # A timer cannot prove provisioning or recover a failed runtime.
    # Only stale-heartbeat observation remains in this monitor path.
    result = await session.execute(select(Agent).where(Agent.status == "running"))
    running_agents = result.scalars().all()

    for agent in running_agents:
        # Creation time is intent history, not a received runtime heartbeat.
        last_hb = as_utc(agent.last_heartbeat) if agent.last_heartbeat else None
        if last_hb and now - last_hb > timedelta(seconds=STALE_THRESHOLD_SECONDS):
            logger.warning(f"Monitor: Agent {agent.name} ({agent.id}) is STALE. Marking as FAILED.")
            old_status = agent.status
            failure_message = (
                f"System: Agent marked as FAILED due to heartbeat timeout "
                f"({STALE_THRESHOLD_SECONDS}s)."
            )

            with session.no_autoflush:
                deployment = await _get_latest_deployment(session, agent.id)

            agent.status = "failed"

            # Create Alert
            alert = Alert(
                agent_id=agent.id,
                type=AlertType.AGENT_DOWN,
                message=f"Agent {agent.name} failed to report heartbeat for {STALE_THRESHOLD_SECONDS}s",
            )
            session.add(alert)

            session.add(
                AgentLog(
                    agent_id=agent.id,
                    level="error",
                    message=failure_message,
                    timestamp=now,
                )
            )

            if deployment is not None:
                deployment.status = "failed"
                deployment.ended_at = deployment_now
                deployment.error_message = failure_message
                _record_deployment_event(
                    session,
                    deployment,
                    event_type="monitor_failed",
                    status="failed",
                    error_message=failure_message,
                )
            await session.flush()

            if deployment is not None:
                await _emit_deployment_webhook(
                    session,
                    user_id=agent.user_id,
                    deployment_id=deployment.id,
                    agent_id=agent.id,
                    event_type="monitor_failed",
                    status="failed",
                )

            await _emit_agent_status_webhook(
                session,
                user_id=agent.user_id,
                agent_id=agent.id,
                old_status=old_status,
                new_status=agent.status,
                agent_name=agent.name,
            )
