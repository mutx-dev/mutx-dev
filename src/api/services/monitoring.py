"""
Monitoring and Self-Healing logic for MUTX.
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, AgentLog, Deployment, Alert, AlertType
from src.api.services.self_healer import (
    get_self_healing_service,
    RecoveryAction,
    RecoveryStatus,
    SelfHealingService,
)

logger = logging.getLogger(__name__)

# --- Configuration ---
HEARTBEAT_THRESHOLD_SECONDS = 60  # Agent is stale after 60s
STALE_THRESHOLD_SECONDS = 120  # Agent is failed after 120s
HEAL_THRESHOLD_SECONDS = 30  # Heal failed agents after 30s


async def restart_agent_handler(agent_id_str: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Real handler to restart an agent in the DB.
    This would eventually call K8s/Docker or whatever runtime we use.
    For now, it updates the agent record in the DB to 'running'.
    """
    from src.api import database as database_module

    agent_id = uuid.UUID(agent_id_str)
    now = datetime.utcnow()

    async with database_module.async_session_maker() as session:
        result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            raise ValueError(f"Agent {agent_id_str} not found")

        agent.status = "running"
        agent.last_heartbeat = now
        agent.updated_at = now

        # Create log entry for the restart
        log = AgentLog(
            agent_id=agent.id,
            level="info",
            message=f"Self-Healer: Agent restarted successfully (Reason: {metadata.get('reason', 'unknown')})",
            timestamp=now,
        )
        session.add(log)

        # Resolve active alerts
        await session.execute(
            update(Alert)
            .where(
                Alert.agent_id == agent.id,
                Alert.type == AlertType.AGENT_DOWN,
                Alert.resolved.is_(False),
            )
            .values(resolved=True, resolved_at=now)
        )

        await session.commit()

    return {"status": "success", "restarted_at": now.isoformat()}


def initialize_self_healing(service: SelfHealingService):
    """Initializes the self-healing service with standard handlers."""
    service.register_recovery_handler(RecoveryAction.RESTART, restart_agent_handler)
    logger.info("Self-healing service initialized with standard handlers")


async def monitor_agent_health(session: AsyncSession):
    """
    Main monitoring and self-healing lifecycle:
    1. Promote 'creating' -> 'running' after a delay
    2. Mark 'running' agents as 'failed' if heartbeat is missing
    3. Auto-heal 'failed' agents back to 'running' via SelfHealingService
    """
    now = datetime.utcnow()
    self_healing = get_self_healing_service()

    # Initialize if not already done (in a real app, this would happen at startup)
    if RecoveryAction.RESTART not in self_healing.recovery_executor._recovery_handlers:
        initialize_self_healing(self_healing)

    # 1. Promote CREATING -> RUNNING
    # This simulates the completion of provisioning
    result = await session.execute(select(Agent).where(Agent.status == "creating"))
    new_agents = result.scalars().all()
    for agent in new_agents:
        if now - agent.created_at > timedelta(seconds=10):
            agent.status = "running"
            agent.last_heartbeat = now
            agent.updated_at = now

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

            # Register with advanced self-healing service
            self_healing.register_agent(
                str(agent.id),
                initial_version=agent.metadata.get("version") if agent.metadata else "1.0.0",
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
            agent.updated_at = now

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

    # 3. Auto-Heal Failed Agents using SelfHealingService
    result = await session.execute(select(Agent).where(Agent.status == "failed"))
    failed_agents = result.scalars().all()

    for agent in failed_agents:
        agent_id_str = str(agent.id)
        # Check if it's time to heal
        if now - agent.updated_at > timedelta(seconds=HEAL_THRESHOLD_SECONDS):
            logger.info(f"Auto-Healer: Initiating recovery for agent {agent.name} ({agent.id})...")

            # Execute recovery via the advanced service
            # The session will be handled within the recovery handler
            recovery_record = await self_healing.trigger_recovery(
                agent_id_str, RecoveryAction.RESTART, {"reason": "heartbeat_timeout"}
            )

            if recovery_record.status == RecoveryStatus.SUCCESS:
                # The handler updates the DB, so we don't need to do it here
                # but we need to refresh the agent object if we were to use it.
                logger.info(
                    f"Auto-Healer: Recovery successful for {agent_id_str} "
                    f"(Record: {recovery_record.record_id})"
                )
            else:
                logger.error(
                    f"Auto-Healer: Recovery failed for {agent_id_str}: {recovery_record.error_message}"
                )

    await session.commit()
