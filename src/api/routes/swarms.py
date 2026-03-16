"""
Swarm routes for multi-agent swarm management.
A swarm is a collection of agent deployments that work together.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import Agent, Deployment, User

router = APIRouter(prefix="/swarms", tags=["swarms"])
logger = logging.getLogger(__name__)


# Swarm models (stored in memory for now, could be extended to DB)
class Swarm:
    """In-memory swarm representation."""

    def __init__(
        self,
        id: uuid.UUID,
        name: str,
        description: str,
        agent_ids: list[uuid.UUID],
        user_id: uuid.UUID,
        min_replicas: int = 1,
        max_replicas: int = 10,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.agent_ids = agent_ids
        self.user_id = user_id
        self.min_replicas = min_replicas
        self.max_replicas = max_replicas
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)


# In-memory storage (replace with DB in production)
_swarms: dict[uuid.UUID, Swarm] = {}


# Request/Response schemas
class SwarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    agent_ids: list[uuid.UUID] = Field(..., min_length=1, max_length=20)
    min_replicas: int = Field(default=1, ge=1, le=10)
    max_replicas: int = Field(default=10, ge=1, le=50)


class SwarmUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    min_replicas: Optional[int] = Field(None, ge=1, le=10)
    max_replicas: Optional[int] = Field(None, ge=1, le=50)


class SwarmScale(BaseModel):
    replicas: int = Field(..., ge=1, le=50, description="Target replicas per agent")


class SwarmAgentResponse(BaseModel):
    agent_id: uuid.UUID
    agent_name: str
    status: str
    replicas: int


class SwarmResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    agent_ids: list[uuid.UUID]
    min_replicas: int
    max_replicas: int
    created_at: datetime
    updated_at: datetime
    agents: list[SwarmAgentResponse] = []


class SwarmListResponse(BaseModel):
    items: list[SwarmResponse]
    total: int


async def _serialize_swarm(swarm: Swarm, db: AsyncSession) -> SwarmResponse:
    """Serialize swarm with agent details."""
    agents = []
    for agent_id in swarm.agent_ids:
        agent_result = await db.execute(
            select(Agent).where(Agent.id == agent_id, Agent.user_id == swarm.user_id)
        )
        agent = agent_result.scalar_one_or_none()
        if agent:
            deploy_result = await db.execute(
                select(Deployment).where(
                    Deployment.agent_id == agent_id,
                    Deployment.status.in_(["running", "ready", "deploying"]),
                )
            )
            deployment = deploy_result.scalar_one_or_none()
            agents.append(
                SwarmAgentResponse(
                    agent_id=agent.id,
                    agent_name=agent.name,
                    status=agent.status,
                    replicas=deployment.replicas if deployment else 0,
                )
            )

    return SwarmResponse(
        id=swarm.id,
        name=swarm.name,
        description=swarm.description,
        agent_ids=swarm.agent_ids,
        min_replicas=swarm.min_replicas,
        max_replicas=swarm.max_replicas,
        created_at=swarm.created_at,
        updated_at=swarm.updated_at,
        agents=agents,
    )


@router.get("", response_model=SwarmListResponse)
async def list_swarms(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all swarms for the current user."""
    user_swarms = [s for s in _swarms.values() if s.user_id == current_user.id]
    total = len(user_swarms)
    paginated = user_swarms[skip : skip + limit]
    return SwarmListResponse(
        items=[await _serialize_swarm(s, db) for s in paginated],
        total=total,
    )


@router.post("", response_model=SwarmResponse, status_code=201)
async def create_swarm(
    swarm_data: SwarmCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new swarm."""
    for agent_id in swarm_data.agent_ids:
        agent_result = await db.execute(
            select(Agent).where(Agent.id == agent_id, Agent.user_id == current_user.id)
        )
        agent = agent_result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=400, detail=f"Agent {agent_id} not found or not owned by user"
            )

    swarm = Swarm(
        id=uuid.uuid4(),
        name=swarm_data.name,
        description=swarm_data.description or "",
        agent_ids=swarm_data.agent_ids,
        user_id=current_user.id,
        min_replicas=swarm_data.min_replicas,
        max_replicas=swarm_data.max_replicas,
    )
    _swarms[swarm.id] = swarm
    logger.info(f"Created swarm: {swarm.id}")
    return await _serialize_swarm(swarm, db)


@router.get("/{swarm_id}", response_model=SwarmResponse)
async def get_swarm(
    swarm_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get swarm details."""
    swarm = _swarms.get(swarm_id)
    if not swarm or swarm.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Swarm not found")
    return await _serialize_swarm(swarm, db)


@router.post("/{swarm_id}/scale", response_model=SwarmResponse)
async def scale_swarm(
    swarm_id: uuid.UUID,
    scale_data: SwarmScale,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scale all agents in a swarm to the specified replicas."""
    swarm = _swarms.get(swarm_id)
    if not swarm or swarm.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Swarm not found")

    if scale_data.replicas < swarm.min_replicas or scale_data.replicas > swarm.max_replicas:
        raise HTTPException(
            status_code=400,
            detail=f"Replicas must be between {swarm.min_replicas} and {swarm.max_replicas}",
        )

    for agent_id in swarm.agent_ids:
        deploy_result = await db.execute(
            select(Deployment).where(
                Deployment.agent_id == agent_id, Deployment.status.in_(["running", "ready"])
            )
        )
        deployment = deploy_result.scalar_one_or_none()
        if deployment:
            deployment.replicas = scale_data.replicas

    await db.commit()
    swarm.updated_at = datetime.now(timezone.utc)
    logger.info(f"Scaled swarm {swarm_id} to {scale_data.replicas} replicas")
    return await _serialize_swarm(swarm, db)
