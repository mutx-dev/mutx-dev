import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_agent
from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import AgentLog, User
from src.api.services.assistant_control_plane import list_skill_catalog, update_assistant_skills

router = APIRouter(prefix="/clawhub", tags=["clawhub"])

# --- Schemas ---


class Skill(BaseModel):
    id: str
    name: str
    description: str
    author: str
    stars: int
    category: str
    is_official: bool = False


class InstallSkillRequest(BaseModel):
    agent_id: uuid.UUID
    skill_id: str


@router.get("/skills", response_model=List[Skill])
async def list_available_skills():
    """Returns the current MUTX/OpenClaw skill catalog."""
    return [
        Skill(
            id=item.id,
            name=item.name,
            description=item.description,
            author=item.author,
            stars=10_000 if item.is_official else 2_500,
            category=item.category,
            is_official=item.is_official,
        )
        for item in list_skill_catalog()
    ]


@router.post("/install")
async def install_skill(
    request: InstallSkillRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Installs a skill to an agent's configuration."""
    agent = await get_owned_agent(request.agent_id, db, current_user)
    update_assistant_skills(agent, skill_id=request.skill_id, install=True)
    log = AgentLog(
        agent_id=agent.id,
        level="info",
        message=f"[ClawHub] Installation requested for skill: {request.skill_id}",
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()

    return {"status": "installation_initiated", "skill_id": request.skill_id}


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
