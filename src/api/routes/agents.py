import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_agent
from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import (
    UsageEvent,
    Agent,
    AgentLog,
    AgentMetric,
    AgentStatus,
    AgentType,
    Deployment,
    DeploymentEvent as DeploymentEventModel,
    AgentVersion,
    User,
)
from src.api.services.usage import track_usage
from src.api.models.schemas import (
    AgentConfigBase,
    AgentConfigResponse,
    AgentConfigUpdateRequest,
    AgentCreate,
    AgentDetailResponse,
    AgentLogResponse,
    AgentMetricResponse,
    AgentResponse,
    AgentVersionResponse,
    AgentVersionHistoryResponse,
    AgentRollbackRequest,
    AnthropicAgentConfig,
    CustomAgentConfig,
    LangChainAgentConfig,
    OpenAIAgentConfig,
)

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)


AGENT_CONFIG_MODEL_MAP: dict[AgentType, type[AgentConfigBase]] = {
    AgentType.OPENAI: OpenAIAgentConfig,
    AgentType.ANTHROPIC: AnthropicAgentConfig,
    AgentType.LANGCHAIN: LangChainAgentConfig,
    AgentType.CUSTOM: CustomAgentConfig,
}


def _parse_agent_config_payload(config: Any) -> dict[str, Any]:
    if config is None:
        return {}

    if isinstance(config, BaseModel):
        config_dict = config.model_dump(exclude_none=True)
    elif isinstance(config, str):
        try:
            config_dict = json.loads(config)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=400, detail="Invalid JSON in agent configuration"
            ) from exc
    else:
        config_dict = config

    if not isinstance(config_dict, dict):
        raise HTTPException(status_code=400, detail="Agent configuration must be a JSON object")

    return dict(config_dict)


def _deserialize_agent_config(config: Any) -> dict[str, Any] | None:
    if not config:
        return None

    if isinstance(config, str):
        try:
            config_dict = json.loads(config)
        except json.JSONDecodeError:
            return {"raw_config": config}
    elif isinstance(config, dict):
        config_dict = config
    else:
        return {"raw_config": config}

    if not isinstance(config_dict, dict):
        return {"raw_config": config_dict}

    return config_dict


def _extract_config_version(config: dict[str, Any] | None) -> int:
    if not isinstance(config, dict):
        return 1

    version = config.get("version")
    if isinstance(version, int) and version >= 1:
        return version

    return 1


def _normalize_agent_config_for_response(
    agent_type: AgentType, config: dict[str, Any] | None
) -> dict[str, Any] | None:
    if config is None:
        return None

    config_model = AGENT_CONFIG_MODEL_MAP.get(agent_type)
    if config_model is None:
        return config

    try:
        validated = config_model.model_validate(config)
    except ValidationError:
        return config

    return validated.model_dump(exclude_none=True)


def _validate_agent_config(
    agent_type: AgentType,
    config: Any,
    *,
    version: int | None = None,
    name: str | None = None,
) -> tuple[str, dict[str, Any]]:
    """Validate and normalize agent configuration based on its type."""
    config_dict = _parse_agent_config_payload(config)

    if name and not config_dict.get("name"):
        config_dict["name"] = name
    if version is not None:
        config_dict["version"] = version

    config_model = AGENT_CONFIG_MODEL_MAP.get(agent_type)
    if config_model is None:
        return json.dumps(config_dict), config_dict

    try:
        validated = config_model.model_validate(config_dict)
    except ValidationError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Configuration validation failed: {exc}",
        ) from exc

    normalized = validated.model_dump(exclude_none=True)
    return json.dumps(normalized), normalized


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


def _serialize_agent_config(agent: Agent) -> dict[str, Any]:
    raw_config = _deserialize_agent_config(agent.config)
    normalized_config = _normalize_agent_config_for_response(agent.type, raw_config or {}) or {}
    config_version = _extract_config_version(normalized_config)

    return {
        "agent_id": agent.id,
        "type": agent.type,
        "config": normalized_config,
        "config_version": config_version,
        "updated_at": agent.updated_at,
    }


def _create_agent_version(agent: Agent, db: AsyncSession) -> AgentVersion:
    """Create a new version entry for the agent config."""
    config_snapshot = agent.config
    version = AgentVersion(
        agent_id=agent.id,
        version=_extract_config_version(_deserialize_agent_config(config_snapshot)),
        config_snapshot=config_snapshot,
        status="current",
    )
    db.add(version)
    return version


