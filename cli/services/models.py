from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def _as_optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


@dataclass(slots=True)
class CLIStatus:
    api_url: str
    config_path: Path
    authenticated: bool
    has_api_key: bool
    has_refresh_token: bool


@dataclass(slots=True)
class UserProfile:
    email: str
    name: str
    plan: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "UserProfile":
        return cls(
            email=str(payload.get("email", "")),
            name=str(payload.get("name", "")),
            plan=str(payload.get("plan", "")),
        )


@dataclass(slots=True)
class DeploymentEventRecord:
    id: str
    deployment_id: str
    event_type: str
    status: str
    node_id: str | None
    error_message: str | None
    created_at: str | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "DeploymentEventRecord":
        return cls(
            id=str(payload.get("id", "")),
            deployment_id=str(payload.get("deployment_id", "")),
            event_type=str(payload.get("event_type", "unknown")),
            status=str(payload.get("status", "unknown")),
            node_id=_as_optional_str(payload.get("node_id")),
            error_message=_as_optional_str(payload.get("error_message")),
            created_at=_as_optional_str(payload.get("created_at")),
        )


@dataclass(slots=True)
class LogEntry:
    id: str
    agent_id: str
    level: str
    message: str
    extra_data: str | None
    timestamp: str | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "LogEntry":
        return cls(
            id=str(payload.get("id", "")),
            agent_id=str(payload.get("agent_id", "")),
            level=str(payload.get("level", "unknown")),
            message=str(payload.get("message", "")),
            extra_data=_as_optional_str(payload.get("extra_data")),
            timestamp=_as_optional_str(payload.get("timestamp")),
        )


@dataclass(slots=True)
class MetricPoint:
    id: str
    agent_id: str
    cpu_usage: float | None
    memory_usage: float | None
    timestamp: str | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "MetricPoint":
        cpu_usage = payload.get("cpu_usage")
        memory_usage = payload.get("memory_usage")
        return cls(
            id=str(payload.get("id", "")),
            agent_id=str(payload.get("agent_id", "")),
            cpu_usage=float(cpu_usage) if isinstance(cpu_usage, (int, float)) else None,
            memory_usage=float(memory_usage) if isinstance(memory_usage, (int, float)) else None,
            timestamp=_as_optional_str(payload.get("timestamp")),
        )


@dataclass(slots=True)
class DeploymentRecord:
    id: str
    agent_id: str
    status: str
    version: str | None
    replicas: int
    node_id: str | None
    started_at: str | None
    ended_at: str | None
    error_message: str | None
    events: list[DeploymentEventRecord] = field(default_factory=list)

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "DeploymentRecord":
        raw_events = payload.get("events") or []
        return cls(
            id=str(payload.get("id", "")),
            agent_id=str(payload.get("agent_id", "")),
            status=str(payload.get("status", "unknown")),
            version=_as_optional_str(payload.get("version")),
            replicas=int(payload.get("replicas", 1)),
            node_id=_as_optional_str(payload.get("node_id")),
            started_at=_as_optional_str(payload.get("started_at")),
            ended_at=_as_optional_str(payload.get("ended_at")),
            error_message=_as_optional_str(payload.get("error_message")),
            events=[
                DeploymentEventRecord.from_payload(item)
                for item in raw_events
                if isinstance(item, dict)
            ],
        )


@dataclass(slots=True)
class DeploymentEventHistory:
    deployment_id: str
    deployment_status: str
    items: list[DeploymentEventRecord]
    total: int
    skip: int
    limit: int
    event_type: str | None
    status_filter: str | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "DeploymentEventHistory":
        raw_items = payload.get("items") or []
        return cls(
            deployment_id=str(payload.get("deployment_id", "")),
            deployment_status=str(payload.get("deployment_status", "unknown")),
            items=[
                DeploymentEventRecord.from_payload(item)
                for item in raw_items
                if isinstance(item, dict)
            ],
            total=int(payload.get("total", 0)),
            skip=int(payload.get("skip", 0)),
            limit=int(payload.get("limit", 0)),
            event_type=_as_optional_str(payload.get("event_type")),
            status_filter=_as_optional_str(payload.get("status")),
        )


@dataclass(slots=True)
class AgentRecord:
    id: str
    name: str
    description: str | None
    type: str
    status: str
    config: dict[str, Any] | str | None
    config_version: int
    created_at: str | None
    updated_at: str | None
    user_id: str | None
    deployments: list[DeploymentRecord] = field(default_factory=list)

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AgentRecord":
        raw_deployments = payload.get("deployments") or []
        return cls(
            id=str(payload.get("id", "")),
            name=str(payload.get("name", "")),
            description=_as_optional_str(payload.get("description")),
            type=str(payload.get("type", "")),
            status=str(payload.get("status", "unknown")),
            config=payload.get("config"),
            config_version=int(payload.get("config_version", 1)),
            created_at=_as_optional_str(payload.get("created_at")),
            updated_at=_as_optional_str(payload.get("updated_at")),
            user_id=_as_optional_str(payload.get("user_id")),
            deployments=[
                DeploymentRecord.from_payload(item)
                for item in raw_deployments
                if isinstance(item, dict)
            ],
        )


@dataclass(slots=True)
class AgentDeploymentResult:
    deployment_id: str | None
    status: str | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AgentDeploymentResult":
        return cls(
            deployment_id=_as_optional_str(payload.get("deployment_id")),
            status=_as_optional_str(payload.get("status")),
        )
