from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, computed_field
import uuid

from src.api.models.models import AgentStatus, AgentType


class AgentConfigBase(BaseModel):
    """Base schema for specialized agent configurations"""

    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    system_prompt: Optional[str] = Field(default=None, max_length=16000)
    version: int = Field(default=1, ge=1)


class OpenAIAgentConfig(AgentConfigBase):
    model: str = Field(default="gpt-4o", min_length=1, max_length=255)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, gt=0)


class AnthropicAgentConfig(AgentConfigBase):
    model: str = Field(default="claude-3-5-sonnet-20240620", min_length=1, max_length=255)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(default=4096, gt=0)


class LangChainAgentConfig(AgentConfigBase):
    chain_id: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class CustomAgentConfig(AgentConfigBase):
    image: str
    command: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)


class OpenClawChannelConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(..., min_length=1, max_length=120)
    enabled: bool = False
    mode: str = Field(default="pairing", min_length=1, max_length=64)
    allow_from: list[str] = Field(default_factory=list)


class OpenClawWakeupConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool = False
    schedule: Optional[str] = Field(default=None, max_length=255)
    timezone: Optional[str] = Field(default=None, max_length=120)
    label: Optional[str] = Field(default=None, max_length=120)


class OpenClawGatewayConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    port: int = Field(default=18789, ge=1, le=65535)
    auth_mode: str = Field(default="token", min_length=1, max_length=64)
    dashboard_allowed_origins: list[str] = Field(default_factory=list)


class OpenClawAgentConfig(AgentConfigBase):
    runtime: str = Field(default="personal_assistant", min_length=1, max_length=120)
    template: str = Field(default="personal_assistant", min_length=1, max_length=120)
    assistant_id: Optional[str] = Field(default=None, min_length=1, max_length=255)
    workspace: str = Field(default="default", min_length=1, max_length=255)
    model: str = Field(default="openai/gpt-5", min_length=1, max_length=255)
    safety_mode: str = Field(default="pairing", min_length=1, max_length=64)
    channels: dict[str, OpenClawChannelConfig] = Field(default_factory=dict)
    skills: list[str] = Field(default_factory=list)
    wakeups: list[OpenClawWakeupConfig] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    gateway: OpenClawGatewayConfig = Field(default_factory=OpenClawGatewayConfig)


AgentConfigSchema = (
    OpenAIAgentConfig
    | AnthropicAgentConfig
    | LangChainAgentConfig
    | CustomAgentConfig
    | OpenClawAgentConfig
)


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    type: AgentType = Field(default=AgentType.OPENAI)
    config: Optional[dict[str, Any] | str] = None
    # user_id is set from current_user in the route, not from request body


class AgentConfigUpdateRequest(BaseModel):
    config: dict[str, Any] | str = Field(
        ...,
        description="Updated agent configuration payload. Can be a JSON object or JSON string.",
    )


class DeploymentCreate(BaseModel):
    """Request model for creating a deployment"""

    agent_id: uuid.UUID
    replicas: int = Field(default=1, ge=1, le=10, description="Number of replicas (1-10)")


class DeploymentEventResponse(BaseModel):
    """Response model for deployment events"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    deployment_id: uuid.UUID
    event_type: str
    status: str
    node_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime


class DeploymentEventHistoryResponse(BaseModel):
    """Paginated deployment lifecycle event history."""

    deployment_id: uuid.UUID
    deployment_status: str
    items: list[DeploymentEventResponse] = Field(default_factory=list)
    total: int
    skip: int
    limit: int
    event_type: Optional[str] = None
    status: Optional[str] = None


class DeploymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    status: str
    version: Optional[str] = None
    replicas: int
    node_id: Optional[str]
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime]
    error_message: Optional[str]
    events: list[DeploymentEventResponse] = Field(default_factory=list)


class DeploymentScale(BaseModel):
    replicas: int


class DeploymentLogsResponse(BaseModel):
    """Response model for deployment logs"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    level: str
    message: str
    extra_data: Optional[str]
    timestamp: datetime


class DeploymentMetricsResponse(BaseModel):
    """Response model for deployment metrics"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    cpu_usage: Optional[float]
    memory_usage: Optional[float]
    timestamp: datetime


class DeploymentVersionResponse(BaseModel):
    """Response model for deployment version"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    deployment_id: uuid.UUID
    version: int
    config_snapshot: str
    status: str
    created_at: datetime
    rolled_back_at: Optional[datetime] = None


