import asyncio
import logging

from src.api.config import get_settings
from src.api.database import dispose_engine, init_db
from src.api.logging_config import setup_json_logging
from src.api.services.monitor import start_background_monitor


async def _run() -> None:
    settings = get_settings()
    setup_json_logging(
        log_level=settings.log_level,
        json_format=settings.json_logging,
        log_file=settings.log_file,
    )
    logger = logging.getLogger(__name__)

    if not settings.background_monitor_enabled:
        logger.info("Background monitor worker is disabled by configuration")
        return

    logger.info("Initializing monitor worker database connection")
    await init_db()
    logger.info("Starting singleton monitor worker")
    try:
        await start_background_monitor()
    finally:
        await dispose_engine()


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