def _serialize_agent(agent: Agent, include_deployments: bool = False):
    raw_config = _deserialize_agent_config(agent.config)
    config_dict = _normalize_agent_config_for_response(agent.type, raw_config)
    config_version = _extract_config_version(config_dict)

    payload = {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "type": agent.type,
        "status": agent.status,
        "config": config_dict,
        "config_version": config_version,
        "created_at": agent.created_at,
        "updated_at": agent.updated_at,
        "user_id": agent.user_id,
    }

    if include_deployments:
        payload["deployments"] = [
            _serialize_deployment(deployment) for deployment in agent.deployments
        ]

    return payload


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config_json, _normalized_config = _validate_agent_config(
        agent_data.type,
        agent_data.config,
        version=1,
        name=agent_data.name,
    )

    agent = Agent(
        name=agent_data.name,
        description=agent_data.description,
        type=agent_data.type,
        config=config_json,
        user_id=current_user.id,
        status=AgentStatus.CREATING.value,
    )
    db.add(agent)
    await db.flush()

    # Track usage event
    await track_usage(
        db,
        user_id=current_user.id,
        event_type="agent_create",
        resource_type="agent",
        resource_id=str(agent.id),
        metadata={"agent_type": agent.type.value},
    )

    await db.commit()
    await db.refresh(agent)
    logger.info(f"Created agent: {agent.id}")

    # Track usage event
    usage_event = UsageEvent(
        event_type="agent_created",
        user_id=current_user.id,
        resource_id=str(agent.id),
        resource_type="agent",
        credits_used=1.0,
        event_metadata=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()

    return _serialize_agent(agent)


@router.get("", response_model=list[AgentResponse])
async def list_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ownership enforcement: always filter by authenticated user's ID.
    # Client-supplied user_id query params are ignored - ownership is derived
    # from the auth token via current_user, not from client input.
    query = select(Agent).order_by(Agent.created_at.desc()).offset(skip).limit(limit)
    query = query.where(Agent.user_id == current_user.id)
    result = await db.execute(query)
    agents = result.scalars().all()
    return [_serialize_agent(agent) for agent in agents]


@router.get("/{agent_id}", response_model=AgentDetailResponse)
async def get_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        include_deployments=True,
        include_deployment_events=True,
    )
    return _serialize_agent(agent, include_deployments=True)


@router.get("/{agent_id}/config", response_model=AgentConfigResponse)
async def get_agent_config(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to access this agent config",
    )
    return _serialize_agent_config(agent)


@router.patch("/{agent_id}/config", response_model=AgentConfigResponse)
async def update_agent_config(
    agent_id: uuid.UUID,
    request: AgentConfigUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to update this agent config",
    )
    current_config = _deserialize_agent_config(agent.config)
    current_version = _extract_config_version(current_config)
    
    # Create version snapshot of current config before updating
    _create_agent_version(agent, db)
    
    config_json, _normalized_config = _validate_agent_config(
        agent.type,
        request.config,
        version=current_version + 1,
        name=agent.name,
    )
    agent.config = config_json
    await db.commit()
    await db.refresh(agent)
    logger.info(f"Updated config for agent: {agent_id}")
    return _serialize_agent_config(agent)


