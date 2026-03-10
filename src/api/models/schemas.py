from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional
import uuid

from src.api.models.models import AgentStatus


class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config: Optional[str] = None
    # user_id is set from current_user in the route, not from request body


class DeploymentCreate(BaseModel):
    agent_id: uuid.UUID
    replicas: int = 1


class DeploymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    agent_id: uuid.UUID
    status: str
    replicas: int
    node_id: Optional[str]
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime]
    error_message: Optional[str]


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


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str]
    status: str
    config: Optional[str]
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
    events: list[str] = Field(default_factory=lambda: ["*"], description="List of events to subscribe to (e.g., 'agent.status', 'deployment.*', '*' for all)")
    secret: Optional[str] = Field(None, description="Optional secret for signature verification")


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
    webhook_id: uuid.UUID
    event: str
    payload: dict
    status_code: Optional[int]
    success: bool
    error_message: Optional[str]
    attempts: int
    created_at: datetime
