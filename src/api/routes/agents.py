from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
import logging
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.database import get_db
from src.api.models import Agent, Deployment, AgentLog, AgentMetric, AgentStatus, User
from src.api.models.schemas import (
    AgentCreate,
    AgentResponse,
    AgentDetailResponse,
    AgentLogResponse,
    AgentMetricResponse,
)
from src.api.middleware.auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)


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
    }


def _serialize_agent(agent: Agent, include_deployments: bool = False):
    payload = {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "status": agent.status,
        "config": agent.config,
        "created_at": agent.created_at,
        "updated_at": agent.updated_at,
        "user_id": agent.user_id,
    }

    if include_deployments:
        payload["deployments"] = [
            _serialize_deployment(deployment)
            for deployment in agent.deployments
        ]

    return payload


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Use current_user.id for ownership, not from request body
    agent = Agent(
        name=agent_data.name,
        description=agent_data.description,
        config=agent_data.config,
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
    user_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Agent).order_by(Agent.created_at.desc()).offset(skip).limit(limit)
    # Filter by current user by default, unless explicitly requesting another user's agents
    if user_id:
        if user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot view other users' agents")
        query = query.where(Agent.user_id == user_id)
    else:
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
    result = await db.execute(
        select(Agent)
        .options(selectinload(Agent.deployments))
        .where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Ownership check
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this agent")
    return _serialize_agent(agent, include_deployments=True)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Ownership check
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this agent")
    
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
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Ownership check
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to deploy this agent")
    
    deployment = Deployment(
        agent_id=agent_id,
        status="deploying",
        replicas=1,
        started_at=datetime.utcnow(),
    )
    db.add(deployment)
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
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Ownership check
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to stop this agent")
    
    result = await db.execute(
        select(Deployment).where(
            Deployment.agent_id == agent_id,
            Deployment.status.in_(["running", "deploying"])
        )
    )
    deployments = result.scalars().all()
    for deployment in deployments:
        deployment.status = "stopped"
        deployment.ended_at = datetime.utcnow()
    
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
    # Ownership check - verify agent belongs to current user
    agent_result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this agent's logs")
    
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
    # Ownership check - verify agent belongs to current user
    agent_result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this agent's metrics")
    
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
