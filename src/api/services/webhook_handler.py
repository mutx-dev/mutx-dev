import asyncio
import logging
import uuid
import hashlib
import hmac
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class WebhookEventType(str, Enum):
    AGENT_STATUS = "agent.status"
    # Legacy alias retained for backwards compatibility.
    AGENT_STATUS_UPDATE = "agent.status_update"
    AGENT_HEARTBEAT = "agent.heartbeat"
    AGENT_ERROR = "agent.error"
    AGENT_STARTED = "agent.started"
    AGENT_STOPPED = "agent.stopped"
    AGENT_CRASHED = "agent.crashed"
    DEPLOYMENT_CREATED = "deployment.created"
    DEPLOYMENT_UPDATED = "deployment.updated"
    DEPLOYMENT_FAILED = "deployment.failed"
    DEPLOYMENT_ROLLED_BACK = "deployment.rolled_back"
    METRICS_REPORT = "metrics.report"
    HEALTH_CHECK = "health.check"


class WebhookSource(str, Enum):
    AGENT = "agent"
    DEPLOYMENT = "deployment"
    MONITORING = "monitoring"
    EXTERNAL = "external"
    UNKNOWN = "unknown"


@dataclass
class WebhookPayload:
    event_type: WebhookEventType
    source: WebhookSource
    timestamp: datetime
    agent_id: Optional[str] = None
    deployment_id: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProcessedWebhook:
    webhook_id: str
    payload: WebhookPayload
    received_at: datetime
    processed_at: Optional[datetime] = None
    success: bool = True
    error_message: Optional[str] = None
    actions_taken: List[str] = field(default_factory=list)


class WebhookValidator:
    def __init__(self, secret: Optional[str] = None):
        self.secret = secret

    def validate_signature(
        self,
        payload: bytes,
        signature: str,
    ) -> bool:
        if not self.secret:
            logger.warning("No webhook secret configured, skipping signature validation")
            return True

        if not signature:
            return False

        expected_signature = hmac.new(
            self.secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)

    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        required_fields = ["event_type", "source", "timestamp"]
        return all(field in payload for field in required_fields)


class EventProcessor(ABC):
    @abstractmethod
    async def process(self, payload: WebhookPayload) -> ProcessedWebhook:
        pass


class AgentStatusUpdateProcessor(EventProcessor):
    def __init__(
        self,
        monitoring_service=None,
        self_healing_service=None,
    ):
        self.monitoring_service = monitoring_service
        self.self_healing_service = self_healing_service

    async def process(self, payload: WebhookPayload) -> ProcessedWebhook:
        webhook_id = str(uuid.uuid4())
        processed = ProcessedWebhook(
            webhook_id=webhook_id,
            payload=payload,
            received_at=datetime.utcnow(),
        )

        actions_taken = []

        agent_id = payload.agent_id
        if not agent_id:
            processed.success = False
            processed.error_message = "No agent_id in payload"
            return processed

        status = payload.data.get("status")
        error_message = payload.data.get("error_message")

        if self.monitoring_service:
            if status == "healthy":
                await self.monitoring_service.record_agent_request(
                    agent_id,
                    latency_ms=payload.data.get("latency_ms", 0),
                    success=True,
                )
                actions_taken.append("metrics_recorded")
            elif status == "unhealthy" or error_message:
                await self.monitoring_service.record_agent_request(
                    agent_id,
                    latency_ms=payload.data.get("latency_ms", 0),
                    success=False,
                )
                actions_taken.append("failure_recorded")

        if self.self_healing_service:
            health = self.self_healing_service.health_check_scheduler.get_agent_health(agent_id)
            if health and health.consecutive_failures > 0:
                await self.self_healing_service.check_and_recover(agent_id)
                actions_taken.append("recovery_checked")

        processed.processed_at = datetime.utcnow()
        processed.actions_taken = actions_taken

        logger.info(f"Processed agent status update for {agent_id}: {status}")
        return processed


class DeploymentEventProcessor(EventProcessor):
    def __init__(self, monitoring_service=None, self_healing_service=None):
        self.monitoring_service = monitoring_service
        self.self_healing_service = self_healing_service

    async def process(self, payload: WebhookPayload) -> ProcessedWebhook:
        webhook_id = str(uuid.uuid4())
        processed = ProcessedWebhook(
            webhook_id=webhook_id,
            payload=payload,
            received_at=datetime.utcnow(),
        )

        actions_taken = []

        deployment_id = payload.deployment_id
        agent_id = payload.agent_id

        event = payload.data.get("event")
        status = payload.data.get("status")

        if self.monitoring_service and agent_id:
            if event == "failed" or status == "failed":
                await self.monitoring_service.record_agent_request(
                    agent_id,
                    latency_ms=0,
                    success=False,
                )
                actions_taken.append("failure_recorded")

                if self.self_healing_service:
                    await self.self_healing_service.check_and_recover(agent_id)
                    actions_taken.append("recovery_triggered")

            elif event == "deployed" or status == "running":
                if self.self_healing_service:
                    self.self_healing_service.version_manager.mark_stable_version(
                        agent_id,
                        payload.data.get("version"),
                    )
                actions_taken.append("version_recorded")

        processed.processed_at = datetime.utcnow()
        processed.actions_taken = actions_taken

        logger.info(f"Processed deployment event: {event} for {deployment_id}")
        return processed


