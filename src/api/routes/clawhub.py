import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_agent
from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import AgentLog, User
from src.api.models.schemas import AssistantSkillResponse, ClawHubSkillBundleResponse
from src.api.services.assistant_control_plane import (
    install_skill_bundle,
    list_assistant_skills,
    list_skill_bundles,
    list_skill_catalog,
    update_assistant_skills,
)

router = APIRouter(prefix="/clawhub", tags=["clawhub"])


class InstallSkillRequest(BaseModel):
    agent_id: uuid.UUID
    skill_id: str


class InstallSkillBundleRequest(BaseModel):
    agent_id: uuid.UUID
    bundle_id: str


@router.get("/skills", response_model=list[AssistantSkillResponse])
async def list_available_skills():
    """Returns the current MUTX skill catalog, including bundled Orchestra Research imports."""
    return [
        AssistantSkillResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            author=item.author,
            category=item.category,
            source=item.source,
            is_official=item.is_official,
            installed=False,
            tags=list(item.tags),
            path=item.path,
            canonical_name=item.canonical_name,
            upstream_path=item.upstream_path,
            upstream_repo=item.upstream_repo,
            upstream_commit=item.upstream_commit,
            license=item.license,
            available=item.available,
        )
        for item in list_skill_catalog()
    ]


@router.get("/bundles", response_model=list[ClawHubSkillBundleResponse])
async def list_available_skill_bundles():
    """Returns curated skill bundles for shipping common Orchestra Research stacks."""
    return [ClawHubSkillBundleResponse(**item) for item in list_skill_bundles()]


@router.post("/install")
async def install_skill(
    request: InstallSkillRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Installs a skill to an agent's configuration."""
    agent = await get_owned_agent(request.agent_id, db, current_user)
    try:
        update_assistant_skills(agent, skill_id=request.skill_id, install=True)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown skill: {request.skill_id}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    log = AgentLog(
        agent_id=agent.id,
        level="info",
        message=f"[ClawHub] Installation requested for skill: {request.skill_id}",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()

    return {"status": "installation_initiated", "skill_id": request.skill_id}


@router.post("/install-bundle")
async def install_bundle(
    request: InstallSkillBundleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Installs all currently available skills from a curated bundle."""
    agent = await get_owned_agent(request.agent_id, db, current_user)
    try:
        result = install_skill_bundle(agent, bundle_id=request.bundle_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown bundle: {request.bundle_id}") from exc

    log = AgentLog(
        agent_id=agent.id,
        level="info",
        message=(
            f"[ClawHub] Bundle installation requested for {request.bundle_id} "
            f"({len(result['installed_skill_ids'])} skills installed, "
            f"{len(result['unavailable_skill_ids'])} unavailable)"
        ),
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()

    return {
        "status": "bundle_installation_initiated",
        "bundle_id": request.bundle_id,
        "installed_skill_ids": result["installed_skill_ids"],
        "unavailable_skill_ids": result["unavailable_skill_ids"],
        "skills": list_assistant_skills(agent),
    }


@router.post("/uninstall")
async def uninstall_skill(
    request: InstallSkillRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Removes a skill from an agent's configuration."""
    agent = await get_owned_agent(request.agent_id, db, current_user)
    update_assistant_skills(agent, skill_id=request.skill_id, install=False)
    log = AgentLog(
        agent_id=agent.id,
        level="info",
        message=f"[ClawHub] Uninstalled skill: {request.skill_id}",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()

    return {"status": "uninstalled", "skill_id": request.skill_id}
