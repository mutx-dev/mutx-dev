import asyncio
from dataclasses import dataclass
import logging
import os
from pathlib import Path
from datetime import datetime, timezone

from src.api import database as database_module
from src.api.metrics import set_background_monitor_failure_metrics
from src.api.services.monitoring import monitor_agent_health

logger = logging.getLogger(__name__)


@dataclass
class MonitorRuntimeState:
    heartbeat_file: Path | None = None
    started_at: datetime | None = None
    last_success_at: datetime | None = None
    last_error_at: datetime | None = None
    last_error: str | None = None
    consecutive_failures: int = 0

    def mark_started(self, started_at: datetime | None = None) -> None:
        if self.heartbeat_file is not None:
            self.heartbeat_file.unlink(missing_ok=True)
        self.started_at = started_at or datetime.now(timezone.utc)
        self.last_error = None
        self.consecutive_failures = 0

    def mark_success(self, succeeded_at: datetime | None = None) -> None:
        success_time = succeeded_at or datetime.now(timezone.utc)
        if self.heartbeat_file is not None:
            temporary_file = self.heartbeat_file.with_name(
                f".{self.heartbeat_file.name}.{os.getpid()}.tmp"
            )
            temporary_file.write_text(f"{success_time.timestamp():.6f}\n", encoding="utf-8")
            os.replace(temporary_file, self.heartbeat_file)
        self.last_success_at = success_time
        self.last_error = None
        self.consecutive_failures = 0

    def mark_error(self, error: Exception | str, failed_at: datetime | None = None) -> None:
        self.last_error_at = failed_at or datetime.now(timezone.utc)
        self.last_error = str(error)
        self.consecutive_failures += 1


_default_monitor_runtime_state = MonitorRuntimeState()


def get_monitor_runtime_state() -> MonitorRuntimeState:
    return _default_monitor_runtime_state


def heartbeat_is_fresh(
    heartbeat_file: str | Path,
    max_age_seconds: int,
    *,
    now: datetime | None = None,
) -> bool:
    """Return whether a successful monitor cycle heartbeat is recent and plausible."""

    try:
        recorded_timestamp = float(Path(heartbeat_file).read_text(encoding="utf-8").strip())
    except (OSError, ValueError):
        return False

    current_time = now or datetime.now(timezone.utc)
    age_seconds = current_time.timestamp() - recorded_timestamp
    return -5 <= age_seconds <= max_age_seconds


async def start_background_monitor(
    runtime_state: MonitorRuntimeState | None = None,
    *,
    max_consecutive_failures: int | None = None,
):
    """Run stale-heartbeat monitoring and publish monitor-worker health."""

    logger.info("Starting background agent monitor...")
    monitor_state = runtime_state or get_monitor_runtime_state()
    monitor_state.mark_started()
    set_background_monitor_failure_metrics(monitor_state.consecutive_failures)
    try:
        while True:
            try:
                async with database_module.async_session_maker() as session:
                    try:
                        await monitor_agent_health(session)
                        await session.commit()
                    except Exception:
                        await session.rollback()
                        raise

                monitor_state.mark_success()
                set_background_monitor_failure_metrics(monitor_state.consecutive_failures)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                monitor_state.mark_error(e)
                set_background_monitor_failure_metrics(monitor_state.consecutive_failures)
                logger.exception("Error in background monitor")
                if (
                    max_consecutive_failures is not None
                    and monitor_state.consecutive_failures >= max_consecutive_failures
                ):
                    raise RuntimeError(
                        "Background monitor exceeded the configured consecutive failure limit "
                        f"({max_consecutive_failures})"
                    ) from e
                await asyncio.sleep(5)
                continue

            await asyncio.sleep(5)  # Run every 5 seconds
    except asyncio.CancelledError:
        logger.info("Background agent monitor cancellation requested")
        raise
