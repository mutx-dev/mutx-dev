from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
import logging
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.models import (
    Deployment,
    Agent,
    AgentStatus,
    User,
    AgentLog,
    AgentMetric,
    DeploymentEvent as DeploymentEventModel,
)
from src.api.models.schemas import (
    DeploymentResponse,
    DeploymentScale,
    DeploymentCreate,
    DeploymentEventHistoryResponse,
    DeploymentLogsResponse,
    DeploymentMetricsResponse,
)
from src.api.middleware.auth import get_current_user

router = APIRouter(prefix="/deployments", tags=["deployments"])
logger = logging.getLogger(__name__)


async def _get_owned_agent(
    agent_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
    *,
    not_found_detail: str,
    forbidden_detail: str,
) -> Agent:
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail=not_found_detail)
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail=forbidden_detail)
    return agent


async def _get_deployment_with_ownership(
    deployment_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
) -> Deployment:
    """Get deployment and verify ownership through the agent."""
    result = await db.execute(
        select(Deployment)
        .options(selectinload(Deployment.events))
        .where(Deployment.id == deployment_id)
    )
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    await _get_owned_agent(
        deployment.agent_id,
        db,
        current_user,
        not_found_detail="Deployment not found",
        forbidden_detail="Not authorized to access this deployment",
    )

    return deployment


def _serialize_deployment(deployment: Deployment):
    return {
        "id": deployment.id,
        "agent_id": deployment.agent_id,
        "status": deployment.status,
        "replicas": deployment.replicas,
        "node_id": deployment.node_id,
        "started_at": deployment.started_at,
        "ended_at": deployment.ended_at,
        "error_message": deployment.error_message,
        "events": [
            {
                "id": event.id,
                "deployment_id": event.deployment_id,
                "event_type": event.event_type,
                "status": event.status,
                "node_id": event.node_id,
                "error_message": event.error_message,
                "created_at": event.created_at,
            }
            for event in getattr(deployment, "events", [])
        ],
    }


