"""
Faramesh supervision API routes for production agent deployment.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.faramesh_supervisor import get_faramesh_supervisor

router = APIRouter(prefix="/runtime/governance/supervised", tags=["governance"])


class SupervisedAgentStartRequest(BaseModel):
    agent_id: str
    command: list[str]
    env: Optional[dict[str, str]] = {}
    faramesh_policy: Optional[str] = None


class SupervisedAgentStopRequest(BaseModel):
    timeout: Optional[float] = 10.0


@router.get("/")
async def list_supervised_agents(
    current_user: User = Depends(get_current_user),
):
    """List all supervised agents."""
    supervisor = get_faramesh_supervisor()
    return supervisor.list_agents()


@router.get("/{agent_id}")
async def get_supervised_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get status of a supervised agent."""
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
    supervisor = get_faramesh_supervisor()

    success = await supervisor.start_agent(
        agent_id=request.agent_id,
        command=request.command,
        env=request.env,
        faramesh_policy=request.faramesh_policy,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to start agent")

    status = supervisor.get_agent_status(request.agent_id)
    return status


@router.post("/{agent_id}/stop")
async def stop_supervised_agent(
    agent_id: str,
    request: SupervisedAgentStopRequest,
    current_user: User = Depends(get_current_user),
):
    """Stop a supervised agent."""
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
    supervisor = get_faramesh_supervisor()

    success = await supervisor.restart_agent(agent_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to restart agent")

    status = supervisor.get_agent_status(agent_id)
    return status
