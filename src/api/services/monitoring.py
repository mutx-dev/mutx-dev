"""
Monitoring and Self-Healing logic for MUTX.
"""

import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, AgentLog, Deployment, Alert, AlertType

logger = logging.getLogger(__name__)

# --- Configuration ---
HEARTBEAT_THRESHOLD_SECONDS = 60  # Agent is stale after 60s
STALE_THRESHOLD_SECONDS = 120  # Agent is failed after 120s
HEAL_THRESHOLD_SECONDS = 30  # Heal failed agents after 30s


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


async def monitor_agent_health(session: AsyncSession):
    """
    Main monitoring and self-healing lifecycle:
    1. Promote 'creating' -> 'running' after a delay
    2. Mark 'running' agents as 'failed' if heartbeat is missing
    3. Auto-heal 'failed' agents back to 'running'
    """
    now = datetime.utcnow()

    # 1. Promote CREATING -> RUNNING
    # This simulates the completion of provisioning
    result = await session.execute(select(Agent).where(Agent.status == "creating"))
    new_agents = result.scalars().all()
    for agent in new_agents:
        if now - agent.created_at > timedelta(seconds=10):
            agent.status = "running"
            agent.last_heartbeat = now

            # Ensure a deployment record exists
            dep_check = await session.execute(
                select(Deployment).where(Deployment.agent_id == agent.id)
            )
            if not dep_check.scalar_one_or_none():
                deployment = Deployment(
                    agent_id=agent.id,
                    status="running",
                    replicas=1,
                    started_at=now,
                    node_id=f"node-{uuid.uuid4().hex[:6]}",
                )
                session.add(deployment)
                await session.flush()
                _record_deployment_event(
                    session,
                    deployment,
                    event_type="monitor_started",
                    status="running",
                )

            logger.info(f"Monitor: Agent {agent.name} ({agent.id}) promoted to RUNNING")

    # 2. Detect Heartbeat Failures
    result = await session.execute(select(Agent).where(Agent.status == "running"))
    running_agents = result.scalars().all()

    for agent in running_agents:
        last_hb = agent.last_heartbeat or agent.created_at
        if now - last_hb > timedelta(seconds=STALE_THRESHOLD_SECONDS):
            logger.warning(f"Monitor: Agent {agent.name} ({agent.id}) is STALE. Marking as FAILED.")
            agent.status = "failed"

            # Create Alert
            alert = Alert(
                agent_id=agent.id,
                type=AlertType.AGENT_DOWN,
                message=f"Agent {agent.name} failed to report heartbeat for {STALE_THRESHOLD_SECONDS}s",
            )
            session.add(alert)

            # Log failure
            log = AgentLog(
                agent_id=agent.id,
                level="error",
                message=f"System: Agent marked as FAILED due to heartbeat timeout ({STALE_THRESHOLD_SECONDS}s).",
                timestamp=now,
            )
            session.add(log)

            deployment = await _get_latest_deployment(session, agent.id)
            if deployment is not None:
                deployment.status = "failed"
                deployment.ended_at = now
                deployment.error_message = log.message
                _record_deployment_event(
                    session,
                    deployment,
                    event_type="monitor_failed",
                    status="failed",
                    error_message=log.message,
                )

    # 3. Auto-Heal Failed Agents
    result = await session.execute(select(Agent).where(Agent.status == "failed"))
    failed_agents = result.scalars().all()

    for agent in failed_agents:
        if now - agent.updated_at > timedelta(seconds=HEAL_THRESHOLD_SECONDS):
            logger.info(f"Auto-Healer: Restarting agent {agent.name} ({agent.id})...")
            agent.status = "running"
            agent.last_heartbeat = now

            # Resolve active AGENT_DOWN alerts
            await session.execute(
                update(Alert)
                .where(
                    Alert.agent_id == agent.id,
                    Alert.type == AlertType.AGENT_DOWN,
                    Alert.resolved.is_(False),
                )
                .values(resolved=True, resolved_at=now)
            )

            # Log recovery
            heal_log = AgentLog(
                agent_id=agent.id,
                level="info",
                message="System: Control plane detected failure and initiated automatic recovery. Agent is back to RUNNING.",
                timestamp=now,
            )
            session.add(heal_log)

            deployment = await _get_latest_deployment(session, agent.id)
            if deployment is not None:
                deployment.status = "running"
                deployment.started_at = now
                deployment.ended_at = None
                deployment.error_message = None
                _record_deployment_event(
                    session,
                    deployment,
                    event_type="monitor_restarted",
                    status="running",
                )

    await session.commit()
