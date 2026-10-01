import logging
from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.auth.ownership import (
    get_owned_agent as _get_owned_agent,
    get_owned_deployment as _get_owned_deployment,
)
from src.api.database import get_db
from src.api.models import (
    Deployment,
    Agent,
    User,
    AgentLog,
    AgentMetric,
    DeploymentEvent as DeploymentEventModel,
    DeploymentVersion,
)
from src.api.models.schemas import (
    DeploymentListResponse,
    DeploymentResponse,
    DeploymentScale,
    DeploymentCreate,
    DeploymentEventHistoryResponse,
    DeploymentLogsHistoryResponse,
    DeploymentMetricsHistoryResponse,
    DeploymentVersionHistoryResponse,
    DeploymentRollbackRequest,
    deployment_allowed_actions,
)
from src.api.auth.dependencies import require_roles
from src.api.domain.lifecycle import LifecycleConflict
from src.api.services.deployment_lifecycle import (
    create_deployment_record,
    request_deployment_action,
)
from src.api.services.usage import track_usage_best_effort

router = APIRouter(prefix="/deployments", tags=["deployments"])
logger = logging.getLogger(__name__)


async def get_owned_agent(
    agent_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
    **kwargs: Any,
) -> Agent:
    """Resolve agent ownership without disclosing cross-tenant existence."""
    try:
        return await _get_owned_agent(agent_id, db, current_user, **kwargs)
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
        raise HTTPException(
            status_code=404,
            detail=kwargs.get("not_found_detail", "Agent not found"),
        ) from None


async def get_owned_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
    **kwargs: Any,
) -> Deployment:
    """Resolve deployment ownership without disclosing cross-tenant existence."""
    try:
        return await _get_owned_deployment(deployment_id, db, current_user, **kwargs)
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
        raise HTTPException(
            status_code=404,
            detail=kwargs.get("not_found_detail", "Deployment not found"),
        ) from None


def _serialize_deployment(deployment: Deployment) -> dict[str, object]:
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
        "desired_action": deployment.desired_action,
        "desired_state": deployment.desired_state,
        "observed_state": deployment.observed_state,
        "target_revision": deployment.target_revision,
        "observed_revision": deployment.observed_revision,
        "observed_at": deployment.observed_at,
        "allowed_actions": deployment_allowed_actions(
            deployment.status, deployment.desired_action, deployment.desired_state
        ),
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


