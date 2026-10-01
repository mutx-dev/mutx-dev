"""
Agent Runtime API routes.

These endpoints are used by agents to connect to MUTX:
- /agents/register - Register a new agent
- /agents/heartbeat - Send heartbeat
- /agents/metrics - Report metrics
- /agents/commands - Poll for commands
- /agents/commands/acknowledge - Acknowledge command execution
- /agents/logs - Send logs
- /agents/{agent_id}/status - Get agent status
"""

import logging
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.auth.dependencies import get_current_agent, require_roles
from src.api.models import (
    Agent,
    AgentLog,
    AgentMetric,
    AgentStatus,
    AgentVersion,
    Command,
    User,
)
from src.api.models.schemas import AgentResponse, AgentRollbackRequest, AgentVersionHistoryResponse
from src.api.models.numeric import (
    DegradedNumericResponseModel,
    NonNegativeFiniteFloat,
    PercentageFloat,
)
from src.api.services.user_service import generate_agent_api_key, hash_api_key
from src.api.services.deployment_lifecycle import create_agent_record, record_runtime_heartbeat
from src.api.services.webhook_service import trigger_deployment_event, trigger_webhook_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["agent-runtime"])


# --- Pydantic Models ---


class AgentRegisterRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    metadata: dict[str, Any] = {}
    capabilities: list[str] = []


class AgentRegisterResponse(BaseModel):
    agent_id: str
    api_key: str
    status: str
    message: str
    desired_action: str | None = None
    desired_state: str | None = None
    observed_state: str | None = None
    target_revision: int = 0


class HeartbeatRequest(BaseModel):
    agent_id: str
    status: AgentStatus = AgentStatus.RUNNING
    message: Optional[str] = None
    timestamp: str
    platform: Optional[str] = None
    hostname: Optional[str] = None
    component: Literal["agent_runtime", "command_listener"] = "agent_runtime"
    deployment_id: uuid.UUID | None = None
    target_revision: int | None = Field(default=None, ge=0)
    node_id: str | None = None

    @model_validator(mode="after")
    def deployment_revision_pair(self):
        if self.deployment_id is not None and self.target_revision is None:
            raise ValueError("target_revision is required when deployment_id is provided")
        return self


class MetricsRequest(BaseModel):
    agent_id: str
    cpu_usage: Optional[PercentageFloat] = 0.0
    memory_usage: Optional[PercentageFloat] = 0.0
    uptime_seconds: Optional[NonNegativeFiniteFloat] = 0.0
    requests_processed: Optional[int] = 0
    errors_count: Optional[int] = 0
    custom: dict = {}
    timestamp: str


class LogRequest(BaseModel):
    agent_id: str
    level: str = "info"
    message: str
    metadata: dict[str, Any] = {}
    timestamp: str


class CommandAcknowledgeRequest(BaseModel):
    command_id: str
    agent_id: str
    success: bool
    result: Optional[dict] = None
    error: Optional[str] = None
    completed_at: str


class CommandResponse(BaseModel):
    command_id: str
    action: str
    parameters: dict
    received_at: str
    target_deployment_id: uuid.UUID | None = None
    target_revision: int | None = None


class CommandsListResponse(BaseModel):
    commands: list[CommandResponse]


class HeartbeatResponse(BaseModel):
    status: str
    agent_id: str
    timestamp: str


class MetricsResponse(BaseModel):
    status: str
    agent_id: str


class CommandAckResponse(BaseModel):
    status: str
    command_id: str


class LogSubmitResponse(BaseModel):
    status: str
    agent_id: str


class AgentStatusResponse(DegradedNumericResponseModel):
    agent_id: str
    status: str
    last_heartbeat: Optional[str]
    uptime_seconds: float | None
    desired_action: str | None = None
    desired_state: str | None = None
    observed_state: str | None = None
    target_revision: int = 0
    observed_revision: int | None = None
    observed_at: datetime | None = None


# --- Routes ---


