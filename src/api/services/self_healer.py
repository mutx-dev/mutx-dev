import asyncio
import logging
import uuid
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from collections import deque

logger = logging.getLogger(__name__)


class RecoveryAction(str, Enum):
    RESTART = "restart"
    ROLLBACK = "rollback"
    SCALE_UP = "scale_up"
    SCALE_DOWN = "scale_down"
    RECREATE = "recreate"
    NONE = "none"


class RecoveryStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class RecoveryConfig:
    max_retries: int = 3
    retry_delay_seconds: float = 5.0
    health_check_interval_seconds: int = 10
    health_check_timeout_seconds: float = 5.0
    max_consecutive_failures: int = 3
    rollback_on_failure: bool = True
    enable_auto_restart: bool = True
    enable_auto_rollback: bool = True
    min_recovery_interval_seconds: float = 60.0


@dataclass
class RecoveryRecord:
    record_id: str
    agent_id: str
    action: RecoveryAction
    status: RecoveryStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    previous_version: Optional[str] = None
    new_version: Optional[str] = None
    error_message: Optional[str] = None
    recovery_time_seconds: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentHealth:
    agent_id: str
    is_healthy: bool
    last_check: datetime
    failure_count: int = 0
    consecutive_failures: int = 0
    last_failure_reason: Optional[str] = None
    last_recovery_at: Optional[datetime] = None
    stable_version: Optional[str] = None


@dataclass
class HealthCheckResult:
    agent_id: str
    is_healthy: bool
    checked_at: datetime
    response_time_ms: float = 0.0
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class VersionManager:
    def __init__(self, max_versions: int = 10):
        self.max_versions = max_versions
        self._agent_versions: Dict[str, deque] = {}
        self._current_versions: Dict[str, str] = {}
        self._stable_versions: Dict[str, str] = {}

    def record_version(self, agent_id: str, version: str):
        if agent_id not in self._agent_versions:
            self._agent_versions[agent_id] = deque(maxlen=self.max_versions)

        versions = self._agent_versions[agent_id]
        if version not in versions:
            versions.append(version)

        self._current_versions[agent_id] = version

    def get_current_version(self, agent_id: str) -> Optional[str]:
        return self._current_versions.get(agent_id)

    def get_previous_version(self, agent_id: str) -> Optional[str]:
        versions = self._agent_versions.get(agent_id)
        if not versions or len(versions) < 2:
            return None

        return list(versions)[-2]

    def get_stable_version(self, agent_id: str) -> Optional[str]:
        return self._stable_versions.get(agent_id)

    def mark_stable_version(self, agent_id: str, version: Optional[str] = None):
        if version is None:
            version = self._current_versions.get(agent_id)

        if version:
            self._stable_versions[agent_id] = version
            logger.info(f"Marked version {version} as stable for agent {agent_id}")

    def get_version_history(self, agent_id: str) -> List[str]:
        versions = self._agent_versions.get(agent_id)
        return list(versions) if versions else []


