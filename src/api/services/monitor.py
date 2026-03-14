import asyncio
import logging

from src.api import database as database_module
from src.api.services.monitoring import monitor_agent_health
from src.api.services.self_healer import get_self_healing_service

logger = logging.getLogger(__name__)


async def start_background_monitor():
    """Main loop for the background service.

    This loop intentionally runs only real runtime monitoring and self-healing.
    Synthetic demo activity is disabled here to keep monitor behavior truthful
    and observable.
    """

    logger.info("Starting background agent monitor...")
    self_healing = get_self_healing_service()
    await self_healing.start()
    try:
        while True:
            try:
                async with database_module.async_session_maker() as session:
                    # Run real monitoring and self-healing logic.
                    await monitor_agent_health(session)
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
