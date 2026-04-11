"""Scheduler API routes — asyncio-based task scheduler."""

from __future__ import annotations

import asyncio
import croniter
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.middleware.auth import get_current_user
from src.api.models import User

router = APIRouter(prefix="/scheduler", tags=["scheduler"])
logger = logging.getLogger(__name__)

# --- In-memory task store ---
_task_store: dict[str, dict[str, Any]] = {}
_scheduler_lock = asyncio.Lock()
_scheduler_running = False
_scheduler_task: asyncio.Task | None = None


# --- Pydantic Schemas ---


class SchedulerTaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    enabled: bool = True
    schedule: Optional[str] = Field(
        None, max_length=255, description="Cron expression, e.g. '*/5 * * * *'"
    )
    interval_seconds: Optional[int] = Field(
        None, ge=1, le=604800, description="Interval in seconds (alternative to cron)"
    )
    task_type: str = Field(default="log", description="Task type: log, webhook, agent_heartbeat")
    payload: dict[str, Any] = Field(default_factory=dict)


class SchedulerTaskUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    enabled: Optional[bool] = None
    schedule: Optional[str] = Field(None, max_length=255)
    interval_seconds: Optional[int] = Field(None, ge=1, le=604800)
    task_type: Optional[str] = None
    payload: Optional[dict[str, Any]] = None


class SchedulerTaskResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    enabled: bool
    schedule: Optional[str]
    interval_seconds: Optional[int]
    task_type: str
    payload: dict[str, Any]
    last_run: Optional[int]
    next_run: Optional[int]
    run_count: int
    created_at: int
    updated_at: int


class TriggerTaskRequest(BaseModel):
    task_id: str


class TriggerTaskResponse(BaseModel):
    task_id: str
    triggered_at: int
    execution_id: str


# --- Scheduler engine ---


def _parse_schedule_next(task: dict[str, Any]) -> datetime | None:
    """Calculate the next scheduled run from cron expression or interval."""
    interval_seconds = task.get("interval_seconds")
    if interval_seconds:
        base_timestamp = task.get("last_run") or task.get("created_at")
        base = (
            datetime.fromtimestamp(base_timestamp, tz=timezone.utc)
            if base_timestamp
            else datetime.now(tz=timezone.utc)
        )
        return (base + timedelta(seconds=int(interval_seconds))).replace(microsecond=0)

    schedule = task.get("schedule")
    if not schedule:
        return None

    base_timestamp = task.get("last_run") or task.get("created_at")
    base = (
        datetime.fromtimestamp(base_timestamp, tz=timezone.utc)
        if base_timestamp
        else datetime.now(tz=timezone.utc)
    )

    try:
        cron = croniter.croniter(schedule, base)
        return cron.get_next(datetime)
    except (croniter.CroniterBadCronError, ValueError):
        return None


async def _execute_task(task: dict[str, Any]) -> None:
    """Execute a single scheduled task."""
    task_type = task.get("task_type", "log")
    payload = task.get("payload", {})
    task_id = task["id"]

    logger.info(f"[scheduler] Executing task {task_id} ({task_type})")

    try:
        if task_type == "webhook":
            url = payload.get("url")
            if not url:
                logger.warning(f"[scheduler] Webhook task {task_id} has no URL in payload")
                return
            try:
                import aiohttp

                method = payload.get("method", "POST").upper()
                headers = payload.get("headers", {})
                body = payload.get("body", {})
                async with aiohttp.ClientSession() as session:
                    async with session.request(
                        method,
                        url,
                        json=body,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=10),
                    ) as resp:
                        logger.info(f"[scheduler] Webhook task {task_id} → {resp.status}")
            except ImportError:
                logger.warning(
                    f"[scheduler] aiohttp not installed, skipping webhook task {task_id}"
                )
            except Exception as exc:
                logger.warning(f"[scheduler] Webhook task {task_id} failed: {exc}")

        elif task_type == "agent_heartbeat":
            agent_id = payload.get("agent_id")
            if agent_id:
                try:
                    from src.api.services.agent_runtime import AgentRuntimeService

                    svc = AgentRuntimeService.get_instance()
                    if svc:
                        await svc.send_agent_heartbeat(uuid.UUID(agent_id))
                        logger.info(f"[scheduler] Heartbeat sent for agent {agent_id}")
                except Exception as exc:
                    logger.warning(f"[scheduler] Could not send heartbeat for {agent_id}: {exc}")

        else:
            # Default: log
            logger.info(f"[scheduler] Log task {task_id}: {payload.get('message', '')}")

    except Exception as exc:
        logger.exception(f"[scheduler] Task {task_id} raised: {exc}")


async def _scheduler_loop() -> None:
    """Background loop that ticks every 10 seconds and fires due tasks."""
    global _scheduler_running
    while _scheduler_running:
        try:
            now = datetime.now(tz=timezone.utc)
            now_ts = int(now.timestamp())

            async with _scheduler_lock:
                for task_id, task in list(_task_store.items()):
                    if not task.get("enabled", False):
                        continue

                    next_run = _parse_schedule_next(task)
                    if next_run is None:
                        continue
                    next_run_ts = int(next_run.timestamp())

                    if now_ts >= next_run_ts:
                        task["last_run"] = now_ts
                        task["run_count"] = task.get("run_count", 0) + 1
                        upcoming_run = _parse_schedule_next(task)
                        task["next_run"] = int(upcoming_run.timestamp()) if upcoming_run else None
                        # Fire in background
                        asyncio.create_task(_execute_task(task))

        except Exception as exc:
            logger.exception(f"[scheduler] Loop error: {exc}")

        await asyncio.sleep(10)


