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
    api_url_source: str
    authenticated: bool
    has_access_token: bool
    has_refresh_token: bool

    @property
    def has_api_key(self) -> bool:
        return self.has_access_token


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


@dataclass(slots=True)
class TemplateRecord:
    id: str
    name: str
    summary: str
    description: str
    agent_type: str
    starter_prompt: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "TemplateRecord":
        return cls(
            id=str(payload.get("id", "")),
            name=str(payload.get("name", "")),
            summary=str(payload.get("summary", "")),
            description=str(payload.get("description", "")),
            agent_type=str(payload.get("agent_type", "")),
            starter_prompt=str(payload.get("starter_prompt", "")),
        )


@dataclass(slots=True)
class AssistantSkillRecord:
    id: str
    name: str
    description: str
    author: str
    category: str
    source: str
    installed: bool

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AssistantSkillRecord":
        return cls(
            id=str(payload.get("id", "")),
            name=str(payload.get("name", "")),
            description=str(payload.get("description", "")),
            author=str(payload.get("author", "")),
            category=str(payload.get("category", "")),
            source=str(payload.get("source", "")),
            installed=bool(payload.get("installed", False)),
        )


@dataclass(slots=True)
class AssistantChannelRecord:
    id: str
    label: str
    enabled: bool
    mode: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AssistantChannelRecord":
        return cls(
            id=str(payload.get("id", "")),
            label=str(payload.get("label", "")),
            enabled=bool(payload.get("enabled", False)),
            mode=str(payload.get("mode", "")),
        )


@dataclass(slots=True)
class AssistantHealthRecord:
    status: str
    cli_available: bool
    gateway_configured: bool
    gateway_reachable: bool
    gateway_url: str | None
    doctor_summary: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AssistantHealthRecord":
        return cls(
            status=str(payload.get("status", "unknown")),
            cli_available=bool(payload.get("cli_available", False)),
            gateway_configured=bool(payload.get("gateway_configured", False)),
            gateway_reachable=bool(payload.get("gateway_reachable", False)),
            gateway_url=_as_optional_str(payload.get("gateway_url")),
            doctor_summary=str(payload.get("doctor_summary", "")),
        )


@dataclass(slots=True)
class AssistantOverviewRecord:
    agent_id: str
    name: str
    status: str
    onboarding_status: str
    assistant_id: str
    workspace: str
    session_count: int
    gateway: AssistantHealthRecord
    deployments: list[DeploymentRecord]
    installed_skills: list[AssistantSkillRecord]
    channels: list[AssistantChannelRecord]

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AssistantOverviewRecord":
        return cls(
            agent_id=str(payload.get("agent_id", "")),
            name=str(payload.get("name", "")),
            status=str(payload.get("status", "unknown")),
            onboarding_status=str(payload.get("onboarding_status", "unknown")),
            assistant_id=str(payload.get("assistant_id", "")),
            workspace=str(payload.get("workspace", "")),
            session_count=int(payload.get("session_count", 0)),
            gateway=AssistantHealthRecord.from_payload(payload.get("gateway") or {}),
            deployments=[
                DeploymentRecord.from_payload(item)
                for item in (payload.get("deployments") or [])
                if isinstance(item, dict)
            ],
            installed_skills=[
                AssistantSkillRecord.from_payload(item)
                for item in (payload.get("installed_skills") or [])
                if isinstance(item, dict)
            ],
            channels=[
                AssistantChannelRecord.from_payload(item)
                for item in (payload.get("channels") or [])
                if isinstance(item, dict)
            ],
        )
