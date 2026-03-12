"""
Monitoring and Self-Healing logic for MUTX.
"""

import logging
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, AgentLog, Deployment, Alert, AlertType, User
from src.api.services.webhook_service import trigger_webhook_event
import aiohttp

logger = logging.getLogger(__name__)

# --- Configuration ---
HEARTBEAT_THRESHOLD_SECONDS = 60  # Agent is stale after 60s
STALE_THRESHOLD_SECONDS = 120  # Agent is failed after 120s
HEAL_THRESHOLD_SECONDS = 30  # Heal failed agents after 30s


async def monitor_agent_health(db_session: AsyncSession):
    """
    Main monitoring and self-healing lifecycle:
    1. Promote 'creating' -> 'running' after a delay
    2. Mark 'running' agents as 'failed' if heartbeat is missing
    3. Auto-heal 'failed' agents back to 'running'
    """
    now = datetime.utcnow()

    # 1. Promote CREATING -> RUNNING
    # This simulates the completion of provisioning
    result = await db_session.execute(select(Agent).where(Agent.status == "creating"))
    new_agents = result.scalars().all()
    for agent in new_agents:
        if now - agent.created_at > timedelta(seconds=10):
            old_status = agent.status
            agent.status = "running"
            agent.last_heartbeat = now

            # Ensure a deployment record exists
            dep_check = await db_session.execute(
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
                db_session.add(deployment)

            logger.info(f"Monitor: Agent {agent.name} ({agent.id}) promoted to RUNNING")

            # Trigger Webhook
            await trigger_webhook_event(
                db_session,
                "agent.status",
                {
                    "agent_id": str(agent.id),
                    "agent_name": agent.name,
                    "old_status": old_status,
                    "new_status": agent.status,
                },
                user_id=agent.user_id,
            )

    # 2. Detect Heartbeat Failures
    result = await db_session.execute(select(Agent).where(Agent.status == "running"))
    running_agents = result.scalars().all()

    for agent in running_agents:
        last_hb = agent.last_heartbeat or agent.created_at
        if now - last_hb > timedelta(seconds=STALE_THRESHOLD_SECONDS):
            logger.warning(f"Monitor: Agent {agent.name} ({agent.id}) is STALE. Marking as FAILED.")
            old_status = agent.status
            agent.status = "failed"

            # Create Alert
            alert = Alert(
                agent_id=agent.id,
                type=AlertType.AGENT_DOWN,
                message=f"Agent {agent.name} failed to report heartbeat for {STALE_THRESHOLD_SECONDS}s",
            )
            db_session.add(alert)

            # Log failure
            log = AgentLog(
                agent_id=agent.id,
                level="error",
                message=f"System: Agent marked as FAILED due to heartbeat timeout ({STALE_THRESHOLD_SECONDS}s).",
                timestamp=now,
            )
            db_session.add(log)

            # Trigger Webhook
            await trigger_webhook_event(
                db_session,
                "agent.status",
                {
                    "agent_id": str(agent.id),
                    "agent_name": agent.name,
                    "old_status": old_status,
                    "new_status": agent.status,
                },
                user_id=agent.user_id,
            )

            # Trigger Alert Webhook
            await trigger_webhook_event(
                db_session,
                "alert.created",
                {
                    "agent_id": str(agent.id),
                    "agent_name": agent.name,
                    "alert_type": AlertType.AGENT_DOWN.value,
                    "message": alert.message,
                },
                user_id=agent.user_id,
            )

    # 3. Auto-Heal Failed Agents
    result = await db_session.execute(select(Agent).where(Agent.status == "failed"))
    failed_agents = result.scalars().all()

    for agent in failed_agents:
        if now - agent.updated_at > timedelta(seconds=HEAL_THRESHOLD_SECONDS):
            logger.info(f"Auto-Healer: Restarting agent {agent.name} ({agent.id})...")
            old_status = agent.status
            agent.status = "running"
            agent.last_heartbeat = now

            # Resolve active AGENT_DOWN alerts
            await db_session.execute(
                update(Alert)
                .where(
                    Alert.agent_id == agent.id,
                    Alert.type == AlertType.AGENT_DOWN,
                    not Alert.resolved,
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
            db_session.add(heal_log)

            # Trigger Webhook
            await trigger_webhook_event(
                db_session,
                "agent.status",
                {
                    "agent_id": str(agent.id),
                    "agent_name": agent.name,
                    "old_status": old_status,
                    "new_status": agent.status,
                },
                user_id=agent.user_id,
            )

    await db_session.commit()
