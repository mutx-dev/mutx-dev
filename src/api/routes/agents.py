from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
import logging
from typing import Optional, Any
import uuid
import json

from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_agent
from src.api.database import get_db
from src.api.models import (
    Agent,
    Deployment,
    AgentLog,
    AgentMetric,
    AgentStatus,
    User,
    AgentType,
    DeploymentEvent as DeploymentEventModel,
)
from src.api.models.schemas import (
    AgentCreate,
    AgentResponse,
    AgentDetailResponse,
    AgentLogResponse,
    AgentMetricResponse,
    OpenAIAgentConfig,
    AnthropicAgentConfig,
    LangChainAgentConfig,
    CustomAgentConfig,
)
from src.api.middleware.auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)


def _validate_agent_config(agent_type: AgentType, config: Any) -> str:
    """Validate and normalize agent configuration based on its type."""
    if config is None:
        return "{}"

    # If it's already a string, try to parse it first to ensure it's valid JSON
    if isinstance(config, str):
        try:
            config_dict = json.loads(config)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in agent configuration")
    else:
        config_dict = config

    try:
        if agent_type == AgentType.OPENAI:
            validated = OpenAIAgentConfig(**config_dict)
        elif agent_type == AgentType.ANTHROPIC:
            validated = AnthropicAgentConfig(**config_dict)
        elif agent_type == AgentType.LANGCHAIN:
            validated = LangChainAgentConfig(**config_dict)
        elif agent_type == AgentType.CUSTOM:
            validated = CustomAgentConfig(**config_dict)
        else:
            # Fallback for future types not yet fully schema-guarded
            return json.dumps(config_dict)

        return validated.model_dump_json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Configuration validation failed: {str(e)}")


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


def _serialize_agent(agent: Agent, include_deployments: bool = False):
    config_dict = None
    if agent.config:
        try:
            config_dict = (
                json.loads(agent.config) if isinstance(agent.config, str) else agent.config
            )
        except json.JSONDecodeError:
            config_dict = {"raw_config": agent.config}

    payload = {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "status": agent.status,
        "config": config_dict,
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
    # Validate and normalize config based on agent type
    config_json = _validate_agent_config(agent_data.type, agent_data.config)

    # Use current_user.id for ownership, not from request body
    agent = Agent(
        name=agent_data.name,
        description=agent_data.description,
        type=agent_data.type,
        config=config_json,
        user_id=current_user.id,
        status=AgentStatus.CREATING.value,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    logger.info(f"Created agent: {agent.id}")
    return _serialize_agent(agent)


@router.get("", response_model=list[AgentResponse])
async def list_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Agent).order_by(Agent.created_at.desc()).offset(skip).limit(limit)
    # Ownership is always derived from authenticated session, never query params.
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
    await db.flush()  # Get deployment.id

    # Record deploy event
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

        # Record stop event
        stop_event = DeploymentEventModel(
            deployment_id=deployment.id,
            event_type="stop",
            status="stopped",
        )
        db.add(stop_event)

    agent.status = AgentStatus.STOPPED.value
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
