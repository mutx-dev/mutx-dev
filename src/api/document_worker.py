import asyncio
import logging

from src.api.config import get_settings
from src.api.database import async_session_maker, dispose_engine, init_db
from src.api.logging_config import setup_json_logging
from src.api.services.document_jobs import (
    claim_next_document_job,
    execute_document_job,
    update_document_queue_depth,
)


async def _run() -> None:
    settings = get_settings()
    setup_json_logging(
        log_level=settings.log_level,
        json_format=settings.json_logging,
        log_file=settings.log_file,
    )
    logger = logging.getLogger(__name__)

    if not settings.documents_enabled:
        logger.info("Document worker is disabled by configuration")
        return

    await init_db()
    logger.info("Starting document worker loop")

    try:
        while True:
            async with async_session_maker() as session:
                claimed = await claim_next_document_job(session)
                if claimed is None:
                    await update_document_queue_depth(session)
                    await asyncio.sleep(settings.document_worker_poll_seconds)
                    continue
                await execute_document_job(session, claimed_job=claimed)
                await update_document_queue_depth(session)
    finally:
        await dispose_engine()


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
