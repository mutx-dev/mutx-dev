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
            await session.commit()

            from src.api.services.webhook_service import trigger_webhook_event
            await trigger_webhook_event(
                session,
                "alert.triggered",
                {
                    "agent_id": str(agent.id),
                    "alert_id": str(alert.id),
                    "type": AlertType.AGENT_DOWN.value,
                    "message": alert.message,
                },
            )

            # Log failure
            log = AgentLog(
                agent_id=agent.id,
                level="error",
                message=f"System: Agent marked as FAILED due to heartbeat timeout ({STALE_THRESHOLD_SECONDS}s).",
                timestamp=now,
            )
            session.add(log)

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
                    not Alert.resolved,
                )
                .values(resolved=True, resolved_at=now)
            )
            await session.commit()

            from src.api.services.webhook_service import trigger_webhook_event
            await trigger_webhook_event(
                session,
                "alert.resolved",
                {
                    "agent_id": str(agent.id),
                    "type": AlertType.AGENT_DOWN.value,
                    "message": "Agent recovered and is back to RUNNING",
                    "resolved_at": now.isoformat(),
                },
            )

            # Log recovery
            heal_log = AgentLog(
                agent_id=agent.id,
                level="info",
                message="System: Control plane detected failure and initiated automatic recovery. Agent is back to RUNNING.",
                timestamp=now,
            )
            session.add(heal_log)

    await session.commit()
