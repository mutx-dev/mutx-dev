import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
import logging
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_agent, get_owned_deployment
from src.api.database import get_db
from src.api.models import (
    Deployment,
    UsageEvent,
    Agent,
    AgentStatus,
    User,
    AgentLog,
    AgentMetric,
    DeploymentEvent as DeploymentEventModel,
    DeploymentVersion,
)
from src.api.models.schemas import (
    DeploymentResponse,
    DeploymentScale,
    DeploymentCreate,
    DeploymentEventHistoryResponse,
    DeploymentLogsResponse,
    DeploymentMetricsResponse,
    DeploymentVersionHistoryResponse,
    DeploymentRollbackRequest,
)
from src.api.middleware.auth import get_current_user
from src.api.services.usage import track_usage

router = APIRouter(prefix="/deployments", tags=["deployments"])
logger = logging.getLogger(__name__)


def _serialize_deployment(deployment: Deployment):
    return {
        "id": deployment.id,
        "agent_id": deployment.agent_id,
        "status": deployment.status,
        "version": deployment.version,
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


def _create_deployment_version(deployment: Deployment, db: AsyncSession) -> DeploymentVersion:
    config_snapshot = {
        "replicas": deployment.replicas,
        "version": deployment.version,
    }
    version = DeploymentVersion(
        deployment_id=deployment.id,
        version=1,
        config_snapshot=json.dumps(config_snapshot),
        status="current",
    )
    db.add(version)
    return version


@router.get("", response_model=list[DeploymentResponse])
async def list_deployments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    agent_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ownership enforcement: always filter by authenticated user's agent ownership.
    # Client-supplied user_id query params are ignored - ownership is derived
    # from the auth token via current_user, not from client input.
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
        await get_owned_agent(
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
    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
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
    deployment = await get_owned_deployment(deployment_id, db, current_user)

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
    deployment = await get_owned_deployment(deployment_id, db, current_user)

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
    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Scaled deployment {deployment_id} to {scale_data.replicas} replicas")
    
    # Track usage event
    usage_event = UsageEvent(
        event_type="deployment_scaled",
        user_id=current_user.id,
        resource_id=str(deployment_id), resource_type="deployment", credits_used=1.0,
        event_metadata=f'{{"replicas": {scale_data.replicas}}}',
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()
    
    return _serialize_deployment(deployment)


@router.delete("/{deployment_id}", status_code=204)
async def kill_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    deployment.status = "killed"
    deployment.ended_at = datetime.now(timezone.utc)

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
    
    # Track usage event
    usage_event = UsageEvent(
        event_type="deployment_killed",
        user_id=current_user.id,
        resource_id=str(deployment_id), resource_type="deployment", credits_used=1.0,
        event_metadata=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()
    
    logger.info(f"Killed deployment: {deployment_id}")


@router.post("", response_model=DeploymentResponse, status_code=201)
async def create_deployment(
    deployment_data: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new deployment for an agent."""
    agent = await get_owned_agent(
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
        version="v1.0.0",
        replicas=deployment_data.replicas,
        started_at=datetime.now(timezone.utc),
    )
    db.add(deployment)
    await db.flush()  # Get deployment.id

    # Create initial version
    _create_deployment_version(deployment, db)

    # Record create event
    create_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="create",
        status="pending",
    )
    db.add(create_event)

    # Update agent status
    agent.status = AgentStatus.RUNNING.value

    # Track usage event
    await track_usage(
        db,
        user_id=current_user.id,
        event_type="deployment_create",
        resource_type="deployment",
        resource_id=str(deployment.id),
        metadata={"replicas": deployment.replicas},
    )

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await get_owned_deployment(
        deployment.id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Created deployment {deployment.id} for agent {deployment_data.agent_id}")
    await db.commit()
    
    return _serialize_deployment(deployment)


@router.post("/{deployment_id}/restart", response_model=DeploymentResponse)
async def restart_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restart an existing deployment."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    # Can only restart deployments that are stopped, failed, or killed
    if deployment.status not in ["stopped", "failed", "killed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot restart deployment with status '{deployment.status}'. Only stopped, failed, or killed deployments can be restarted.",
        )

    # Reset deployment status
    deployment.status = "pending"
    deployment.started_at = datetime.now(timezone.utc)
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
    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Restarted deployment: {deployment_id}")
    
    # Track usage event
    usage_event = UsageEvent(
        event_type="deployment_restarted",
        user_id=current_user.id,
        resource_id=str(deployment_id), resource_type="deployment", credits_used=1.0,
        event_metadata=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()
    
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
    deployment = await get_owned_deployment(deployment_id, db, current_user)

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
    deployment = await get_owned_deployment(deployment_id, db, current_user)

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


@router.get("/{deployment_id}/versions", response_model=DeploymentVersionHistoryResponse)
async def get_deployment_versions(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get version history for a specific deployment."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    query = (
        select(DeploymentVersion)
        .where(DeploymentVersion.deployment_id == deployment.id)
        .order_by(DeploymentVersion.created_at.desc())
    )

    result = await db.execute(query)
    versions = result.scalars().all()

    return {
        "deployment_id": deployment.id,
        "items": versions,
        "total": len(versions),
    }


@router.post("/{deployment_id}/rollback", response_model=DeploymentResponse)
async def rollback_deployment(
    deployment_id: uuid.UUID,
    rollback_data: DeploymentRollbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rollback a deployment to a specific version."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    if deployment.status not in ["running", "ready", "stopped", "failed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot rollback deployment with status '{deployment.status}'",
        )

    target_version_query = select(DeploymentVersion).where(
        DeploymentVersion.deployment_id == deployment.id,
        DeploymentVersion.version == rollback_data.version,
    )
    result = await db.execute(target_version_query)
    target_version = result.scalar_one_or_none()

    if not target_version:
        raise HTTPException(
            status_code=404,
            detail=f"Version {rollback_data.version} not found for this deployment",
        )

    snapshot = json.loads(target_version.config_snapshot)
    deployment.replicas = int(snapshot.get("replicas", deployment.replicas))
    deployment.version = snapshot.get("version", deployment.version)

    mark_old_query = select(DeploymentVersion).where(
        DeploymentVersion.deployment_id == deployment.id,
        DeploymentVersion.status == "current",
    )
    old_result = await db.execute(mark_old_query)
    old_versions = old_result.scalars().all()
    for old_v in old_versions:
        old_v.status = "superseded"
        old_v.rolled_back_at = datetime.now(timezone.utc)

    target_version.status = "current"
    target_version.rolled_back_at = None

    rollback_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="rollback",
        status=deployment.status,
    )
    db.add(rollback_event)

    await db.commit()

    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Rolled back deployment {deployment_id} to version {rollback_data.version}")
    return _serialize_deployment(deployment)