class MetricsReportProcessor(EventProcessor):
    def __init__(self, monitoring_service=None):
        self.monitoring_service = monitoring_service

    async def process(self, payload: WebhookPayload) -> ProcessedWebhook:
        webhook_id = str(uuid.uuid4())
        processed = ProcessedWebhook(
            webhook_id=webhook_id,
            payload=payload,
            received_at=datetime.utcnow(),
        )

        actions_taken = []

        agent_id = payload.agent_id
        if not agent_id or not self.monitoring_service:
            processed.success = False
            processed.error_message = "No agent_id or monitoring service not available"
            return processed

        metrics = payload.data
        latency_ms = metrics.get("latency_ms", 0)
        success = metrics.get("success", True)

        await self.monitoring_service.record_agent_request(
            agent_id,
            latency_ms=latency_ms,
            success=success,
        )

        actions_taken.append("metrics_recorded")

        processed.processed_at = datetime.utcnow()
        processed.actions_taken = actions_taken

        return processed


class HeartbeatProcessor(EventProcessor):
    def __init__(self, monitoring_service=None):
        self.monitoring_service = monitoring_service

    async def process(self, payload: WebhookPayload) -> ProcessedWebhook:
        webhook_id = str(uuid.uuid4())
        processed = ProcessedWebhook(
            webhook_id=webhook_id,
            payload=payload,
            received_at=datetime.utcnow(),
        )

        agent_id = payload.agent_id

        if not agent_id or not self.monitoring_service:
            processed.success = False
            processed.error_message = "No agent_id or monitoring service not available"
            return processed

        metrics = await self.monitoring_service.get_agent_status(agent_id)
        if metrics:
            processed.actions_taken.append("heartbeat_received")
        else:
            await self.monitoring_service.register_agent(
                agent_id=agent_id,
                agent_name=payload.data.get("agent_name", agent_id),
            )
            processed.actions_taken.append("agent_registered")

        processed.processed_at = datetime.utcnow()

        return processed


