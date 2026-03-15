from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic import EmailStr
from datetime import datetime
from typing import Optional, Any
import uuid

from src.api.models.models import AgentStatus, AgentType


class AgentConfigBase(BaseModel):
    """Base schema for specialized agent configurations"""

    model_config = ConfigDict(extra="forbid")


class LLMGenerationConfig(AgentConfigBase):
    """Shared typed configuration for LLM-driven agents."""

    model: str = Field(default="gpt-4o", min_length=1, max_length=128)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, gt=0, le=200000)
    system_prompt: Optional[str] = Field(default=None, max_length=20000)
    tools: list[str] = Field(default_factory=list)
    top_p: float = Field(default=1.0, gt=0.0, le=1.0)
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    stop: list[str] = Field(default_factory=list, max_length=16)

    @field_validator("tools")
    @classmethod
    def validate_tools(cls, value: list[str]) -> list[str]:
        normalized = []
        for tool_name in value:
            tool_name = tool_name.strip()
            if not tool_name:
                raise ValueError("Tool names must be non-empty strings")
            normalized.append(tool_name)
        return normalized

    @field_validator("stop")
    @classmethod
    def validate_stop_sequences(cls, value: list[str]) -> list[str]:
        normalized = []
        for sequence in value:
            sequence = sequence.strip()
            if not sequence:
                raise ValueError("Stop sequences must be non-empty strings")
            normalized.append(sequence)
        return normalized


class OpenAIAgentConfig(LLMGenerationConfig):
    model: str = Field(default="gpt-4o", min_length=1, max_length=128)
    max_tokens: int = Field(default=4096, gt=0, le=200000)


class AnthropicAgentConfig(LLMGenerationConfig):
    model: str = Field(default="claude-3-5-sonnet-20240620", min_length=1, max_length=128)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(default=4096, gt=0, le=200000)


class LangChainAgentConfig(LLMGenerationConfig):
    provider: str = Field(default="openai", min_length=1, max_length=50)
    chain_id: Optional[str] = Field(default=None, min_length=1, max_length=255)
    parameters: dict[str, Any] = Field(default_factory=dict)
    vector_store_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    memory_type: str = Field(default="buffer", min_length=1, max_length=50)
    max_iterations: int = Field(default=10, gt=0, le=100)
    verbose: bool = True


class CustomAgentConfig(AgentConfigBase):
    image: str = Field(min_length=1, max_length=512)
    command: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    type: AgentType = Field(default=AgentType.OPENAI)
    config: Optional[dict[str, Any] | str] = None
    # user_id is set from current_user in the route, not from request body


class DeploymentCreate(BaseModel):
    agent_id: uuid.UUID
    replicas: int = 1


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

    version: int


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str]
    status: str
    config: Optional[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    user_id: uuid.UUID


class AgentDetailResponse(AgentResponse):
    deployments: list[DeploymentResponse] = Field(default_factory=list)


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
    metadata: dict[str, Any] = Field(default_factory=dict)
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
    metadata: dict[str, Any]
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
    agent_id: uuid.UUID
    cpu_usage: float
    memory_usage: float


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    database: Optional[str] = None
    error: Optional[str] = None


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
    url: str = Field(..., max_length=512, description="The URL to receive webhook events")
    events: list[str] = Field(
        default_factory=lambda: ["*"],
        description="List of events to subscribe to (e.g., 'agent.status', 'deployment.*', '*' for all)",
    )
    secret: Optional[str] = Field(None, description="Optional secret for signature verification")
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
    secret: Optional[str]
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


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: Optional[str]
    company: Optional[str]
    message: Optional[str]
    source: Optional[str]
    created_at: datetime
