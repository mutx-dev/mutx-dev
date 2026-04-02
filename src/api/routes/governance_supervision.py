"""
Faramesh supervision API routes for production agent deployment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from src.api.config import get_settings
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.faramesh_supervisor import (
    SupervisionValidationError,
    get_faramesh_supervisor,
)

router = APIRouter(prefix="/runtime/governance/supervised", tags=["governance"])


class SupervisedAgentStartRequest(BaseModel):
    agent_id: str
    command: list[str]
    profile: Optional[str] = None
    env: dict[str, str] = Field(default_factory=dict)
    faramesh_policy: Optional[str] = None


class SupervisedAgentStopRequest(BaseModel):
    timeout: Optional[float] = 10.0


class SupervisedLaunchProfileResponse(BaseModel):
    name: str
    command: list[str]
    env_keys: list[str] = Field(default_factory=list)
    faramesh_policy: Optional[str] = None


def _assert_internal_user(current_user: User) -> None:
    """Restrict supervision operations to verified internal users."""
    if not current_user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    settings = get_settings()
    allowed_domains = {
        domain.strip().lower()
        for domain in settings.internal_user_email_domains
        if domain and domain.strip()
    }

    user_domain = current_user.email.rsplit("@", 1)[-1].lower() if "@" in current_user.email else ""
    if user_domain not in allowed_domains:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.get("/")
async def list_supervised_agents(
    current_user: User = Depends(get_current_user),
):
    """List all supervised agents."""
    _assert_internal_user(current_user)
    supervisor = get_faramesh_supervisor()
    return supervisor.list_agents()


@router.get("/profiles", response_model=list[SupervisedLaunchProfileResponse])
async def list_supervised_launch_profiles(
    current_user: User = Depends(get_current_user),
):
    """List configured launch profiles for supervised agents."""
    supervisor = get_faramesh_supervisor()
    return [
        SupervisedLaunchProfileResponse(
            name=profile["name"],
            command=profile["command"],
            env_keys=profile["env_keys"],
            faramesh_policy=profile.get("faramesh_policy"),
        )
        for profile in supervisor.list_profiles()
    ]


@router.get("/{agent_id}")
async def get_supervised_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get status of a supervised agent."""
    _assert_internal_user(current_user)
    supervisor = get_faramesh_supervisor()
    status = supervisor.get_agent_status(agent_id)

    if not status:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    return status


@router.post("/start")
async def start_supervised_agent(
    request: SupervisedAgentStartRequest,
    current_user: User = Depends(get_current_user),
):
    """Start an agent under Faramesh supervision."""
    _assert_internal_user(current_user)
    supervisor = get_faramesh_supervisor()
    try:
        prepared = supervisor.prepare_launch_request(
            request.agent_id,
            command=request.command,
            env=request.env,
            faramesh_policy=request.faramesh_policy,
            profile_name=request.profile,
        )
    except SupervisionValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    success = await supervisor.start_prepared_agent(prepared)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to start agent")

    status = supervisor.get_agent_status(prepared.agent_id)
    return status


@router.post("/{agent_id}/stop")
async def stop_supervised_agent(
    agent_id: str,
    request: SupervisedAgentStopRequest,
    current_user: User = Depends(get_current_user),
):
    """Stop a supervised agent."""
    _assert_internal_user(current_user)
    supervisor = get_faramesh_supervisor()

    success = await supervisor.stop_agent(agent_id, timeout=request.timeout)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to stop agent")

    return {"status": "stopped", "agent_id": agent_id}


@router.post("/{agent_id}/restart")
async def restart_supervised_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
):
    """Restart a supervised agent."""
    _assert_internal_user(current_user)
    supervisor = get_faramesh_supervisor()

    success = await supervisor.restart_agent(agent_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to restart agent")

    status = supervisor.get_agent_status(agent_id)
    return status
