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
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_agent, get_current_user
from src.api.models import Agent, AgentLog, AgentMetric, AgentStatus, Command, User
from src.api.services.webhook_service import trigger_webhook_event

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


class HeartbeatRequest(BaseModel):
    agent_id: str
    status: str = "running"
    message: Optional[str] = None
    timestamp: str
    platform: Optional[str] = None
    hostname: Optional[str] = None


class MetricsRequest(BaseModel):
    agent_id: str
    cpu_usage: Optional[float] = 0.0
    memory_usage: Optional[float] = 0.0
    uptime_seconds: Optional[float] = 0.0
    requests_processed: Optional[int] = 0
    errors_count: Optional[int] = 0
    custom: Optional[dict] = {}
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


class CommandsListResponse(BaseModel):
    commands: list[CommandResponse]


class AgentStatusResponse(BaseModel):
    agent_id: str
    status: str
    last_heartbeat: Optional[str]
    uptime_seconds: float


# --- Helper Functions ---


async def verify_agent_api_key(
    agent_id: str,
    api_key: str,
    db: AsyncSession,
) -> Agent:
    """Verify agent exists and API key is valid."""
    result = await db.execute(
        select(Agent).where(
            Agent.id == uuid.UUID(agent_id),
            Agent.api_key == api_key,
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid agent credentials")
    return agent


# --- Routes ---


@router.post("/register", response_model=AgentRegisterResponse)
async def register_agent(
    request: AgentRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new agent with MUTX.

    Returns agent_id and api_key that the agent should use for subsequent requests.
    """
    # Generate unique API key for this agent
    agent_api_key = f"mutx_agent_{uuid.uuid4().hex}_{uuid.uuid4().hex[:8]}"

    agent = Agent(
        name=request.name,
        description=request.description or "",
        status=AgentStatus.RUNNING.value,
        config=(__import__("json").dumps(request.metadata) if request.metadata else None),
        api_key=agent_api_key,
        user_id=current_user.id,
    )

    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    logger.info(f"Registered new agent: {agent.id} ({agent.name}) for user: {current_user.id}")

    return AgentRegisterResponse(
        agent_id=str(agent.id),
        api_key=agent_api_key,
        status="registered",
        message=f"Agent '{agent.name}' registered successfully",
    )


@router.post("/heartbeat")
async def heartbeat(
    request: HeartbeatRequest,
    db: AsyncSession = Depends(get_db),
    agent: Agent = Depends(get_current_agent),
):
    """Update agent heartbeat status."""
    # Verify the agent_id in body matches the authenticated agent
    if str(agent.id) != request.agent_id:
        raise HTTPException(status_code=403, detail="Agent ID mismatch")

    # Update agent status and last heartbeat
    previous_status = agent.status
    now = datetime.utcnow()
    agent.status = request.status
    agent.last_heartbeat = now

    await db.commit()

    await trigger_webhook_event(
        db,
        "agent.heartbeat",
        {
            "agent_id": str(agent.id),
            "agent_name": agent.name,
            "status": agent.status,
            "previous_status": previous_status,
            "message": request.message,
            "platform": request.platform,
            "hostname": request.hostname,
            "timestamp": now.isoformat(),
        },
    )

    if previous_status != agent.status:
        await trigger_webhook_event(
            db,
            "agent.status",
            {
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "old_status": previous_status,
                "new_status": agent.status,
                "message": request.message,
                "platform": request.platform,
                "hostname": request.hostname,
                "timestamp": now.isoformat(),
            },
        )

    return {
        "status": "ok",
        "agent_id": request.agent_id,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/metrics")
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
        timestamp=datetime.utcnow(),
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
            )
            for cmd in commands
        ]
    )


@router.post("/commands/acknowledge")
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
    command.completed_at = datetime.utcnow()

    await db.commit()

    return {
        "status": "ok",
        "command_id": request.command_id,
    }


@router.post("/logs")
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
        timestamp=datetime.utcnow(),
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

    uptime = 0.0
    if current_agent.created_at:
        uptime = (datetime.utcnow() - current_agent.created_at).total_seconds()

    return AgentStatusResponse(
        agent_id=str(current_agent.id),
        status=current_agent.status,
        last_heartbeat=(
            current_agent.last_heartbeat.isoformat() if current_agent.last_heartbeat else None
        ),
        uptime_seconds=uptime,
    )
