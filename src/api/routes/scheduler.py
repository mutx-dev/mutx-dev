"""Scheduler API routes."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.api.middleware.auth import get_current_user
from src.api.models import User

router = APIRouter(prefix="/scheduler", tags=["scheduler"])
logger = logging.getLogger(__name__)


class SchedulerTask(BaseModel):
    id: str
    name: str
    enabled: bool
    schedule: str | None = None
    last_run: int | None = None
    next_run: int | None = None


# Placeholder - integrate with actual scheduler implementation
def get_scheduler_status() -> list[SchedulerTask]:
    """Get current scheduler status."""
    # TODO: Integrate with actual scheduler (e.g., APScheduler)
    return []


async def trigger_task(task_id: str) -> dict[str, Any]:
    """Manually trigger a scheduled task."""
    # TODO: Implement actual task triggering
    return {"ok": True, "task_id": task_id}


@router.get("", response_model=dict)
async def get_scheduler(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get scheduler status."""
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    tasks = get_scheduler_status()
    return {"tasks": tasks}


class TriggerTaskRequest(BaseModel):
    task_id: str


@router.post("")
async def trigger_scheduled_task(
    request: TriggerTaskRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Manually trigger a scheduled task."""
    # Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    allowed_task_ids = {task.id for task in get_scheduler_status()}

    if not request.task_id or request.task_id not in allowed_task_ids:
        raise HTTPException(
            status_code=400,
            detail=f"task_id required: {', '.join(allowed_task_ids)}",
        )

    result = await trigger_task(request.task_id)
    status_code = 200 if result.get("ok") else 500
    return result