@router.post("/register", response_model=AgentRegisterResponse)
async def register_agent(
    request: AgentRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    """
    Register a new agent with MUTX.

    Returns agent_id and api_key that the agent should use for subsequent requests.
    """
    agent = Agent(
        name=request.name,
        description=request.description or "",
        config=json.dumps(request.metadata) if request.metadata else None,
        user_id=current_user.id,
    )
    await create_agent_record(agent=agent, db=db, action="register")
    agent_api_key, api_key_prefix = generate_agent_api_key(agent.id)
    agent.api_key = hash_api_key(agent_api_key)
    agent.api_key_prefix = api_key_prefix

    # Create initial version
    _create_agent_version(agent, db)

    await db.commit()
    await db.refresh(agent)

    logger.info(f"Registered new agent: {agent.id} ({agent.name}) for user: {current_user.id}")

    return AgentRegisterResponse(
        agent_id=str(agent.id),
        api_key=agent_api_key,
        status="registered",
        message=f"Agent '{agent.name}' registered successfully",
        desired_action=agent.desired_action,
        desired_state=agent.desired_state,
        observed_state=agent.observed_state,
        target_revision=agent.target_revision,
    )


@router.post("/heartbeat", response_model=HeartbeatResponse)
async def heartbeat(
    request: HeartbeatRequest,
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Update agent heartbeat status."""
    # Verify the agent_id in body matches the authenticated agent
    if str(agent.id) != request.agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    now = datetime.now(timezone.utc)
    heartbeat_timestamp = now.isoformat()
    observation = await record_runtime_heartbeat(
        db=db,
        agent_id=agent.id,
        status=request.status.value,
        component=request.component,
        now=now,
        deployment_id=request.deployment_id,
        target_revision=request.target_revision,
        node_id=request.node_id,
        error_message=request.message if request.status == AgentStatus.FAILED else None,
    )
    if observation is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent = observation.agent
    previous_status = observation.previous_agent_status
    new_status = agent.status

    await db.commit()

    try:
        await trigger_webhook_event(
            db,
            agent.user_id,
            "agent.heartbeat",
            {
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "status": new_status,
                "reported_status": request.status.value,
                "previous_status": previous_status,
                "message": request.message,
                "platform": request.platform,
                "hostname": request.hostname,
                "timestamp": heartbeat_timestamp,
            },
        )
    except Exception:
        logger.exception(
            "Failed to emit agent.heartbeat webhook", extra={"agent_id": str(agent.id)}
        )

    if previous_status != new_status:
        try:
            await trigger_webhook_event(
                db,
                agent.user_id,
                "agent.status",
                {
                    "agent_id": str(agent.id),
                    "agent_name": agent.name,
                    "old_status": previous_status,
                    "new_status": new_status,
                    "message": request.message,
                    "platform": request.platform,
                    "hostname": request.hostname,
                    "timestamp": heartbeat_timestamp,
                },
            )
        except Exception:
            logger.exception(
                "Failed to emit agent.status webhook", extra={"agent_id": str(agent.id)}
            )

    if observation.deployment_event_type and observation.deployment is not None:
        try:
            await trigger_deployment_event(
                db,
                agent.user_id,
                observation.deployment.id,
                agent.id,
                event_type=observation.deployment_event_type,
                status=observation.deployment_event_status,
            )
        except Exception:
            logger.exception(
                "Failed to emit deployment.event webhook",
                extra={
                    "agent_id": str(agent.id),
                    "deployment_id": str(observation.deployment.id),
                    "event_type": observation.deployment_event_type,
                },
            )

    return {
        "status": "ok",
        "agent_id": request.agent_id,
        "timestamp": heartbeat_timestamp,
    }


@router.post("/metrics", response_model=MetricsResponse)
async def report_metrics(
    request: MetricsRequest,
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Report agent metrics to MUTX."""
    # Verify the agent_id in body matches the authenticated agent
    if str(agent.id) != request.agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    # Store metric
    metric = AgentMetric(
        agent_id=agent.id,
        cpu_usage=request.cpu_usage,
        memory_usage=request.memory_usage,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(metric)

    await db.commit()

    return {
        "status": "ok",
        "agent_id": request.agent_id,
    }


@router.get("/commands", response_model=CommandsListResponse)
async def poll_commands(
    agent_id: str = Query(...),
    since: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Poll for pending commands for this agent."""
    # Verify the agent_id in query matches the authenticated agent
    if str(agent.id) != agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    # Query pending commands
    query = select(Command).where(
        Command.agent_id == agent.id,
        Command.status == "pending",
    )

    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.where(Command.created_at > since_dt)
        except ValueError:
            pass

    query = query.order_by(Command.created_at.asc()).limit(50)
    result = await db.execute(query)
    commands = result.scalars().all()

    return CommandsListResponse(
        commands=[
            CommandResponse(
                command_id=str(cmd.id),
                action=cmd.action,
                parameters=cmd.parameters or {},
                received_at=cmd.created_at.isoformat(),
                target_deployment_id=cmd.target_deployment_id,
                target_revision=cmd.target_revision,
            )
            for cmd in commands
        ]
    )


@router.post("/commands/acknowledge", response_model=CommandAckResponse)
async def acknowledge_command(
    request: CommandAcknowledgeRequest,
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Acknowledge command execution."""
    # Verify the agent_id in body matches the authenticated agent
    if str(agent.id) != request.agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    result = await db.execute(
        select(Command).where(
            Command.id == uuid.UUID(request.command_id),
            Command.agent_id == agent.id,
        )
    )
    command = result.scalar_one_or_none()

    if not command:
        raise HTTPException(status_code=404, detail="Command not found")

    # Update command status
    command.status = "completed" if request.success else "failed"
    command.result = request.result
    command.error_message = request.error
    command.completed_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "status": "ok",
        "command_id": request.command_id,
    }


@router.post("/logs", response_model=LogSubmitResponse)
async def submit_log(
    request: LogRequest,
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Submit a log entry from the agent."""
    # Verify the agent_id in body matches the authenticated agent
    if str(agent.id) != request.agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    log_entry = AgentLog(
        agent_id=agent.id,
        level=request.level,
        message=request.message,
        meta_data=request.metadata,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log_entry)

    await db.commit()

    return {
        "status": "ok",
        "agent_id": request.agent_id,
    }


@router.get("/{agent_id}/status", response_model=AgentStatusResponse)
async def get_agent_status(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Get status for the authenticated agent."""
    if str(agent.id) != agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    result = await db.execute(select(Agent).where(Agent.id == agent.id))
    current_agent = result.scalar_one_or_none()
    if not current_agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentStatusResponse(
        agent_id=str(current_agent.id),
        status=current_agent.status,
        last_heartbeat=(
            current_agent.last_heartbeat.isoformat() if current_agent.last_heartbeat else None
        ),
        uptime_seconds=None,
        desired_action=current_agent.desired_action,
        desired_state=current_agent.desired_state,
        observed_state=current_agent.observed_state,
        target_revision=current_agent.target_revision,
        observed_revision=current_agent.observed_revision,
        observed_at=current_agent.observed_at,
    )


def _create_agent_version(agent: Agent, db: AsyncSession) -> AgentVersion:
    """Create a new version snapshot for an agent."""
    config_snapshot = json.dumps(
        {
            "config": agent.config,
            "type": agent.type.value if agent.type else None,
        }
    )
    version = AgentVersion(
        agent_id=agent.id,
        version=1,
        config_snapshot=config_snapshot,
        status="current",
    )
    db.add(version)
    return version


@router.get("/{agent_id}/versions", response_model=AgentVersionHistoryResponse)
async def get_agent_versions(
    agent_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
):
    """Get version history for a specific agent."""
    # Verify ownership
    result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            Agent.user_id == current_user.id,
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or not authorized")

    # Count total for pagination
    count_query = (
        select(func.count()).select_from(AgentVersion).where(AgentVersion.agent_id == agent.id)
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = (
        select(AgentVersion)
        .where(AgentVersion.agent_id == agent.id)
        .order_by(AgentVersion.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    versions = result.scalars().all()

    return AgentVersionHistoryResponse(
        agent_id=agent.id,
        items=list(versions),
        total=total,
        has_more=(skip + limit) < total,
    )


@router.post("/{agent_id}/rollback", response_model=AgentResponse)
async def rollback_agent(
    agent_id: uuid.UUID,
    rollback_data: AgentRollbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    """Rollback an agent to a specific version."""
    # Verify ownership
    result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            Agent.user_id == current_user.id,
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or not authorized")

    # Find target version
    target_version_query = select(AgentVersion).where(
        AgentVersion.agent_id == agent.id,
        AgentVersion.version == rollback_data.version,
    )
    version_result = await db.execute(target_version_query)
    target_version = version_result.scalar_one_or_none()

    if not target_version:
        raise HTTPException(
            status_code=404,
            detail=f"Version {rollback_data.version} not found for this agent",
        )

    # Restore config from snapshot
    snapshot = json.loads(target_version.config_snapshot)
    if snapshot.get("config"):
        agent.config = snapshot["config"]
    if snapshot.get("type"):
        from src.api.models import AgentType

        agent.type = AgentType(snapshot["type"])

    # Mark old current versions as superseded
    old_versions_query = select(AgentVersion).where(
        AgentVersion.agent_id == agent.id,
        AgentVersion.status == "current",
    )
    old_result = await db.execute(old_versions_query)
    old_versions = old_result.scalars().all()
    for old_v in old_versions:
        old_v.status = "superseded"
        old_v.rolled_back_at = datetime.now(timezone.utc)

    # Mark target as current
    target_version.status = "current"
    target_version.rolled_back_at = None

    await db.commit()

    # Re-fetch to ensure fresh data
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()

    logger.info(f"Rolled back agent {agent_id} to version {rollback_data.version}")

    from src.api.models.schemas import AgentResponse as AgentResponseSchema

    return AgentResponseSchema(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        type=agent.type,
        status=agent.status,
        user_id=agent.user_id,
        config=agent.config,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
    )
