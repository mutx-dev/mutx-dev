"""Scheduler API routes - Currently unmounted, planned for v1.3."""

import logging

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


@router.get("", response_model=dict)
async def get_scheduler(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get scheduler status - Not yet implemented."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    raise HTTPException(
        status_code=503,
        detail="Scheduler is not yet implemented. This feature is planned for v1.3.",
        headers={"X-Feature-Flag": "scheduler", "X-Available-In": "v1.3"},
    )


class TriggerTaskRequest(BaseModel):
    task_id: str


@router.post("")
async def trigger_scheduled_task(
    request: TriggerTaskRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Manually trigger a scheduled task - Not yet implemented."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    raise HTTPException(
        status_code=503,
        detail="Scheduler is not yet implemented. This feature is planned for v1.3.",
        headers={"X-Feature-Flag": "scheduler", "X-Available-In": "v1.3"},
    )
