from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.models import Agent, Deployment, User


async def get_owned_agent(
    agent_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
    *,
    not_found_detail: str = "Agent not found",
    forbidden_detail: str = "Not authorized to access this agent",
    include_deployments: bool = False,
    include_deployment_events: bool = False,
) -> Agent:
    query = select(Agent).where(Agent.id == agent_id)
    if include_deployments:
        deployment_loader = selectinload(Agent.deployments)
        if include_deployment_events:
            deployment_loader = deployment_loader.selectinload(Deployment.events)
        query = query.options(deployment_loader)

    result = await db.execute(query)
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail=not_found_detail)
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail=forbidden_detail)
    return agent


async def get_owned_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
    *,
    not_found_detail: str = "Deployment not found",
    forbidden_detail: str = "Not authorized to access this deployment",
    include_events: bool = False,
) -> Deployment:
    query = select(Deployment).where(Deployment.id == deployment_id)
    if include_events:
        query = query.options(selectinload(Deployment.events))

    result = await db.execute(query)
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail=not_found_detail)

    await get_owned_agent(
        deployment.agent_id,
        db,
        current_user,
        not_found_detail=not_found_detail,
        forbidden_detail=forbidden_detail,
    )

    return deployment