@router.get("", response_model=DeploymentListResponse)
async def list_deployments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    agent_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
):
    # Ownership enforcement: always filter by authenticated user's agent ownership.
    # Client-supplied user_id query params are ignored - ownership is derived
    # from the auth token via current_user, not from client input.
    # Build base filters for both count and data queries
    base_filters = [Agent.user_id == current_user.id]
    if agent_id:
        await get_owned_agent(
            agent_id,
            db,
            current_user,
            not_found_detail="Agent not found",
            forbidden_detail="Not authorized to view deployments for this agent",
        )
        base_filters.append(Deployment.agent_id == agent_id)
    if status:
        base_filters.append(Deployment.status == status)

    # Count total matching deployments using SQL aggregate
    count_query = (
        select(func.count())
        .select_from(Deployment)
        .join(Agent, Deployment.agent_id == Agent.id)
        .where(*base_filters)
    )
    total = (await db.execute(count_query)).scalar_one()

    # Fetch paginated results
    query = (
        select(Deployment)
        .options(selectinload(Deployment.events))
        .join(Agent, Deployment.agent_id == Agent.id)
        .where(*base_filters)
        .order_by(Deployment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    deployments = result.scalars().all()

    return DeploymentListResponse(
        items=[_serialize_deployment(d) for d in deployments],
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total,
    )


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
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
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
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
        "has_more": total > skip + len(items),
        "event_type": event_type,
        "status": status,
    }


@router.post("/{deployment_id}/scale", response_model=DeploymentResponse)
async def scale_deployment(
    deployment_id: uuid.UUID,
    scale_data: DeploymentScale,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    await get_owned_deployment(deployment_id, db, current_user)
    try:
        deployment, _agent, usage_event_type = await request_deployment_action(
            deployment_id=deployment_id,
            db=db,
            action="scale",
            requested_replicas=scale_data.replicas,
        )
    except LifecycleConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    event_type = deployment.desired_action

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(
        "Applied deployment action %s to %s with requested replicas %s",
        event_type,
        deployment_id,
        scale_data.replicas,
    )

    await track_usage_best_effort(
        db=db,
        user_id=current_user.id,
        event_type=usage_event_type,
        resource_type="deployment",
        resource_id=str(deployment_id),
        metadata={"requested_replicas": scale_data.replicas, "replicas": deployment.replicas},
    )

    return _serialize_deployment(deployment)


@router.delete("/{deployment_id}", status_code=204)
async def kill_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    deployment = await get_owned_deployment(deployment_id, db, current_user)
    try:
        await request_deployment_action(
            deployment_id=deployment.id,
            db=db,
            action="terminate",
        )
    except LifecycleConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    await db.commit()

    await track_usage_best_effort(
        db=db,
        user_id=current_user.id,
        event_type="deployment_killed",
        resource_type="deployment",
        resource_id=str(deployment_id),
    )

    logger.info(f"Requested deployment termination: {deployment_id}")


@router.post("", response_model=DeploymentResponse, status_code=201)
async def create_deployment(
    deployment_data: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    """Create a new deployment for an agent."""
    agent = await get_owned_agent(
        deployment_data.agent_id,
        db,
        current_user,
        not_found_detail="Agent not found",
        forbidden_detail="Not authorized to deploy this agent",
    )

    try:
        deployment = await create_deployment_record(
            agent=agent,
            db=db,
            replicas=deployment_data.replicas,
        )
    except LifecycleConflict as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await get_owned_deployment(
        deployment.id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Created deployment {deployment.id} for agent {deployment_data.agent_id}")
    await track_usage_best_effort(
        db=db,
        user_id=current_user.id,
        event_type="deployment_create",
        resource_type="deployment",
        resource_id=str(deployment.id),
        metadata={"replicas": deployment.replicas},
    )

    return _serialize_deployment(deployment)


@router.post("/{deployment_id}/restart", response_model=DeploymentResponse)
async def restart_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    """Restart an existing deployment."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    try:
        await request_deployment_action(
            deployment_id=deployment.id,
            db=db,
            action="restart",
        )
    except LifecycleConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    await db.commit()
    # Re-fetch to ensure events are loaded and attributes are fresh
    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Requested deployment restart: {deployment_id}")

    await track_usage_best_effort(
        db=db,
        user_id=current_user.id,
        event_type="deployment_restarted",
        resource_type="deployment",
        resource_id=str(deployment_id),
    )

    return _serialize_deployment(deployment)


@router.get("/{deployment_id}/logs", response_model=DeploymentLogsHistoryResponse)
async def get_deployment_logs(
    deployment_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
):
    """Get paginated logs for a specific deployment."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    filters = [AgentLog.agent_id == deployment.agent_id]
    if level:
        filters.append(AgentLog.level == level)

    total_stmt = select(func.count()).select_from(AgentLog).where(*filters)
    total = (await db.execute(total_stmt)).scalar_one()

    query = (
        select(AgentLog)
        .where(*filters)
        .order_by(AgentLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    logs = result.scalars().all()
    return DeploymentLogsHistoryResponse(
        deployment_id=deployment.id,
        items=logs,
        total=total,
        skip=skip,
        limit=limit,
        has_more=total > skip + len(logs),
        level=level,
    )


@router.get("/{deployment_id}/metrics", response_model=DeploymentMetricsHistoryResponse)
async def get_deployment_metrics(
    deployment_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
):
    """Get paginated metrics for a specific deployment."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    filters = [AgentMetric.agent_id == deployment.agent_id]

    total_stmt = select(func.count()).select_from(AgentMetric).where(*filters)
    total = (await db.execute(total_stmt)).scalar_one()

    query = (
        select(AgentMetric)
        .where(*filters)
        .offset(skip)
        .limit(limit)
        .order_by(AgentMetric.timestamp.desc())
    )

    result = await db.execute(query)
    metrics = result.scalars().all()
    return DeploymentMetricsHistoryResponse(
        deployment_id=deployment.id,
        items=metrics,
        total=total,
        skip=skip,
        limit=limit,
        has_more=total > skip + len(metrics),
    )


@router.get("/{deployment_id}/versions", response_model=DeploymentVersionHistoryResponse)
async def get_deployment_versions(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("VIEWER", "DEVELOPER")),
):
    """Get version history for a specific deployment."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    count_stmt = (
        select(func.count())
        .select_from(DeploymentVersion)
        .where(DeploymentVersion.deployment_id == deployment.id)
    )
    total = (await db.execute(count_stmt)).scalar_one()

    query = (
        select(DeploymentVersion)
        .where(DeploymentVersion.deployment_id == deployment.id)
        .order_by(DeploymentVersion.created_at.desc())
    )

    result = await db.execute(query)
    versions = result.scalars().all()

    return DeploymentVersionHistoryResponse(
        deployment_id=deployment.id,
        items=versions,
        total=total,
        has_more=False,
    )


@router.post("/{deployment_id}/rollback", response_model=DeploymentResponse)
async def rollback_deployment(
    deployment_id: uuid.UUID,
    rollback_data: DeploymentRollbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("DEVELOPER")),
):
    """Rollback a deployment to a specific version."""
    deployment = await get_owned_deployment(deployment_id, db, current_user)

    try:
        await request_deployment_action(
            deployment_id=deployment.id,
            db=db,
            action="rollback",
            rollback_version=rollback_data.version,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except LifecycleConflict as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await db.commit()

    deployment = await get_owned_deployment(
        deployment_id,
        db,
        current_user,
        include_events=True,
    )
    logger.info(f"Rolled back deployment {deployment_id} to version {rollback_data.version}")
    return _serialize_deployment(deployment)