class DeploymentVersionHistoryResponse(BaseModel):
    """Response model for deployment version history"""

    deployment_id: uuid.UUID
    items: list[DeploymentVersionResponse]
    total: int


class DeploymentRollbackRequest(BaseModel):
    """Request model for rolling back a deployment"""

    version: int = Field(..., gt=0, description="Version number to rollback to")


class AgentVersionResponse(BaseModel):
    """Response model for agent version"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    version: int
    config_snapshot: str
    status: str
    created_at: datetime
    rolled_back_at: Optional[datetime] = None


class AgentVersionHistoryResponse(BaseModel):
    """Response model for agent version history"""

    agent_id: uuid.UUID
    items: list[AgentVersionResponse]
    total: int


class AgentRollbackRequest(BaseModel):
    """Request model for rolling back an agent"""

    version: int = Field(..., gt=0, description="Version number to rollback to")


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str]
    type: AgentType
    status: str
    config: Optional[AgentConfigSchema | dict[str, Any]]
    config_version: int = Field(default=1, ge=1)
    created_at: datetime
    updated_at: datetime
    user_id: uuid.UUID


class AgentDetailResponse(AgentResponse):
    deployments: list[DeploymentResponse] = Field(default_factory=list)


class AgentConfigResponse(BaseModel):
    agent_id: uuid.UUID
    type: AgentType
    config: AgentConfigSchema | dict[str, Any]
    config_version: int = Field(..., ge=1)
    updated_at: datetime


class AgentLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    level: str
    message: str
    extra_data: Optional[str]
    timestamp: datetime


class AgentMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    cpu_usage: Optional[float]
    memory_usage: Optional[float]
    timestamp: datetime


class AgentResourceUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    prompt_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0
    total_tokens: Optional[int] = 0
    api_calls: int = 0
    cost_usd: Optional[float] = 0.0
    model: Optional[str] = None
    extra_metadata: Optional[dict] = None
    period_start: datetime
    period_end: Optional[datetime] = None
    created_at: datetime


class AgentResourceUsageCreate(BaseModel):
    """Request schema for creating agent resource usage record."""

    prompt_tokens: Optional[int] = Field(default=0, ge=0)
    completion_tokens: Optional[int] = Field(default=0, ge=0)
    total_tokens: Optional[int] = Field(default=0, ge=0)
    api_calls: int = Field(default=0, ge=0)
    cost_usd: Optional[float] = Field(default=0.0, ge=0.0)
    model: Optional[str] = Field(default=None, max_length=100)
    extra_metadata: Optional[dict[str, Any]] = Field(default_factory=dict)
    period_start: datetime
    period_end: Optional[datetime] = None


class RunTraceCreate(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=100)
    message: Optional[str] = Field(None, max_length=5000)
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[datetime] = None


class RunCreate(BaseModel):
    agent_id: uuid.UUID
    status: str = Field(default="completed", min_length=1, max_length=50)
    input_text: Optional[str] = None
    output_text: Optional[str] = None
    error_message: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    traces: list[RunTraceCreate] = Field(default_factory=list)


class RunTraceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_id: uuid.UUID
    event_type: str
    message: Optional[str]
    payload: dict[str, Any]
    sequence: int
    timestamp: datetime


class RunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    status: str
    input_text: Optional[str]
    output_text: Optional[str]
    error_message: Optional[str]
    metadata: dict
    started_at: datetime
    completed_at: Optional[datetime]
    created_at: datetime
    trace_count: int = 0


class RunDetailResponse(RunResponse):
    traces: list[RunTraceResponse] = Field(default_factory=list)


class RunHistoryResponse(BaseModel):
    items: list[RunResponse] = Field(default_factory=list)
    total: int
    skip: int
    limit: int
    agent_id: Optional[uuid.UUID] = None
    status: Optional[str] = None


class RunTraceHistoryResponse(BaseModel):
    run_id: uuid.UUID
    items: list[RunTraceResponse] = Field(default_factory=list)
    total: int
    skip: int
    limit: int
    event_type: Optional[str] = None


class AgentStatusUpdate(BaseModel):
    agent_id: uuid.UUID
    status: AgentStatus
    node_id: Optional[str] = None
    error_message: Optional[str] = None


class DeploymentEvent(BaseModel):
    deployment_id: uuid.UUID
    event: str
    status: Optional[str] = None
    node_id: Optional[str] = None
    error_message: Optional[str] = None


class MetricsReportRequest(BaseModel):
    """Request model for reporting agent metrics"""

    agent_id: uuid.UUID
    cpu_usage: float = Field(..., ge=0.0, le=100.0, description="CPU usage percentage (0-100)")
    memory_usage: float = Field(
        ..., ge=0.0, le=100.0, description="Memory usage percentage (0-100)"
    )


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: str
    timestamp: datetime
    database: Optional[str] = None
    error: Optional[str] = None
    version: str = "1.0.0"
    uptime_seconds: Optional[float] = None
    components: dict[str, dict[str, Any]] = Field(default_factory=dict)
    schema_repairs_applied: list[str] = Field(default_factory=list)


class AssistantTemplateResponse(BaseModel):
    id: str
    name: str
    summary: str
    description: str
    agent_type: AgentType
    starter_prompt: str
    default_config: OpenClawAgentConfig | dict[str, Any]


class StarterDeploymentCreate(BaseModel):
    name: str = Field(default="Personal Assistant", min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    replicas: int = Field(default=1, ge=1, le=10)
    model: Optional[str] = Field(default=None, min_length=1, max_length=255)
    assistant_id: Optional[str] = Field(default=None, min_length=1, max_length=255)
    workspace: Optional[str] = Field(default=None, min_length=1, max_length=255)
    skills: list[str] = Field(default_factory=list)
    channels: dict[str, OpenClawChannelConfig] = Field(default_factory=dict)
    runtime_metadata: dict[str, Any] = Field(default_factory=dict)


class StarterDeploymentResponse(BaseModel):
    template_id: str
    agent: AgentResponse
    deployment: DeploymentResponse


class AssistantSkillResponse(BaseModel):
    id: str
    name: str
    description: str
    author: str
    category: str
    source: str
    is_official: bool = False
    installed: bool = False
    tags: list[str] = Field(default_factory=list)
    path: Optional[str] = None


class AssistantChannelResponse(BaseModel):
    id: str
    label: str
    enabled: bool
    mode: str
    allow_from: list[str] = Field(default_factory=list)


class AssistantWakeupResponse(BaseModel):
    enabled: bool
    schedule: Optional[str] = None
    timezone: Optional[str] = None
    label: Optional[str] = None


class AssistantHealthResponse(BaseModel):
    status: str
    cli_available: bool
    gateway_configured: bool
    gateway_reachable: bool
    gateway_port: Optional[int] = None
    gateway_url: Optional[str] = None
    credential_detected: bool = False
    config_path: Optional[str] = None
    state_dir: Optional[str] = None
    doctor_summary: str


class AssistantSessionResponse(BaseModel):
    id: str
    key: str
    agent: str
    kind: str
    age: str
    model: str
    tokens: str
    channel: str
    flags: list[str] = Field(default_factory=list)
    active: bool
    start_time: int
    last_activity: int
    source: str


class AssistantOverviewResponse(BaseModel):
    agent_id: uuid.UUID
    name: str
    description: Optional[str] = None
    runtime: str
    template_id: str
    status: str
    onboarding_status: str
    assistant_id: str
    workspace: str
    last_activity: Optional[datetime] = None
    session_count: int = 0
    installed_skills: list[AssistantSkillResponse] = Field(default_factory=list)
    channels: list[AssistantChannelResponse] = Field(default_factory=list)
    wakeups: list[AssistantWakeupResponse] = Field(default_factory=list)
    gateway: AssistantHealthResponse
    deployments: list[DeploymentResponse] = Field(default_factory=list)
    config: OpenClawAgentConfig | dict[str, Any]


class AssistantOverviewEnvelope(BaseModel):
    has_assistant: bool
    recommended_template_id: str = "personal_assistant"
    assistant: Optional[AssistantOverviewResponse] = None


class ProviderOptionResponse(BaseModel):
    id: str
    label: str
    summary: str
    enabled: bool = False
    cue: str | None = None


class OnboardingStepResponse(BaseModel):
    id: str
    title: str
    completed: bool = False


class OnboardingStateResponse(BaseModel):
    provider: str = "openclaw"
    status: str
    action_type: str | None = None
    import_source: dict[str, Any] = Field(default_factory=dict)
    current_step: str
    completed_steps: list[str] = Field(default_factory=list)
    failed_step: str | None = None
    last_error: str | None = None
    checklist_dismissed: bool = False
    assistant_name: str | None = None
    assistant_id: str | None = None
    workspace: str | None = None
    gateway_url: str | None = None
    updated_at: datetime | None = None
    steps: list[OnboardingStepResponse] = Field(default_factory=list)
    providers: list[ProviderOptionResponse] = Field(default_factory=list)


class OnboardingUpdateRequest(BaseModel):
    action: str = Field(..., min_length=1, max_length=64)
    provider: str = Field(default="openclaw", min_length=1, max_length=64)
    step: str | None = Field(default=None, max_length=64)
    payload: dict[str, Any] = Field(default_factory=dict)


class PicoRecentEventResponse(BaseModel):
    event: str
    xp_awarded: int = Field(default=0, ge=0)
    lesson_id: str | None = None
    track_id: str | None = None
    badge_id: str | None = None
    milestone_id: str | None = None
    tutor_sessions: int = Field(default=0, ge=0)
    created_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class PicoStateResponse(BaseModel):
    plan: str
    xp_total: int = Field(default=0, ge=0)
    current_level: int = Field(default=1, ge=1)
    completed_lessons: list[str] = Field(default_factory=list)
    completed_tracks: list[str] = Field(default_factory=list)
    badges: list[str] = Field(default_factory=list)
    milestones: list[str] = Field(default_factory=list)
    event_counts: dict[str, int] = Field(default_factory=dict)
    recent_events: list[PicoRecentEventResponse] = Field(default_factory=list)
    tutor_sessions_used: int = Field(default=0, ge=0)
    updated_at: datetime | None = None


class PicoEventRequest(BaseModel):
    event: str = Field(..., min_length=1, max_length=64)
    lesson_id: str | None = Field(
        default=None,
        max_length=120,
        validation_alias=AliasChoices("lesson_id", "lesson", "lesson_slug", "lessonSlug"),
    )
    track_id: str | None = Field(
        default=None,
        max_length=120,
        validation_alias=AliasChoices("track_id", "track", "track_slug", "trackSlug"),
    )
    badge_id: str | None = Field(
        default=None,
        max_length=120,
        validation_alias=AliasChoices("badge_id", "badge"),
    )
    milestone_id: str | None = Field(
        default=None,
        max_length=120,
        validation_alias=AliasChoices("milestone_id", "milestone"),
    )
    tutor_sessions: int = Field(
        default=0,
        ge=0,
        le=100,
        validation_alias=AliasChoices("tutor_sessions", "sessions", "count"),
    )
    xp: int | None = Field(default=None, ge=0, le=10000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class RuntimeProviderSnapshotUpsert(BaseModel):
    provider: str = Field(default="openclaw", min_length=1, max_length=64)
    runtime_key: str = Field(default="openclaw", min_length=1, max_length=64)
    label: str = Field(default="OpenClaw", min_length=1, max_length=120)
    cue: str | None = Field(default=None, max_length=8)
    provider_root: str | None = None
    wizard_state_path: str | None = None
    binary_path: str | None = None
    binary_confirmed: bool = False
    home_path: str | None = None
    home_source: str | None = Field(default=None, max_length=64)
    config_path: str | None = None
    state_dir: str | None = None
    install_method: str | None = Field(default=None, max_length=32)
    installation_disposition: str | None = Field(default=None, max_length=64)
    tracking_mode: str | None = Field(default=None, max_length=64)
    imported_into_mutx: bool = False
    adopted_existing_runtime: bool = False
    keys_remain_local: bool = False
    credential_sync_policy: str | None = Field(default=None, max_length=64)
    privacy_summary: str | None = Field(default=None, max_length=1000)
    last_action_type: str | None = Field(default=None, max_length=64)
    import_source: dict[str, Any] = Field(default_factory=dict)
    version: str | None = Field(default=None, max_length=255)
    status: str = Field(default="unknown", max_length=64)
    gateway: dict[str, Any] = Field(default_factory=dict)
    gateway_url: str | None = None
    gateway_port: int | None = None
    last_seen_at: datetime | None = None
    last_synced_at: datetime | None = None
    binding_count: int = Field(default=0, ge=0)
    current_binding: dict[str, Any] | None = None
    bindings: list[dict[str, Any]] = Field(default_factory=list)
    observed_source: str = Field(default="local", max_length=64)


class RuntimeProviderSnapshotResponse(RuntimeProviderSnapshotUpsert):
    stale: bool = False
    stale_after_seconds: int = 900


# API Key Schemas
class APIKeyCreate(BaseModel):
    name: str
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)


class APIKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    last_used: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool


class APIKeyCreateResponse(BaseModel):
    """Response containing the newly created API key - only shown once!"""

    id: uuid.UUID
    name: str
    key: str  # The plain API key - only returned on creation
    created_at: datetime
    expires_at: Optional[datetime]


# Webhook Schemas
class WebhookCreate(BaseModel):
    """Request model for creating a webhook"""

    url: str = Field(
        ..., max_length=512, min_length=1, description="The URL to receive webhook events"
    )
    events: list[str] = Field(
        default_factory=lambda: ["*"],
        description="List of events to subscribe to (e.g., 'agent.status', 'deployment.*', '*' for all)",
    )
    secret: Optional[str] = Field(
        None, max_length=64, description="Optional secret for signature verification"
    )
    is_active: bool = Field(True, description="Whether the webhook should be active immediately")


class WebhookUpdate(BaseModel):
    url: Optional[str] = Field(None, max_length=512)
    events: Optional[list[str]] = None
    is_active: Optional[bool] = None


class WebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    url: str
    events: list[str]
    secret: Optional[str] = Field(
        default=None,
        description="Always null. Webhook secrets are write-only and never returned after creation.",
    )
    has_secret: bool = False
    is_active: bool
    created_at: datetime


class WebhookDelivery(BaseModel):
    """Schema for webhook delivery attempts"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    webhook_id: uuid.UUID
    event: str
    payload: str
    status_code: Optional[int]
    success: bool
    error_message: Optional[str]
    attempts: int
    created_at: datetime
    delivered_at: Optional[datetime]


class WaitlistSignupCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = None


class WaitlistSignupResponse(BaseModel):
    success: bool = True
    message: str
    duplicate: bool = False


class WaitlistCountResponse(BaseModel):
    count: int


# Lead Schemas
class LeadCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    message: Optional[str] = Field(None, max_length=5000)
    source: Optional[str] = Field(None, max_length=120)


class LeadUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    message: Optional[str] = Field(None, max_length=5000)
    source: Optional[str] = Field(None, max_length=120)


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: Optional[str]
    company: Optional[str]
    message: Optional[str]
    source: Optional[str]
    created_at: datetime


class APIKeyHistoryResponse(BaseModel):
    """Paginated response for listing API keys."""

    items: list[APIKeyResponse] = Field(default_factory=list)
    total: int
    skip: int
    limit: int


# Usage Event Schemas
class UsageEventCreate(BaseModel):
    """Request model for creating a usage event"""

    event_type: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Type of usage event (e.g., api_call, agent_run, deployment)",
    )
    resource_type: Optional[str] = Field(
        None,
        max_length=100,
        description="Type of resource that was used",
    )
    resource_id: Optional[str] = Field(None, max_length=255, description="Resource that was used")
    credits_used: float = Field(1.0, ge=0.0, description="Credits consumed by this event")
    metadata: Optional[dict[str, Any]] = Field(
        default_factory=dict, description="Additional event metadata"
    )