@router.get("/{agent_id}/versions", response_model=AgentVersionHistoryResponse)
async def get_agent_versions(
    agent_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get version history for a specific agent."""
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to view this agent",
    )

    query = (
        select(AgentVersion)
        .where(AgentVersion.agent_id == agent.id)
        .order_by(AgentVersion.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    versions = result.scalars().all()

    return {
        "agent_id": agent.id,
        "items": versions,
        "total": len(versions),
    }


@router.post("/{agent_id}/rollback", response_model=AgentConfigResponse)
async def rollback_agent(
    agent_id: uuid.UUID,
    rollback_data: AgentRollbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rollback an agent to a specific version."""
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to rollback this agent",
    )

    # Only allow rollback if agent is not currently running
    if agent.status == AgentStatus.RUNNING.value:
        raise HTTPException(
            status_code=400,
            detail="Cannot rollback agent while it is running. Stop the agent first.",
        )

    target_version_query = select(AgentVersion).where(
        AgentVersion.agent_id == agent.id,
        AgentVersion.version == rollback_data.version,
    )
    result = await db.execute(target_version_query)
    target_version = result.scalar_one_or_none()

    if not target_version:
        raise HTTPException(
            status_code=404,
            detail=f"Version {rollback_data.version} not found for this agent",
        )

    # Mark current versions as rolled back
    old_result = await db.execute(
        select(AgentVersion).where(
            AgentVersion.agent_id == agent.id,
            AgentVersion.status == "current",
        )
    )
    old_versions = old_result.scalars().all()
    for old_v in old_versions:
        old_v.status = "rolled_back"
        old_v.rolled_back_at = datetime.now(timezone.utc)

    # Restore target version
    agent.config = target_version.config_snapshot
    target_version.status = "current"
    target_version.rolled_back_at = None

    await db.commit()
    await db.refresh(agent)
    logger.info(f"Rolled back agent {agent_id} to version {rollback_data.version}")
    return _serialize_agent_config(agent)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to delete this agent",
    )

    agent.status = AgentStatus.DELETING.value
    await db.delete(agent)
    await db.commit()
    logger.info(f"Deleted agent: {agent_id}")


@router.post("/{agent_id}/deploy", response_model=dict)
async def deploy_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to deploy this agent",
    )

    deployment = Deployment(
        agent_id=agent_id,
        status="deploying",
        replicas=1,
        started_at=datetime.now(timezone.utc),
    )
    db.add(deployment)
    await db.flush()

    deploy_event = DeploymentEventModel(
        deployment_id=deployment.id,
        event_type="deploy",
        status="deploying",
    )
    db.add(deploy_event)

    agent.status = AgentStatus.RUNNING.value
    await db.commit()
    await db.refresh(deployment)
    logger.info(f"Deployed agent: {agent_id}, deployment: {deployment.id}")

    # Track usage event
    usage_event = UsageEvent(
        event_type="agent_deployed",
        user_id=current_user.id,
        resource_id=str(agent_id),
        resource_type="agent",
        credits_used=1.0,
        event_metadata=f'{{"deployment_id": "{deployment.id}"}}',
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()

    return {"deployment_id": deployment.id, "status": "deploying"}


@router.post("/{agent_id}/stop", response_model=dict)
async def stop_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to stop this agent",
    )

    result = await db.execute(
        select(Deployment).where(
            Deployment.agent_id == agent_id, Deployment.status.in_(["running", "deploying"])
        )
    )
    deployments = result.scalars().all()
    for deployment in deployments:
        deployment.status = "stopped"
        deployment.ended_at = datetime.now(timezone.utc)

        stop_event = DeploymentEventModel(
            deployment_id=deployment.id,
            event_type="stop",
            status="stopped",
        )
        db.add(stop_event)

    agent.status = AgentStatus.STOPPED.value
    await db.commit()

    # Track usage event
    usage_event = UsageEvent(
        event_type="agent_stopped",
        user_id=current_user.id,
        resource_id=str(agent_id),
        resource_type="agent",
        credits_used=1.0,
        event_metadata=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()

    logger.info(f"Stopped agent: {agent_id}")
    return {"status": "stopped"}


@router.get("/{agent_id}/logs", response_model=list[AgentLogResponse])
async def get_agent_logs(
    agent_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to access this agent's logs",
    )

    query = select(AgentLog).where(AgentLog.agent_id == agent_id).offset(skip).limit(limit)
    if level:
        query = query.where(AgentLog.level == level)
    query = query.order_by(AgentLog.timestamp.desc())
    result = await db.execute(query)
    logs = result.scalars().all()
    return logs


@router.get("/{agent_id}/metrics", response_model=list[AgentMetricResponse])
async def get_agent_metrics(
    agent_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_owned_agent(
        agent_id,
        db,
        current_user,
        forbidden_detail="Not authorized to access this agent's metrics",
    )

    query = (
        select(AgentMetric)
        .where(AgentMetric.agent_id == agent_id)
        .offset(skip)
        .limit(limit)
        .order_by(AgentMetric.timestamp.desc())
    )
    result = await db.execute(query)
    metrics = result.scalars().all()
    return metrics
