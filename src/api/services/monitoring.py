import asyncio
import logging
import psutil
import uuid
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from collections import deque
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


class AgentHealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class SystemMetrics:
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    memory_used_mb: float = 0.0
    memory_total_mb: float = 0.0
    disk_usage: float = 0.0
    network_sent_mb: float = 0.0
    network_recv_mb: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AgentMetrics:
    agent_id: str
    agent_name: str
    status: AgentHealthStatus
    request_count: int = 0
    error_count: int = 0
    success_count: int = 0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    uptime_seconds: float = 0.0
    last_request_at: Optional[datetime] = None
    last_error_at: Optional[datetime] = None
    last_health_check: Optional[datetime] = None
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    restart_count: int = 0
    consecutive_failures: int = 0


@dataclass
class Alert:
    alert_id: str
    agent_id: str
    severity: AlertSeverity
    message: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UptimeRecord:
    agent_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    downtime_seconds: float = 0.0
    uptime_percentage: float = 100.0


class MetricsCollector:
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self._agent_metrics: Dict[str, AgentMetrics] = {}
        self._metrics_history: Dict[str, deque] = {}
        self._latency_buffers: Dict[str, deque] = {}
        self._lock = asyncio.Lock()

    async def record_request(self, agent_id: str, latency_ms: float, success: bool):
        async with self._lock:
            if agent_id not in self._agent_metrics:
                self._agent_metrics[agent_id] = self._create_agent_metrics(agent_id)

            metrics = self._agent_metrics[agent_id]
            metrics.request_count += 1
            metrics.last_request_at = datetime.utcnow()

            if success:
                metrics.success_count += 1
                metrics.consecutive_failures = 0
            else:
                metrics.error_count += 1
                metrics.consecutive_failures += 1
                metrics.last_error_at = datetime.utcnow()

            if agent_id not in self._latency_buffers:
                self._latency_buffers[agent_id] = deque(maxlen=1000)
            self._latency_buffers[agent_id].append(latency_ms)

            self._update_latency_metrics(agent_id)
            await self._save_to_history(agent_id)

    def _create_agent_metrics(self, agent_id: str) -> AgentMetrics:
        return AgentMetrics(
            agent_id=agent_id,
            agent_name=agent_id,
            status=AgentHealthStatus.UNKNOWN,
        )

    def _update_latency_metrics(self, agent_id: str):
        if agent_id not in self._latency_buffers:
            return

        latencies = list(self._latency_buffers[agent_id])
        if not latencies:
            return

        sorted_latencies = sorted(latencies)
        n = len(sorted_latencies)

        metrics = self._agent_metrics[agent_id]
        metrics.avg_latency_ms = sum(sorted_latencies) / n
        metrics.p95_latency_ms = sorted_latencies[int(n * 0.95)] if n > 0 else 0
        metrics.p99_latency_ms = sorted_latencies[int(n * 0.99)] if n > 0 else 0

    async def _save_to_history(self, agent_id: str):
        if agent_id not in self._metrics_history:
            self._metrics_history[agent_id] = deque(maxlen=self.max_history)

        metrics = self._agent_metrics[agent_id]
        self._metrics_history[agent_id].append({
            "timestamp": datetime.utcnow(),
            "request_count": metrics.request_count,
            "error_count": metrics.error_count,
            "success_count": metrics.success_count,
            "avg_latency_ms": metrics.avg_latency_ms,
            "cpu_usage": metrics.cpu_usage,
            "memory_usage": metrics.memory_usage,
        })

    async def get_agent_metrics(self, agent_id: str) -> Optional[AgentMetrics]:
        async with self._lock:
            return self._agent_metrics.get(agent_id)

    async def get_all_metrics(self) -> List[AgentMetrics]:
        async with self._lock:
            return list(self._agent_metrics.values())

    async def get_metrics_history(
        self,
        agent_id: str,
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        async with self._lock:
            history = self._metrics_history.get(agent_id, deque())
            records = list(history)

            if since:
                records = [r for r in records if r["timestamp"] >= since]

            return records[-limit:]


class HealthChecker:
    def __init__(
        self,
        timeout: float = 5.0,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ):
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._health_checks: Dict[str, Callable] = {}
        self._last_check_results: Dict[str, bool] = {}

    def register_health_check(self, agent_id: str, check_fn: Callable):
        self._health_checks[agent_id] = check_fn

    def unregister_health_check(self, agent_id: str):
        self._health_checks.pop(agent_id, None)

    async def check_agent_health(self, agent_id: str) -> AgentHealthStatus:
        check_fn = self._health_checks.get(agent_id)

        if not check_fn:
            return AgentHealthStatus.UNKNOWN

        for attempt in range(self.max_retries):
            try:
                if asyncio.iscoroutinefunction(check_fn):
                    result = await asyncio.wait_for(check_fn(), timeout=self.timeout)
                else:
                    result = check_fn()

                if result:
                    self._last_check_results[agent_id] = True
                    return AgentHealthStatus.HEALTHY

            except asyncio.TimeoutError:
                logger.warning(f"Health check timeout for agent {agent_id}, attempt {attempt + 1}")
            except Exception as e:
                logger.error(f"Health check error for agent {agent_id}: {str(e)}")

            if attempt < self.max_retries - 1:
                await asyncio.sleep(self.retry_delay)

        self._last_check_results[agent_id] = False
        return AgentHealthStatus.UNHEALTHY

    async def check_all_agents(self) -> Dict[str, AgentHealthStatus]:
        results = {}
        for agent_id in list(self._health_checks.keys()):
            results[agent_id] = await self.check_agent_health(agent_id)
        return results

    def get_last_check_result(self, agent_id: str) -> Optional[bool]:
        return self._last_check_results.get(agent_id)


class AlertManager:
    def __init__(self):
        self._alerts: Dict[str, Alert] = {}
        self._active_alerts: Dict[str, Alert] = {}
        self._alert_callbacks: List[Callable] = []
        self._lock = asyncio.Lock()

    def register_alert_callback(self, callback: Callable):
        self._alert_callbacks.append(callback)

    async def create_alert(
        self,
        agent_id: str,
        severity: AlertSeverity,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Alert:
        async with self._lock:
            alert_id = str(uuid.uuid4())
            alert = Alert(
                alert_id=alert_id,
                agent_id=agent_id,
                severity=severity,
                message=message,
                created_at=datetime.utcnow(),
                metadata=metadata or {},
            )

            self._alerts[alert_id] = alert
            self._active_alerts[agent_id] = alert

            for callback in self._alert_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(alert)
                    else:
                        callback(alert)
                except Exception as e:
                    logger.error(f"Alert callback error: {str(e)}")

            logger.warning(f"Alert created: {severity.value} for agent {agent_id}: {message}")
            return alert

    async def resolve_alert(self, agent_id: str, resolution_message: Optional[str] = None):
        async with self._lock:
            alert = self._active_alerts.get(agent_id)
            if alert:
                alert.resolved_at = datetime.utcnow()
                if resolution_message:
                    alert.metadata["resolution"] = resolution_message
                del self._active_alerts[agent_id]
                logger.info(f"Alert resolved for agent {agent_id}")

    async def get_active_alerts(self) -> List[Alert]:
        async with self._lock:
            return list(self._active_alerts.values())

    async def get_alert_history(
        self,
        agent_id: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Alert]:
        async with self._lock:
            alerts = list(self._alerts.values())

            if agent_id:
                alerts = [a for a in alerts if a.agent_id == agent_id]
            if since:
                alerts = [a for a in alerts if a.created_at >= since]

            return sorted(alerts, key=lambda x: x.created_at, reverse=True)[:limit]


class UptimeTracker:
    def __init__(self):
        self._uptime_records: Dict[str, UptimeRecord] = {}
        self._lock = asyncio.Lock()

    async def record_start(self, agent_id: str) -> UptimeRecord:
        async with self._lock:
            if agent_id in self._uptime_records:
                record = self._uptime_records[agent_id]
                if record.end_time is None:
                    record.end_time = datetime.utcnow()
                    record.downtime_seconds = (
                        datetime.utcnow() - record.start_time
                    ).total_seconds()

            record = UptimeRecord(
                agent_id=agent_id,
                start_time=datetime.utcnow(),
            )
            self._uptime_records[agent_id] = record
            logger.info(f"Uptime tracking started for agent {agent_id}")
            return record

    async def record_stop(self, agent_id: str):
        async with self._lock:
            if agent_id in self._uptime_records:
                record = self._uptime_records[agent_id]
                record.end_time = datetime.utcnow()
                logger.info(f"Uptime tracking stopped for agent {agent_id}")

    async def get_uptime_stats(self, agent_id: str) -> Optional[Dict[str, Any]]:
        async with self._lock:
            record = self._uptime_records.get(agent_id)
            if not record:
                return None

            total_time = (datetime.utcnow() - record.start_time).total_seconds()
            uptime_pct = (
                ((total_time - record.downtime_seconds) / total_time * 100)
                if total_time > 0
                else 100.0
            )

            return {
                "agent_id": agent_id,
                "start_time": record.start_time.isoformat(),
                "end_time": record.end_time.isoformat() if record.end_time else None,
                "total_uptime_seconds": total_time,
                "downtime_seconds": record.downtime_seconds,
                "uptime_percentage": round(uptime_pct, 2),
            }


class MonitoringService:
    def __init__(
        self,
        check_interval: int = 30,
        metrics_retention_hours: int = 24,
        cpu_warning_threshold: float = 80.0,
        cpu_critical_threshold: float = 95.0,
        memory_warning_threshold: float = 80.0,
        memory_critical_threshold: float = 95.0,
        latency_warning_threshold_ms: float = 1000.0,
        latency_critical_threshold_ms: float = 5000.0,
        error_rate_warning_threshold: float = 10.0,
        error_rate_critical_threshold: float = 25.0,
    ):
        self.check_interval = check_interval
        self.metrics_retention_hours = metrics_retention_hours

        self.cpu_warning_threshold = cpu_warning_threshold
        self.cpu_critical_threshold = cpu_critical_threshold
        self.memory_warning_threshold = memory_warning_threshold
        self.memory_critical_threshold = memory_critical_threshold
        self.latency_warning_threshold_ms = latency_warning_threshold_ms
        self.latency_critical_threshold_ms = latency_critical_threshold_ms
        self.error_rate_warning_threshold = error_rate_warning_threshold
        self.error_rate_critical_threshold = error_rate_critical_threshold

        self.metrics_collector = MetricsCollector()
        self.health_checker = HealthChecker()
        self.alert_manager = AlertManager()
        self.uptime_tracker = UptimeTracker()

        self._monitoring_task: Optional[asyncio.Task] = None
        self._is_running = False
        self._executor = ThreadPoolExecutor(max_workers=2)

    async def start(self):
        if self._is_running:
            logger.warning("Monitoring service already running")
            return

        self._is_running = True
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Monitoring service started")

    async def stop(self):
        if not self._is_running:
            return

        self._is_running = False
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass

        self._executor.shutdown(wait=False)
        logger.info("Monitoring service stopped")

    async def _monitoring_loop(self):
        while self._is_running:
            try:
                await self._collect_system_metrics()
                await self._check_all_agents()
                await self._check_thresholds()
            except Exception as e:
                logger.error(f"Monitoring loop error: {str(e)}")

            await asyncio.sleep(self.check_interval)

    async def _collect_system_metrics(self) -> SystemMetrics:
        loop = asyncio.get_event_loop()

        def collect():
            cpu = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            net = psutil.net_io_counters()

            return SystemMetrics(
                cpu_usage=cpu,
                memory_usage=mem.percent,
                memory_used_mb=mem.used / (1024 * 1024),
                memory_total_mb=mem.total / (1024 * 1024),
                disk_usage=disk.percent,
                network_sent_mb=net.bytes_sent / (1024 * 1024),
                network_recv_mb=net.bytes_recv / (1024 * 1024),
                timestamp=datetime.utcnow(),
            )

        metrics = await loop.run_in_executor(self._executor, collect)
        return metrics

    async def _check_all_agents(self):
        health_results = await self.health_checker.check_all_agents()

        for agent_id, status in health_results.items():
            if agent_id not in self.metrics_collector._agent_metrics:
                self.metrics_collector._agent_metrics[agent_id] = AgentMetrics(
                    agent_id=agent_id,
                    agent_name=agent_id,
                    status=status,
                )

            metrics = self.metrics_collector._agent_metrics[agent_id]
            metrics.status = status
            metrics.last_health_check = datetime.utcnow()

            if status == AgentHealthStatus.UNHEALTHY:
                await self.alert_manager.create_alert(
                    agent_id=agent_id,
                    severity=AlertSeverity.ERROR,
                    message=f"Agent {agent_id} health check failed",
                    metadata={"status": status.value},
                )

    async def _check_thresholds(self):
        for agent_id, metrics in self.metrics_collector._agent_metrics.items():
            if metrics.request_count == 0:
                continue

            error_rate = (metrics.error_count / metrics.request_count) * 100

            if error_rate >= self.error_rate_critical_threshold:
                await self.alert_manager.create_alert(
                    agent_id=agent_id,
                    severity=AlertSeverity.CRITICAL,
                    message=f"Critical error rate: {error_rate:.1f}%",
                    metadata={"error_rate": error_rate},
                )
            elif error_rate >= self.error_rate_warning_threshold:
                await self.alert_manager.create_alert(
                    agent_id=agent_id,
                    severity=AlertSeverity.WARNING,
                    message=f"High error rate: {error_rate:.1f}%",
                    metadata={"error_rate": error_rate},
                )

            if metrics.avg_latency_ms >= self.latency_critical_threshold_ms:
                await self.alert_manager.create_alert(
                    agent_id=agent_id,
                    severity=AlertSeverity.CRITICAL,
                    message=f"Critical latency: {metrics.avg_latency_ms:.0f}ms",
                    metadata={"latency_ms": metrics.avg_latency_ms},
                )
            elif metrics.avg_latency_ms >= self.latency_warning_threshold_ms:
                await self.alert_manager.create_alert(
                    agent_id=agent_id,
                    severity=AlertSeverity.WARNING,
                    message=f"High latency: {metrics.avg_latency_ms:.0f}ms",
                    metadata={"latency_ms": metrics.avg_latency_ms},
                )

    async def register_agent(
        self,
        agent_id: str,
        agent_name: str,
        health_check_fn: Optional[Callable] = None,
    ):
        await self.uptime_tracker.record_start(agent_id)

        metrics = AgentMetrics(
            agent_id=agent_id,
            agent_name=agent_name,
            status=AgentHealthStatus.UNKNOWN,
            last_health_check=datetime.utcnow(),
        )
        self.metrics_collector._agent_metrics[agent_id] = metrics

        if health_check_fn:
            self.health_checker.register_health_check(agent_id, health_check_fn)

        logger.info(f"Registered agent {agent_id} with monitoring")

    async def unregister_agent(self, agent_id: str):
        await self.uptime_tracker.record_stop(agent_id)
        self.health_checker.unregister_health_check(agent_id)

        if agent_id in self.metrics_collector._agent_metrics:
            del self.metrics_collector._agent_metrics[agent_id]

        logger.info(f"Unregistered agent {agent_id} from monitoring")

    async def record_agent_request(
        self,
        agent_id: str,
        latency_ms: float,
        success: bool,
    ):
        await self.metrics_collector.record_request(agent_id, latency_ms, success)

    async def record_agent_restart(self, agent_id: str):
        if agent_id in self.metrics_collector._agent_metrics:
            self.metrics_collector._agent_metrics[agent_id].restart_count += 1
            self.metrics_collector._agent_metrics[agent_id].consecutive_failures = 0

    async def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        metrics = await self.metrics_collector.get_agent_metrics(agent_id)
        if not metrics:
            return None

        uptime = await self.uptime_tracker.get_uptime_stats(agent_id)

        return {
            "agent_id": agent_id,
            "agent_name": metrics.agent_name,
            "status": metrics.status.value,
            "request_count": metrics.request_count,
            "error_count": metrics.error_count,
            "success_count": metrics.success_count,
            "avg_latency_ms": round(metrics.avg_latency_ms, 2),
            "p95_latency_ms": round(metrics.p95_latency_ms, 2),
            "p99_latency_ms": round(metrics.p99_latency_ms, 2),
            "cpu_usage": round(metrics.cpu_usage, 2),
            "memory_usage": round(metrics.memory_usage, 2),
            "restart_count": metrics.restart_count,
            "consecutive_failures": metrics.consecutive_failures,
            "last_request_at": metrics.last_request_at.isoformat() if metrics.last_request_at else None,
            "last_error_at": metrics.last_error_at.isoformat() if metrics.last_error_at else None,
            "last_health_check": metrics.last_health_check.isoformat() if metrics.last_health_check else None,
            "uptime": uptime,
        }

    async def get_system_status(self) -> Dict[str, Any]:
        system_metrics = await self._collect_system_metrics()
        all_metrics = await self.metrics_collector.get_all_metrics()
        active_alerts = await self.alert_manager.get_active_alerts()

        healthy_count = sum(1 for m in all_metrics if m.status == AgentHealthStatus.HEALTHY)
        degraded_count = sum(1 for m in all_metrics if m.status == AgentHealthStatus.DEGRADED)
        unhealthy_count = sum(1 for m in all_metrics if m.status == AgentHealthStatus.UNHEALTHY)

        return {
            "status": "healthy" if unhealthy_count == 0 else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_usage": round(system_metrics.cpu_usage, 2),
                "memory_usage": round(system_metrics.memory_usage, 2),
                "memory_used_mb": round(system_metrics.memory_used_mb, 2),
                "disk_usage": round(system_metrics.disk_usage, 2),
            },
            "agents": {
                "total": len(all_metrics),
                "healthy": healthy_count,
                "degraded": degraded_count,
                "unhealthy": unhealthy_count,
            },
            "alerts": {
                "active": len(active_alerts),
                "critical": sum(1 for a in active_alerts if a.severity == AlertSeverity.CRITICAL),
                "error": sum(1 for a in active_alerts if a.severity == AlertSeverity.ERROR),
                "warning": sum(1 for a in active_alerts if a.severity == AlertSeverity.WARNING),
            },
        }

    async def get_metrics_history(
        self,
        agent_id: str,
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        return await self.metrics_collector.get_metrics_history(agent_id, since, limit)

    async def get_alerts(
        self,
        agent_id: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Alert]:
        return await self.alert_manager.get_alert_history(agent_id, since, limit)


_monitoring_service: Optional[MonitoringService] = None


def get_monitoring_service() -> MonitoringService:
    global _monitoring_service
    if _monitoring_service is None:
        _monitoring_service = MonitoringService()
    return _monitoring_service
