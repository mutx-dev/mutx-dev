import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.models import Agent, AgentLog

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


# --- Mock Data (Representing Trending ClawHub Skills) ---

TRENDING_SKILLS = [
    Skill(
        id="web_search",
        name="Web Search",
        description="Allows the agent to search the live web and synthesize results.",
        author="openclaw-official",
        stars=12400,
        category="Tools",
        is_official=True,
    ),
    Skill(
        id="gmail_integration",
        name="Gmail Reader",
        description="Monitor and respond to emails autonomously.",
        author="steinberger",
        stars=8200,
        category="Communication",
        is_official=False,
    ),
    Skill(
        id="discord_gateway",
        name="Discord Gateway",
        description="Bridge your agent directly into Discord channels.",
        author="openclaw-official",
        stars=5600,
        category="Gateways",
        is_official=True,
    ),
    Skill(
        id="sql_executor",
        name="SQL Executor",
        description="Safe, read-only SQL execution for database analysis.",
        author="data-wiz",
        stars=3100,
        category="Analysis",
        is_official=False,
    ),
    Skill(
        id="market_monitor",
        name="Crypto Monitor",
        description="Track on-chain events and market volatility in real-time.",
        author="block-alpha",
        stars=1500,
        category="Finance",
        is_official=False,
    ),
]

# --- Routes ---


@router.get("/skills", response_model=List[Skill])
async def list_available_skills():
    """Returns the current trending skills from ClawHub."""
    return TRENDING_SKILLS


@router.post("/install")
async def install_skill(request: InstallSkillRequest, db: AsyncSession = Depends(get_db)):
    """Installs a skill to an agent's configuration."""
    result = await db.execute(select(Agent).where(Agent.id == request.agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Simple JSON-based config management for the demo
    import json

    try:
        config = json.loads(agent.config) if agent.config else {}
    except json.JSONDecodeError:
        config = {}

    skills = config.get("skills", [])
    if request.skill_id not in skills:
        skills.append(request.skill_id)
        config["skills"] = skills
        agent.config = json.dumps(config)

        # Log the installation request for the background monitor to pick up
        log = AgentLog(
            agent_id=agent.id,
            level="info",
            message=f"[ClawHub] Installation requested for skill: {request.skill_id}",
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        await db.commit()

    return {"status": "installation_initiated", "skill_id": request.skill_id}


@router.post("/uninstall")
async def uninstall_skill(request: InstallSkillRequest, db: AsyncSession = Depends(get_db)):
    """Removes a skill from an agent's configuration."""
    result = await db.execute(select(Agent).where(Agent.id == request.agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    import json

    try:
        config = json.loads(agent.config) if agent.config else {}
    except json.JSONDecodeError:
        config = {}

    skills = config.get("skills", [])
    if request.skill_id in skills:
        skills.remove(request.skill_id)
        config["skills"] = skills
        agent.config = json.dumps(config)

        log = AgentLog(
            agent_id=agent.id,
            level="info",
            message=f"[ClawHub] Uninstalled skill: {request.skill_id}",
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        await db.commit()

    return {"status": "uninstalled", "skill_id": request.skill_id}