class RecoveryExecutor:
    def __init__(
        self,
        config: RecoveryConfig,
        version_manager: VersionManager,
    ):
        self.config = config
        self.version_manager = version_manager
        self._recovery_handlers: Dict[RecoveryAction, Callable] = {}
        self._lock = asyncio.Lock()

    def register_recovery_handler(
        self,
        action: RecoveryAction,
        handler: Callable,
    ):
        self._recovery_handlers[action] = handler
        logger.info(f"Registered recovery handler for {action.value}")

    async def execute_recovery(
        self,
        agent_id: str,
        action: RecoveryAction,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RecoveryRecord:
        record_id = str(uuid.uuid4())
        record = RecoveryRecord(
            record_id=record_id,
            agent_id=agent_id,
            action=action,
            status=RecoveryStatus.PENDING,
            started_at=datetime.utcnow(),
            metadata=metadata or {},
        )

        previous_version = self.version_manager.get_current_version(agent_id)
        record.previous_version = previous_version

        logger.info(f"Starting recovery for agent {agent_id}: {action.value}")

        try:
            handler = self._recovery_handlers.get(action)
            if not handler:
                raise ValueError(f"No handler for recovery action {action.value}")

            record.status = RecoveryStatus.IN_PROGRESS

            if asyncio.iscoroutinefunction(handler):
                result = await handler(agent_id, metadata or {})
            else:
                result = handler(agent_id, metadata or {})

            if result is not None and isinstance(result, dict):
                record.new_version = result.get("version")
                record.metadata.update(result.get("metadata", {}))

            if action == RecoveryAction.RESTART or action == RecoveryAction.RECREATE:
                new_version = self.version_manager.get_current_version(agent_id)
                if new_version and new_version != previous_version:
                    record.new_version = new_version

            record.status = RecoveryStatus.SUCCESS
            record.completed_at = datetime.utcnow()
            record.recovery_time_seconds = (
                record.completed_at - record.started_at
            ).total_seconds()

            logger.info(
                f"Recovery successful for agent {agent_id}: {action.value} "
                f"in {record.recovery_time_seconds:.2f}s"
            )

        except Exception as e:
            record.status = RecoveryStatus.FAILED
            record.completed_at = datetime.utcnow()
            record.error_message = str(e)
            record.recovery_time_seconds = (
                record.completed_at - record.started_at
            ).total_seconds()

            logger.error(
                f"Recovery failed for agent {agent_id}: {str(e)}"
            )

            if self.config.rollback_on_failure and action != RecoveryAction.ROLLBACK:
                logger.info(f"Attempting automatic rollback for agent {agent_id}")
                rollback_record = await self._execute_rollback(agent_id, record)
                if rollback_record.status == RecoveryStatus.SUCCESS:
                    record.status = RecoveryStatus.PARTIAL

        return record

    async def _execute_rollback(
        self,
        agent_id: str,
        original_record: RecoveryRecord,
    ) -> RecoveryRecord:
        stable_version = self.version_manager.get_stable_version(agent_id)
        previous_version = self.version_manager.get_previous_version(agent_id)

        target_version = stable_version or previous_version
        if not target_version:
            logger.warning(f"No version to rollback to for agent {agent_id}")
            return RecoveryRecord(
                record_id=str(uuid.uuid4()),
                agent_id=agent_id,
                action=RecoveryAction.ROLLBACK,
                status=RecoveryStatus.FAILED,
                started_at=datetime.utcnow(),
                error_message="No stable version available for rollback",
            )

        rollback_handler = self._recovery_handlers.get(RecoveryAction.ROLLBACK)
        if not rollback_handler:
            return RecoveryRecord(
                record_id=str(uuid.uuid4()),
                agent_id=agent_id,
                action=RecoveryAction.ROLLBACK,
                status=RecoveryStatus.FAILED,
                started_at=datetime.utcnow(),
                error_message="No rollback handler registered",
            )

        try:
            if asyncio.iscoroutinefunction(rollback_handler):
                await rollback_handler(agent_id, {"version": target_version})
            else:
                rollback_handler(agent_id, {"version": target_version})

            return RecoveryRecord(
                record_id=str(uuid.uuid4()),
                agent_id=agent_id,
                action=RecoveryAction.ROLLBACK,
                status=RecoveryStatus.SUCCESS,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                previous_version=original_record.previous_version,
                new_version=target_version,
            )
        except Exception as e:
            return RecoveryRecord(
                record_id=str(uuid.uuid4()),
                agent_id=agent_id,
                action=RecoveryAction.ROLLBACK,
                status=RecoveryStatus.FAILED,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                error_message=str(e),
            )


class HealthCheckScheduler:
    def __init__(
        self,
        check_interval: int = 30,
        timeout: float = 5.0,
        max_retries: int = 3,
    ):
        self.check_interval = check_interval
        self.timeout = timeout
        self.max_retries = max_retries
        self._health_checkers: Dict[str, Callable] = {}
        self._agent_health: Dict[str, AgentHealth] = {}
        self._scheduled_tasks: Dict[str, asyncio.Task] = {}
        self._is_running = False
        self._lock = asyncio.Lock()

    def register_health_checker(self, agent_id: str, checker: Callable):
        self._health_checkers[agent_id] = checker
        self._agent_health[agent_id] = AgentHealth(
            agent_id=agent_id,
            is_healthy=True,
            last_check=datetime.utcnow(),
        )
        logger.info(f"Registered health checker for agent {agent_id}")

    def unregister_health_checker(self, agent_id: str):
        self._health_checkers.pop(agent_id, None)
        self._agent_health.pop(agent_id, None)

        if agent_id in self._scheduled_tasks:
            task = self._scheduled_tasks[agent_id]
            task.cancel()
            del self._scheduled_tasks[agent_id]

    async def start(self):
        self._is_running = True
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        logger.info("Health check scheduler started")

    async def stop(self):
        self._is_running = False
        if hasattr(self, "_scheduler_task"):
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass

        for task in self._scheduled_tasks.values():
            task.cancel()

        self._scheduled_tasks.clear()
        logger.info("Health check scheduler stopped")

    async def _scheduler_loop(self):
        while self._is_running:
            try:
                await self._run_health_checks()
            except Exception as e:
                logger.error(f"Health check scheduler error: {str(e)}")

            await asyncio.sleep(self.check_interval)

    async def _run_health_checks(self):
        for agent_id in list(self._health_checkers.keys()):
            result = await self._check_agent_health(agent_id)
            await self._update_agent_health(agent_id, result)

    async def _check_agent_health(self, agent_id: str) -> HealthCheckResult:
        checker = self._health_checkers.get(agent_id)
        if not checker:
            return HealthCheckResult(
                agent_id=agent_id,
                is_healthy=False,
                checked_at=datetime.utcnow(),
                error_message="No health checker registered",
            )

        start_time = time.time()

        for attempt in range(self.max_retries):
            try:
                if asyncio.iscoroutinefunction(checker):
                    is_healthy = await asyncio.wait_for(checker(), timeout=self.timeout)
                else:
                    is_healthy = checker()

                response_time = (time.time() - start_time) * 1000

                return HealthCheckResult(
                    agent_id=agent_id,
                    is_healthy=bool(is_healthy),
                    checked_at=datetime.utcnow(),
                    response_time_ms=response_time,
                )

            except asyncio.TimeoutError:
                logger.warning(f"Health check timeout for {agent_id}, attempt {attempt + 1}")
            except Exception as e:
                logger.warning(f"Health check error for {agent_id}: {str(e)}")

            if attempt < self.max_retries - 1:
                await asyncio.sleep(1.0)

        response_time = (time.time() - start_time) * 1000

        return HealthCheckResult(
            agent_id=agent_id,
            is_healthy=False,
            checked_at=datetime.utcnow(),
            response_time_ms=response_time,
            error_message=f"Failed after {self.max_retries} attempts",
        )

    async def _update_agent_health(
        self,
        agent_id: str,
        result: HealthCheckResult,
    ):
        async with self._lock:
            health = self._agent_health.get(agent_id)
            if not health:
                return

            health.last_check = result.checked_at

            if result.is_healthy:
                if not health.is_healthy:
                    health.last_recovery_at = result.checked_at
                    health.consecutive_failures = 0

                health.is_healthy = True
                health.failure_count = 0
            else:
                health.consecutive_failures += 1
                health.failure_count += 1
                health.last_failure_reason = result.error_message
                health.is_healthy = False

    def get_agent_health(self, agent_id: str) -> Optional[AgentHealth]:
        return self._agent_health.get(agent_id)

    def get_all_health(self) -> Dict[str, AgentHealth]:
        return dict(self._agent_health)


class RecoveryTimeTracker:
    def __init__(self):
        self._recovery_times: Dict[str, deque] = {}
        self._lock = asyncio.Lock()

    async def record_recovery_time(
        self,
        agent_id: str,
        recovery_time_seconds: float,
    ):
        async with self._lock:
            if agent_id not in self._recovery_times:
                self._recovery_times[agent_id] = deque(maxlen=100)

            self._recovery_times[agent_id].append({
                "timestamp": datetime.utcnow(),
                "recovery_time_seconds": recovery_time_seconds,
            })

    async def get_average_recovery_time(self, agent_id: str) -> Optional[float]:
        async with self._lock:
            times = self._recovery_times.get(agent_id)
            if not times:
                return None

            records = list(times)
            if not records:
                return None

            total = sum(r["recovery_time_seconds"] for r in records)
            return total / len(records)

    async def get_recovery_stats(
        self,
        agent_id: str,
        since: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        async with self._lock:
            times = self._recovery_times.get(agent_id)
            if not times:
                return {
                    "agent_id": agent_id,
                    "total_recoveries": 0,
                    "average_recovery_time_seconds": 0.0,
                    "min_recovery_time_seconds": 0.0,
                    "max_recovery_time_seconds": 0.0,
                }

            records = list(times)
            if since:
                records = [r for r in records if r["timestamp"] >= since]

            if not records:
                return {
                    "agent_id": agent_id,
                    "total_recoveries": 0,
                    "average_recovery_time_seconds": 0.0,
                }

            recovery_times = [r["recovery_time_seconds"] for r in records]

            return {
                "agent_id": agent_id,
                "total_recoveries": len(records),
                "average_recovery_time_seconds": sum(recovery_times) / len(recovery_times),
                "min_recovery_time_seconds": min(recovery_times),
                "max_recovery_time_seconds": max(recovery_times),
                "last_recovery_time_seconds": recovery_times[-1],
            }


class SelfHealingService:
    def __init__(self, config: Optional[RecoveryConfig] = None):
        self.config = config or RecoveryConfig()

        self.version_manager = VersionManager()
        self.recovery_executor = RecoveryExecutor(self.config, self.version_manager)
        self.health_check_scheduler = HealthCheckScheduler(
            check_interval=self.config.health_check_interval_seconds,
            timeout=self.config.health_check_timeout_seconds,
            max_retries=3,
        )
        self.recovery_time_tracker = RecoveryTimeTracker()

        self._recovery_history: deque = deque(maxlen=1000)
        self._last_recovery_time: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()

        self._on_recovery_callbacks: List[Callable] = []
        self._on_failure_callbacks: List[Callable] = []

    async def start(self):
        await self.health_check_scheduler.start()
        logger.info("Self-healing service started")

    async def stop(self):
        await self.health_check_scheduler.stop()
        logger.info("Self-healing service stopped")

    def register_agent(
        self,
        agent_id: str,
        health_check_fn: Optional[Callable] = None,
        initial_version: Optional[str] = None,
    ):
        if health_check_fn:
            self.health_check_scheduler.register_health_checker(agent_id, health_check_fn)

        if initial_version:
            self.version_manager.record_version(agent_id, initial_version)
            self.version_manager.mark_stable_version(agent_id, initial_version)

        logger.info(f"Registered agent {agent_id} with self-healing")

    def unregister_agent(self, agent_id: str):
        self.health_check_scheduler.unregister_health_checker(agent_id)
        logger.info(f"Unregistered agent {agent_id} from self-healing")

    def register_recovery_handler(
        self,
        action: RecoveryAction,
        handler: Callable,
    ):
        self.recovery_executor.register_recovery_handler(action, handler)

    def on_recovery(self, callback: Callable):
        self._on_recovery_callbacks.append(callback)

    def on_failure(self, callback: Callable):
        self._on_failure_callbacks.append(callback)

    async def check_and_recover(self, agent_id: str) -> Optional[RecoveryRecord]:
        async with self._lock:
            if not self.config.enable_auto_restart:
                return None

            if agent_id in self._last_recovery_time:
                time_since_last = (datetime.utcnow() - self._last_recovery_time[agent_id]).total_seconds()
                if time_since_last < self.config.min_recovery_interval_seconds:
                    logger.debug(
                        f"Skipping recovery for {agent_id}: "
                        f"too soon since last recovery ({time_since_last:.1f}s)"
                    )
                    return None

        health = self.health_check_scheduler.get_agent_health(agent_id)

        if not health:
            logger.warning(f"No health data for agent {agent_id}")
            return None

        if health.consecutive_failures >= self.config.max_consecutive_failures:
            logger.warning(
                f"Agent {agent_id} has {health.consecutive_failures} consecutive failures, "
                f"initiating recovery"
            )

            for callback in self._on_failure_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(agent_id, health)
                    else:
                        callback(agent_id, health)
                except Exception as e:
                    logger.error(f"Failure callback error: {str(e)}")

            recovery_record = await self._execute_recovery(agent_id)

            async with self._lock:
                self._recovery_history.append(recovery_record)
                if recovery_record.status in [RecoveryStatus.SUCCESS, RecoveryStatus.PARTIAL]:
                    self._last_recovery_time[agent_id] = datetime.utcnow()

            if recovery_record.status == RecoveryStatus.SUCCESS:
                self.version_manager.mark_stable_version(
                    agent_id,
                    recovery_record.new_version,
                )

                await self.recovery_time_tracker.record_recovery_time(
                    agent_id,
                    recovery_record.recovery_time_seconds,
                )

                for callback in self._on_recovery_callbacks:
                    try:
                        if asyncio.iscoroutinefunction(callback):
                            await callback(agent_id, recovery_record)
                        else:
                            callback(agent_id, recovery_record)
                    except Exception as e:
                        logger.error(f"Recovery callback error: {str(e)}")

            return recovery_record

        return None

    async def _execute_recovery(
        self,
        agent_id: str,
    ) -> RecoveryRecord:
        action = RecoveryAction.RESTART

        if self.config.enable_auto_rollback and self.version_manager.get_stable_version(agent_id):
            action = RecoveryAction.ROLLBACK

        metadata = {
            "trigger": "consecutive_failures",
            "consecutive_failures": self.health_check_scheduler.get_agent_health(agent_id).consecutive_failures,
        }

        return await self.recovery_executor.execute_recovery(agent_id, action, metadata)

    async def trigger_recovery(
        self,
        agent_id: str,
        action: RecoveryAction,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RecoveryRecord:
        logger.info(f"Manually triggering {action.value} for agent {agent_id}")

        record = await self.recovery_executor.execute_recovery(agent_id, action, metadata)

        async with self._lock:
            self._recovery_history.append(record)

        if record.status == RecoveryStatus.SUCCESS:
            self.version_manager.mark_stable_version(agent_id, record.new_version)

            await self.recovery_time_tracker.record_recovery_time(
                agent_id,
                record.recovery_time_seconds,
            )

        return record

    async def rollback_to_stable(self, agent_id: str) -> RecoveryRecord:
        return await self.trigger_recovery(
            agent_id,
            RecoveryAction.ROLLBACK,
            {"trigger": "manual_rollback"},
        )

    async def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        health = self.health_check_scheduler.get_agent_health(agent_id)
        if not health:
            return None

        recovery_stats = await self.recovery_time_tracker.get_recovery_stats(agent_id)

        return {
            "agent_id": agent_id,
            "is_healthy": health.is_healthy,
            "failure_count": health.failure_count,
            "consecutive_failures": health.consecutive_failures,
            "last_check": health.last_check.isoformat(),
            "last_failure_reason": health.last_failure_reason,
            "last_recovery_at": health.last_recovery_at.isoformat() if health.last_recovery_at else None,
            "current_version": self.version_manager.get_current_version(agent_id),
            "stable_version": self.version_manager.get_stable_version(agent_id),
            "recovery": recovery_stats,
        }

    async def get_recovery_history(
        self,
        agent_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[RecoveryRecord]:
        records = list(self._recovery_history)

        if agent_id:
            records = [r for r in records if r.agent_id == agent_id]

        return sorted(records, key=lambda x: x.started_at, reverse=True)[:limit]

    async def get_all_agent_statuses(self) -> Dict[str, Dict[str, Any]]:
        statuses = {}
        for agent_id in self.health_check_scheduler._agent_health.keys():
            status = await self.get_agent_status(agent_id)
            if status:
                statuses[agent_id] = status

        return statuses


_self_healing_service: Optional[SelfHealingService] = None


def get_self_healing_service() -> SelfHealingService:
    global _self_healing_service
    if _self_healing_service is None:
        _self_healing_service = SelfHealingService()
    return _self_healing_service