class UsageEventResponse(BaseModel):
    """Response model for usage events"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_type: str
    user_id: uuid.UUID
    resource_type: Optional[str]
    resource_id: Optional[str]
    credits_used: float
    event_metadata: Optional[str] = None  # JSON string from DB
    created_at: datetime

    @computed_field
    @property
    def metadata(self) -> Optional[dict]:
        """Deserialize event_metadata JSON string to dict"""
        if self.event_metadata:
            try:
                import json

                return json.loads(self.event_metadata)
            except (json.JSONDecodeError, TypeError):
                return None
        return None


# Analytics & Monitoring Schemas
class AnalyticsSummaryResponse(BaseModel):
    total_agents: int
    active_agents: int
    total_deployments: int
    active_deployments: int
    total_runs: int
    successful_runs: int
    failed_runs: int
    total_api_calls: int
    avg_latency_ms: float
    period_start: datetime
    period_end: datetime


class AgentMetricsSummary(BaseModel):
    agent_id: uuid.UUID
    agent_name: str
    total_runs: int
    successful_runs: int
    failed_runs: int
    avg_cpu: Optional[float]
    avg_memory: Optional[float]
    total_requests: int
    avg_latency_ms: Optional[float]
    period_start: datetime
    period_end: datetime


class AnalyticsTimeSeries(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None


class AnalyticsTimeSeriesResponse(BaseModel):
    metric: str
    interval: str
    data: list[AnalyticsTimeSeries]
    period_start: datetime
    period_end: datetime


class CostSummaryResponse(BaseModel):
    total_credits_used: float
    credits_remaining: float
    credits_total: float
    usage_by_event_type: dict[str, float]
    usage_by_agent: dict[str, float]
    period_start: datetime
    period_end: datetime


class BudgetResponse(BaseModel):
    user_id: uuid.UUID
    plan: str
    credits_total: float
    credits_used: float
    credits_remaining: float
    reset_date: datetime
    usage_percentage: float