def _ensure_scheduler_running() -> None:
    global _scheduler_task, _scheduler_running
    if not _scheduler_running:
        _scheduler_running = True
        _scheduler_task = asyncio.create_task(_scheduler_loop())
        logger.info("[scheduler] Background scheduler loop started")


def _serialize_task(task: dict[str, Any]) -> SchedulerTaskResponse:
    next_run = None
    if task.get("enabled"):
        nr = _parse_schedule_next(task)
        next_run = int(nr.timestamp()) if nr else None
    return SchedulerTaskResponse(
        id=task["id"],
        name=task["name"],
        description=task.get("description"),
        enabled=task.get("enabled", True),
        schedule=task.get("schedule"),
        interval_seconds=task.get("interval_seconds"),
        task_type=task.get("task_type", "log"),
        payload=task.get("payload", {}),
        last_run=task.get("last_run"),
        next_run=next_run,
        run_count=task.get("run_count", 0),
        created_at=task.get("created_at", 0),
        updated_at=task.get("updated_at", 0),
    )


# --- Routes ---


@router.get("", response_model=dict)
async def get_scheduler(
    current_user: User = Depends(get_current_user),
) -> dict:
    """List all scheduled tasks for the admin user."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    _ensure_scheduler_running()

    async with _scheduler_lock:
        tasks = [_serialize_task(t).model_dump() for t in _task_store.values()]

    return {"tasks": tasks, "total": len(tasks)}


@router.post("", response_model=SchedulerTaskResponse, status_code=201)
async def create_scheduled_task(
    task_data: SchedulerTaskCreate,
    current_user: User = Depends(get_current_user),
) -> SchedulerTaskResponse:
    """Create a new scheduled task."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    if task_data.schedule:
        try:
            croniter.croniter(task_data.schedule, datetime.now(tz=timezone.utc))
        except (croniter.CroniterBadCronError, ValueError) as exc:
            raise HTTPException(status_code=400, detail=f"Invalid cron expression: {exc}") from exc

    if not task_data.schedule and not task_data.interval_seconds:
        raise HTTPException(
            status_code=400,
            detail="Either 'schedule' (cron expression) or 'interval_seconds' is required",
        )

    now_ts = int(datetime.now(tz=timezone.utc).timestamp())
    task_id = str(uuid.uuid4())

    task: dict[str, Any] = {
        "id": task_id,
        "name": task_data.name,
        "description": task_data.description,
        "enabled": task_data.enabled,
        "schedule": task_data.schedule,
        "interval_seconds": task_data.interval_seconds,
        "task_type": task_data.task_type,
        "payload": task_data.payload,
        "last_run": None,
        "next_run": None,
        "run_count": 0,
        "created_at": now_ts,
        "updated_at": now_ts,
    }
    next_run = _parse_schedule_next(task)
    task["next_run"] = int(next_run.timestamp()) if next_run else None

    async with _scheduler_lock:
        _task_store[task_id] = task

    _ensure_scheduler_running()

    logger.info(f"[scheduler] Created task {task_id}: {task_data.name}")
    return _serialize_task(task)


@router.get("/{task_id}", response_model=SchedulerTaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> SchedulerTaskResponse:
    """Get a specific scheduled task."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    async with _scheduler_lock:
        task = _task_store.get(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return _serialize_task(task)


@router.patch("/{task_id}", response_model=SchedulerTaskResponse)
async def update_scheduled_task(
    task_id: str,
    update: SchedulerTaskUpdate,
    current_user: User = Depends(get_current_user),
) -> SchedulerTaskResponse:
    """Update an existing scheduled task."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    async with _scheduler_lock:
        task = _task_store.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        update_data = update.model_dump(exclude_none=True)

        # Validate cron if being updated
        new_schedule = update_data.get("schedule") or task.get("schedule")
        if update_data.get("schedule") is not None and new_schedule:
            try:
                croniter.croniter(new_schedule, datetime.now(tz=timezone.utc))
            except (croniter.CroniterBadCronError, ValueError) as exc:
                raise HTTPException(
                    status_code=400, detail=f"Invalid cron expression: {exc}"
                ) from exc

        for key, value in update_data.items():
            task[key] = value
        task["updated_at"] = int(datetime.now(tz=timezone.utc).timestamp())
        next_run = _parse_schedule_next(task) if task.get("enabled", True) else None
        task["next_run"] = int(next_run.timestamp()) if next_run else None

    logger.info(f"[scheduler] Updated task {task_id}")
    return _serialize_task(task)


@router.delete("/{task_id}", status_code=204)
async def delete_scheduled_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a scheduled task."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    async with _scheduler_lock:
        if task_id not in _task_store:
            raise HTTPException(status_code=404, detail="Task not found")
        del _task_store[task_id]

    logger.info(f"[scheduler] Deleted task {task_id}")


@router.post("/{task_id}/trigger", response_model=TriggerTaskResponse)
async def trigger_scheduled_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> TriggerTaskResponse:
    """Manually trigger a scheduled task immediately (fire-and-forget)."""
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    async with _scheduler_lock:
        task = _task_store.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        execution_id = str(uuid.uuid4())
        triggered_at = int(datetime.now(tz=timezone.utc).timestamp())
        task["last_run"] = triggered_at
        task["run_count"] = task.get("run_count", 0) + 1
        task["updated_at"] = triggered_at
        next_run = _parse_schedule_next(task) if task.get("enabled", True) else None
        task["next_run"] = int(next_run.timestamp()) if next_run else None

    # Fire in background without blocking
    asyncio.create_task(_execute_task(task))

    logger.info(f"[scheduler] Manually triggered task {task_id} (execution={execution_id})")

    return TriggerTaskResponse(
        task_id=task_id,
        triggered_at=triggered_at,
        execution_id=execution_id,
    )
