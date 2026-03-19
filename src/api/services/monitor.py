import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from src.api import database as database_module
from src.api.models import Agent, AgentLog, AgentStatus
from src.api.services.monitoring import STALE_THRESHOLD_SECONDS, monitor_agent_health
from src.api.services.self_healer import RecoveryAction, get_self_healing_service
from src.api.time_utils import utc_now_naive

logger = logging.getLogger(__name__)


def _agent_heartbeat_check(agent_id: str):
    async def _check() -> bool:
        async with database_module.async_session_maker() as session:
            result = await session.execute(select(Agent).where(Agent.id == uuid.UUID(agent_id)))
            agent = result.scalar_one_or_none()

            if not agent:
                return False

            last_heartbeat = agent.last_heartbeat or agent.created_at
            if not last_heartbeat:
                return False

            if last_heartbeat.tzinfo is None:
                last_heartbeat = last_heartbeat.replace(tzinfo=timezone.utc)

            return (datetime.now(timezone.utc) - last_heartbeat) <= timedelta(
                seconds=STALE_THRESHOLD_SECONDS,
            )

    return _check


async def _recover_agent_to_running(agent_id: str, metadata):
    async with database_module.async_session_maker() as session:
        result = await session.execute(select(Agent).where(Agent.id == uuid.UUID(agent_id)))
        agent = result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent {agent_id} not found for recovery")

        previous_status = agent.status
        agent.status = AgentStatus.RUNNING.value
        agent.last_heartbeat = utc_now_naive()
        session.add(
            AgentLog(
                agent_id=agent.id,
                level="warning",
                message="Self-healing recovery handler restored agent status to RUNNING",
                timestamp=datetime.now(timezone.utc),
            )
        )
        await session.commit()

        logger.info(
            "Self-healing recovery completed",
            extra={
                "agent_id": agent_id,
                "previous_status": previous_status,
                "metadata": metadata,
            },
        )


async def _sync_self_healing_agents(session, self_healing):
    """Register live agents for self-healing checks and prune removed agents."""
    result = await session.execute(
        select(Agent.id).where(Agent.status != AgentStatus.DELETING.value)
    )
    active_agents = {str(agent_id) for agent_id in result.scalars().all()}

    tracked_agents = set(self_healing.health_check_scheduler.get_all_health().keys())

    for agent_id in active_agents - tracked_agents:
        self_healing.register_agent(
            agent_id,
            health_check_fn=_agent_heartbeat_check(agent_id),
        )

    for agent_id in tracked_agents - active_agents:
        self_healing.unregister_agent(agent_id)


async def start_background_monitor():
    """Main loop for the background service.

    This loop intentionally runs only real runtime monitoring and self-healing.
    Synthetic demo activity is disabled here to keep monitor behavior truthful
    and observable.
    """

    logger.info("Starting background agent monitor...")
    self_healing = get_self_healing_service()

    await self_healing.start()

    if hasattr(self_healing, "register_recovery_handler"):
        self_healing.register_recovery_handler(
            RecoveryAction.RESTART,
            _recover_agent_to_running,
        )
        self_healing.register_recovery_handler(
            RecoveryAction.ROLLBACK,
            _recover_agent_to_running,
        )
    try:
        while True:
            try:
                async with database_module.async_session_maker() as session:
                    # Run real monitoring and self-healing logic.
                    await monitor_agent_health(session)
                    if hasattr(self_healing, "health_check_scheduler"):
                        await _sync_self_healing_agents(session, self_healing)
                        for agent_id in self_healing.health_check_scheduler.get_all_health():
                            await self_healing.check_and_recover(agent_id)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Error in background monitor: {e}")
                await asyncio.sleep(5)

            await asyncio.sleep(5)  # Run every 5 seconds
    except asyncio.CancelledError:
        logger.info("Background agent monitor cancellation requested")
        raise
    finally:
        try:
            await self_healing.stop()
        except Exception:
            logger.exception("Failed to stop self-healing service cleanly")