class WebhookHandler:
    def __init__(
        self,
        webhook_secret: Optional[str] = None,
        monitoring_service=None,
        self_healing_service=None,
    ):
        self.validator = WebhookValidator(webhook_secret)

        self.monitoring_service = monitoring_service
        self.self_healing_service = self_healing_service

        agent_status_processor = AgentStatusUpdateProcessor(
            monitoring_service,
            self_healing_service,
        )

        self._processors: Dict[WebhookEventType, EventProcessor] = {
            WebhookEventType.AGENT_STATUS: agent_status_processor,
            WebhookEventType.AGENT_STATUS_UPDATE: agent_status_processor,
            WebhookEventType.AGENT_HEARTBEAT: HeartbeatProcessor(monitoring_service),
            WebhookEventType.METRICS_REPORT: MetricsReportProcessor(monitoring_service),
            WebhookEventType.DEPLOYMENT_CREATED: DeploymentEventProcessor(
                monitoring_service,
                self_healing_service,
            ),
            WebhookEventType.DEPLOYMENT_UPDATED: DeploymentEventProcessor(
                monitoring_service,
                self_healing_service,
            ),
            WebhookEventType.DEPLOYMENT_FAILED: DeploymentEventProcessor(
                monitoring_service,
                self_healing_service,
            ),
            WebhookEventType.DEPLOYMENT_ROLLED_BACK: DeploymentEventProcessor(
                monitoring_service,
                self_healing_service,
            ),
        }

        self._webhook_history: List[ProcessedWebhook] = []
        self._event_callbacks: Dict[WebhookEventType, List[Callable]] = {}

    def register_processor(self, event_type: WebhookEventType, processor: EventProcessor):
        self._processors[event_type] = processor
        logger.info(f"Registered processor for {event_type.value}")

    def on_event(self, event_type: WebhookEventType, callback: Callable):
        if event_type not in self._event_callbacks:
            self._event_callbacks[event_type] = []
        self._event_callbacks[event_type].append(callback)

    async def handle_webhook(
        self,
        payload: Dict[str, Any],
        signature: Optional[str] = None,
    ) -> ProcessedWebhook:
        webhook_id = str(uuid.uuid4())
        received_at = datetime.utcnow()

        try:
            payload_bytes = str(payload).encode()
            if not self.validator.validate_signature(payload_bytes, signature or ""):
                logger.warning(f"Invalid webhook signature for webhook {webhook_id}")
                return ProcessedWebhook(
                    webhook_id=webhook_id,
                    payload=WebhookPayload(
                        event_type=WebhookEventType.AGENT_STATUS,
                        source=WebhookSource.UNKNOWN,
                        timestamp=received_at,
                    ),
                    received_at=received_at,
                    success=False,
                    error_message="Invalid signature",
                )

            if not self.validator.validate_payload(payload):
                return ProcessedWebhook(
                    webhook_id=webhook_id,
                    payload=WebhookPayload(
                        event_type=WebhookEventType.AGENT_STATUS,
                        source=WebhookSource.UNKNOWN,
                        timestamp=received_at,
                    ),
                    received_at=received_at,
                    success=False,
                    error_message="Invalid payload format",
                )

            webhook_payload = WebhookPayload(
                event_type=WebhookEventType(payload["event_type"]),
                source=WebhookSource(payload["source"]),
                timestamp=datetime.fromisoformat(payload["timestamp"]),
                agent_id=payload.get("agent_id"),
                deployment_id=payload.get("deployment_id"),
                data=payload.get("data", {}),
                metadata=payload.get("metadata", {}),
            )

            processor = self._processors.get(webhook_payload.event_type)
            if not processor:
                logger.warning(f"No processor for event type {webhook_payload.event_type}")
                return ProcessedWebhook(
                    webhook_id=webhook_id,
                    payload=webhook_payload,
                    received_at=received_at,
                    success=False,
                    error_message=f"No processor for event type {webhook_payload.event_type.value}",
                )

            processed = await processor.process(webhook_payload)

            await self._trigger_callbacks(webhook_payload)

            self._webhook_history.append(processed)
            if len(self._webhook_history) > 1000:
                self._webhook_history = self._webhook_history[-1000:]

            return processed

        except Exception as e:
            logger.error(f"Error processing webhook {webhook_id}: {str(e)}")
            return ProcessedWebhook(
                webhook_id=webhook_id,
                payload=WebhookPayload(
                    event_type=WebhookEventType.AGENT_STATUS,
                    source=WebhookSource.UNKNOWN,
                    timestamp=received_at,
                ),
                received_at=received_at,
                success=False,
                error_message=str(e),
            )

    async def _trigger_callbacks(self, payload: WebhookPayload):
        callbacks = self._event_callbacks.get(payload.event_type, [])
        for callback in callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(payload)
                else:
                    callback(payload)
            except Exception as e:
                logger.error(f"Webhook callback error: {str(e)}")

    async def get_webhook_history(
        self,
        agent_id: Optional[str] = None,
        event_type: Optional[WebhookEventType] = None,
        limit: int = 50,
    ) -> List[ProcessedWebhook]:
        history = self._webhook_history

        if agent_id:
            history = [h for h in history if h.payload.agent_id == agent_id]

        if event_type:
            history = [h for h in history if h.payload.event_type == event_type]

        return history[-limit:]


def create_status_update_payload(
    agent_id: str,
    status: str,
    error_message: Optional[str] = None,
    latency_ms: Optional[float] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.AGENT_STATUS.value,
        "source": WebhookSource.AGENT.value,
        "timestamp": datetime.utcnow().isoformat(),
        "agent_id": agent_id,
        "data": {
            "status": status,
            "error_message": error_message,
            "latency_ms": latency_ms,
        },
        "metadata": metadata or {},
    }


def create_heartbeat_payload(
    agent_id: str,
    agent_name: str,
    status: str = "healthy",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.AGENT_HEARTBEAT.value,
        "source": WebhookSource.AGENT.value,
        "timestamp": datetime.utcnow().isoformat(),
        "agent_id": agent_id,
        "data": {
            "agent_name": agent_name,
            "status": status,
        },
        "metadata": metadata or {},
    }


def create_metrics_payload(
    agent_id: str,
    latency_ms: float,
    success: bool,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.METRICS_REPORT.value,
        "source": WebhookSource.AGENT.value,
        "timestamp": datetime.utcnow().isoformat(),
        "agent_id": agent_id,
        "data": {
            "latency_ms": latency_ms,
            "success": success,
        },
        "metadata": metadata or {},
    }


def create_deployment_event_payload(
    deployment_id: str,
    agent_id: str,
    event: str,
    status: Optional[str] = None,
    version: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.DEPLOYMENT_UPDATED.value,
        "source": WebhookSource.DEPLOYMENT.value,
        "timestamp": datetime.utcnow().isoformat(),
        "deployment_id": deployment_id,
        "agent_id": agent_id,
        "data": {
            "event": event,
            "status": status,
            "version": version,
        },
        "metadata": metadata or {},
    }


_webhook_handler: Optional[WebhookHandler] = None


def get_webhook_handler(
    webhook_secret: Optional[str] = None,
    monitoring_service=None,
    self_healing_service=None,
) -> WebhookHandler:
    global _webhook_handler
    if _webhook_handler is None:
        _webhook_handler = WebhookHandler(
            webhook_secret=webhook_secret,
            monitoring_service=monitoring_service,
            self_healing_service=self_healing_service,
        )
    return _webhook_handler
