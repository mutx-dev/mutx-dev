from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_deployment
from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import Agent, AgentStatus, AgentType, User
from src.api.models.schemas import (
    AssistantTemplateResponse,
    StarterDeploymentCreate,
    StarterDeploymentResponse,
)
from src.api.routes.agents import _serialize_agent
from src.api.routes.deployments import _serialize_deployment
from src.api.services.assistant_control_plane import (
    DEFAULT_TEMPLATE_ID,
    assistant_template_catalog,
    build_personal_assistant_config,
    serialize_config,
)
from src.api.services.deployment_lifecycle import create_deployment_record
from src.api.services.usage import track_usage_best_effort

router = APIRouter(prefix="/templates", tags=["templates"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[AssistantTemplateResponse])
async def list_templates():
    return assistant_template_catalog()


@router.post("/{template_id}/deploy", response_model=StarterDeploymentResponse, status_code=201)
async def deploy_template(
    template_id: str,
    request: StarterDeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if template_id != DEFAULT_TEMPLATE_ID:
        raise HTTPException(status_code=404, detail="Starter template not found")

    config = build_personal_assistant_config(
        name=request.name,
        description=request.description,
        model=request.model,
        workspace=request.workspace,
        assistant_id=request.assistant_id,
        skills=request.skills,
        channels={key: value.model_dump(exclude_none=True) for key, value in request.channels.items()},
        runtime_metadata=request.runtime_metadata,
    )

    agent = Agent(
        name=request.name,
        description=request.description,
        type=AgentType.OPENCLAW,
        config=serialize_config(config),
        user_id=current_user.id,
        status=AgentStatus.CREATING.value,
    )
    db.add(agent)
    await db.flush()

    deployment = await create_deployment_record(
        agent=agent,
        db=db,
        replicas=request.replicas,
        event_type="starter.create",
    )

    await db.commit()
    await db.refresh(agent)
    deployment = await get_owned_deployment(
        deployment.id,
        db,
        current_user,
        include_events=True,
    )

    await track_usage_best_effort(
        db=db,
        user_id=current_user.id,
        event_type="starter_deployment_create",
        resource_type="deployment",
        resource_id=str(deployment.id),
        metadata={"template_id": template_id, "agent_type": AgentType.OPENCLAW.value},
    )
    logger.info("Created starter deployment %s for user %s", deployment.id, current_user.id)

    return {
        "template_id": template_id,
        "agent": _serialize_agent(agent),
        "deployment": _serialize_deployment(deployment),
    }