@router.get("", response_model=list[DeploymentResponse])
async def list_deployments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    agent_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Filter deployments by agents owned by the current user
    query = (
        select(Deployment)
        .options(selectinload(Deployment.events))
        .join(Agent, Deployment.agent_id == Agent.id)
        .where(Agent.user_id == current_user.id)
        .order_by(Deployment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if agent_id:
        await _get_owned_agent(
            agent_id,
            db,
            current_user,
            not_found_detail="Agent not found",
            forbidden_detail="Not authorized to view deployments for this agent",
        )
        query = query.where(Deployment.agent_id == agent_id)
    if status:
        query = query.where(Deployment.status == status)
    result = await db.execute(query)
    deployments = result.scalars().all()
    return [_serialize_deployment(deployment) for deployment in deployments]


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)
    return _serialize_deployment(deployment)


@router.get("/{deployment_id}/events", response_model=DeploymentEventHistoryResponse)
async def get_deployment_events(
    deployment_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get paginated lifecycle events for a specific deployment."""
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)

    filters = [DeploymentEventModel.deployment_id == deployment.id]
    if event_type:
        filters.append(DeploymentEventModel.event_type == event_type)
    if status:
        filters.append(DeploymentEventModel.status == status)

    total_result = await db.execute(
        select(func.count()).select_from(DeploymentEventModel).where(*filters)
    )
    total = total_result.scalar_one()

    query = (
        select(DeploymentEventModel)
        .where(*filters)
        .order_by(DeploymentEventModel.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    items = result.scalars().all()
    return {
        "deployment_id": deployment.id,
        "deployment_status": deployment.status,
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "event_type": event_type,
        "status": status,
    }


@router.post("/{deployment_id}/scale", response_model=DeploymentResponse)
async def scale_deployment(
    deployment_id: uuid.UUID,
    scale_data: DeploymentScale,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)

    if deployment.status not in ["running", "ready"]:
        raise HTTPException(status_code=400, detail="Can only scale running deployments")

    deployment.replicas = scale_data.replicas

    # Record scale event
    scale_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="scale",
        status=deployment.status,
        error_message=None,
    )
    db.add(scale_event)

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)
    logger.info(f"Scaled deployment {deployment_id} to {scale_data.replicas} replicas")
    return _serialize_deployment(deployment)


@router.delete("/{deployment_id}", status_code=204)
async def kill_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)

    deployment.status = "killed"
    deployment.ended_at = datetime.utcnow()

    # Record kill event
    kill_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="kill",
        status="killed",
    )
    db.add(kill_event)

    result = await db.execute(select(Agent).where(Agent.id == deployment.agent_id))
    agent = result.scalar_one_or_none()
    if agent:
        agent.status = AgentStatus.STOPPED.value

    await db.commit()
    logger.info(f"Killed deployment: {deployment_id}")


@router.post("", response_model=DeploymentResponse, status_code=201)
async def create_deployment(
    deployment_data: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new deployment for an agent."""
    agent = await _get_owned_agent(
        deployment_data.agent_id,
        db,
        current_user,
        not_found_detail="Agent not found",
        forbidden_detail="Not authorized to deploy this agent",
    )

    # Check if agent is in a deployable state
    if agent.status == AgentStatus.DELETING.value:
        raise HTTPException(status_code=400, detail="Cannot deploy an agent that is being deleted")

    # Create the deployment
    deployment = Deployment(
        agent_id=deployment_data.agent_id,
        status="pending",
        replicas=deployment_data.replicas,
        started_at=datetime.utcnow(),
    )
    db.add(deployment)
    await db.flush()  # Get deployment.id

    # Record create event
    create_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="create",
        status="pending",
    )
    db.add(create_event)

    # Update agent status
    agent.status = AgentStatus.RUNNING.value

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await _get_deployment_with_ownership(deployment.id, db, current_user)
    logger.info(f"Created deployment {deployment.id} for agent {deployment_data.agent_id}")
    return _serialize_deployment(deployment)


@router.post("/{deployment_id}/restart", response_model=DeploymentResponse)
async def restart_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restart an existing deployment."""
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)

    # Can only restart deployments that are stopped, failed, or killed
    if deployment.status not in ["stopped", "failed", "killed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot restart deployment with status '{deployment.status}'. Only stopped, failed, or killed deployments can be restarted.",
        )

    # Reset deployment status
    deployment.status = "pending"
    deployment.started_at = datetime.utcnow()
    deployment.ended_at = None
    deployment.error_message = None

    # Record restart event
    restart_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="restart",
        status="pending",
    )
    db.add(restart_event)

    # Update agent status
    agent_result = await db.execute(select(Agent).where(Agent.id == deployment.agent_id))
    agent = agent_result.scalar_one_or_none()
    if agent:
        agent.status = AgentStatus.RUNNING.value

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)
    logger.info(f"Restarted deployment: {deployment_id}")
    return _serialize_deployment(deployment)


@router.get("/{deployment_id}/logs", response_model=list[DeploymentLogsResponse])
async def get_deployment_logs(
    deployment_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get logs for a specific deployment."""
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)

    # Query logs for the deployment's agent
    query = (
        select(AgentLog).where(AgentLog.agent_id == deployment.agent_id).offset(skip).limit(limit)
    )
    if level:
        query = query.where(AgentLog.level == level)
    query = query.order_by(AgentLog.timestamp.desc())

    result = await db.execute(query)
    logs = result.scalars().all()
    return logs


@router.get("/{deployment_id}/metrics", response_model=list[DeploymentMetricsResponse])
async def get_deployment_metrics(
    deployment_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get metrics for a specific deployment."""
    deployment = await _get_deployment_with_ownership(deployment_id, db, current_user)

    # Query metrics for the deployment's agent
    query = (
        select(AgentMetric)
        .where(AgentMetric.agent_id == deployment.agent_id)
        .offset(skip)
        .limit(limit)
        .order_by(AgentMetric.timestamp.desc())
    )

    result = await db.execute(query)
    metrics = result.scalars().all()
    return metrics
