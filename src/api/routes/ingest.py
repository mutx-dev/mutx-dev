from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
import logging

from src.api.database import get_db
from src.api.models import (
    Agent,
    Deployment,
    AgentLog,
    AgentMetric,
    AgentStatus,
    User,
    DeploymentEvent as DeploymentEventModel,
)
from src.api.models.schemas import (
    AgentStatusUpdate,
    DeploymentEvent,
    MetricsReportRequest,
)
from src.api.middleware.auth import get_current_user_or_api_key
from src.api.services.webhook_service import (
    trigger_agent_status_event,
    trigger_deployment_event,
    trigger_webhook_event,
)

router = APIRouter(prefix="/ingest", tags=["ingest"])
logger = logging.getLogger(__name__)


async def get_ingest_auth(
    authorization: Optional[str] = Header(None, description="Bearer token for JWT auth"),
    x_api_key: Optional[str] = Header(
        None, alias="X-API-Key", description="API key for ingestion authentication"
    ),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate ingestion requests via JWT or API key."""
    user = await get_current_user_or_api_key(authorization, x_api_key, session)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication. Provide valid JWT Bearer token or X-API-Key header.",
        )
    return user


@router.post("/agent-status")
async def agent_status_update(
    status_data: AgentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_ingest_auth),
):
    """Update an agent status and append logs (Ingestion)."""
    # Verify the agent belongs to the authenticated user
    result = await db.execute(select(Agent).where(Agent.id == status_data.agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this agent")

    old_status = agent.status
    agent.status = status_data.status.value
    agent.last_heartbeat = datetime.now(timezone.utc)
    agent.updated_at = datetime.now(timezone.utc)

    log = AgentLog(
        agent_id=agent.id,
        level="info",
        message=f"Status changed from {old_status} to {status_data.status.value}",
        extra_data=f"node_id: {status_data.node_id}",
    )
    db.add(log)

    if status_data.error_message:
        agent.status = AgentStatus.FAILED.value
        error_log = AgentLog(
            agent_id=agent.id,
            level="error",
            message=status_data.error_message,
            extra_data=f"node_id: {status_data.node_id}",
        )
        db.add(error_log)

    await db.commit()

    # Trigger webhook
    await trigger_agent_status_event(db, agent.id, old_status, agent.status, agent.name)

    logger.info(f"Agent {agent.id} status updated to {status_data.status.value}")
    return {"status": "updated"}


@router.post("/deployment")
async def deployment_event(
    event_data: DeploymentEvent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_ingest_auth),
):
    """Update deployment state and related agent state (Ingestion)."""
    # Verify the deployment's agent belongs to the authenticated user
    result = await db.execute(select(Deployment).where(Deployment.id == event_data.deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    # Get the agent to verify ownership
    agent_result = await db.execute(select(Agent).where(Agent.id == deployment.agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent or agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this deployment")

    if event_data.status:
        deployment.status = event_data.status

    if event_data.node_id:
        deployment.node_id = event_data.node_id

    # Record the event in the lifecycle history
    new_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type=event_data.event,
        status=event_data.status or deployment.status,
        node_id=event_data.node_id,
        error_message=event_data.error_message,
    )
    db.add(new_event)

    if event_data.error_message:
        deployment.error_message = event_data.error_message
        deployment.status = "failed"
        error_log = AgentLog(
            agent_id=deployment.agent_id,
            level="error",
            message=event_data.error_message,
            extra_data=f"deployment_id: {deployment.id}, event: {event_data.event}",
        )
        db.add(error_log)

    if event_data.event == "stopped" or event_data.status == "stopped":
        deployment.ended_at = datetime.now(timezone.utc)
        if agent:
            agent.status = AgentStatus.STOPPED.value

    if event_data.event == "healthy" or event_data.status == "running":
        deployment.status = "running"
        if deployment.started_at is None:
            deployment.started_at = datetime.now(timezone.utc)

    await db.commit()

    # Trigger webhook
    await trigger_deployment_event(db, deployment.id, agent.id, event_data.event, deployment.status)

    logger.info(f"Deployment {deployment.id} event: {event_data.event}")
    return {"status": "processed"}


@router.post("/metrics")
async def receive_metrics(
    metrics_data: MetricsReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_ingest_auth),
):
    """Record agent metrics (Ingestion)."""
    # Verify the agent belongs to the authenticated user
    result = await db.execute(select(Agent).where(Agent.id == metrics_data.agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to submit metrics for this agent"
        )

    agent.last_heartbeat = datetime.now(timezone.utc)
    metric = AgentMetric(
        agent_id=metrics_data.agent_id,
        cpu_usage=metrics_data.cpu_usage,
        memory_usage=metrics_data.memory_usage,
    )
    agent.last_heartbeat = datetime.now(timezone.utc)
    db.add(metric)
    await db.commit()

    # Trigger metrics webhook
    await trigger_webhook_event(
        db,
        "metrics.report",
        {
            "agent_id": str(metrics_data.agent_id),
            "cpu_usage": metrics_data.cpu_usage,
            "memory_usage": metrics_data.memory_usage,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    logger.debug(f"Received metrics for agent {metrics_data.agent_id}")
    return {"status": "recorded"}
