"""
Budget routes for user credits and usage management.
"""

import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import UsageEvent, Agent, User
from src.api.services.billing import get_current_billing_period, get_plan_credits, get_usage_credits

router = APIRouter(prefix="/budgets", tags=["budgets"])
logger = logging.getLogger(__name__)


class BudgetResponse(BaseModel):
    user_id: uuid.UUID
    plan: str
    credits_total: float
    credits_used: float
    credits_remaining: float
    reset_date: datetime
    usage_percentage: float


class UsageByAgent(BaseModel):
    agent_id: uuid.UUID
    agent_name: str
    credits_used: float
    event_count: int


class UsageByType(BaseModel):
    event_type: str
    credits_used: float
    event_count: int


class UsageBreakdownResponse(BaseModel):
    total_credits_used: float
    credits_remaining: float
    credits_total: float
    period_start: datetime
    period_end: datetime
    usage_by_agent: list[UsageByAgent]
    usage_by_type: list[UsageByType]


def _parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def _decode_event_metadata(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _safe_uuid(value: Optional[str]) -> uuid.UUID:
    if value:
        try:
            return uuid.UUID(str(value))
        except (TypeError, ValueError):
            pass
    return uuid.UUID(int=0)


@router.get("", response_model=BudgetResponse)
async def get_budget(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's monthly budget and credits."""
    billing_period_start, reset_date = get_current_billing_period()
    credits_used = await get_usage_credits(
        db,
        current_user.id,
        period_start=billing_period_start,
        period_end=reset_date,
    )

    credits_total = get_plan_credits(current_user.plan)
    credits_remaining = max(0.0, credits_total - credits_used)

    return BudgetResponse(
        user_id=current_user.id,
        plan=current_user.plan,
        credits_total=credits_total,
        credits_used=round(credits_used, 2),
        credits_remaining=round(credits_remaining, 2),
        reset_date=reset_date,
        usage_percentage=round((credits_used / credits_total) * 100, 2) if credits_total > 0 else 0,
    )


@router.get("/usage", response_model=UsageBreakdownResponse)
async def get_usage_breakdown(
    period_start: Optional[str] = Query(None),
    period_end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed usage breakdown by agent and event type."""
    now = datetime.now(timezone.utc)

    if period_start == "24h":
        period_start_dt = now - timedelta(hours=24)
    elif period_start == "7d":
        period_start_dt = now - timedelta(days=7)
    elif period_start == "30d":
        period_start_dt = now - timedelta(days=30)
    else:
        period_start_dt = _parse_datetime(period_start) or (now - timedelta(days=30))

    period_end_dt = _parse_datetime(period_end) or now

    result = await db.execute(
        select(UsageEvent).where(
            and_(
                UsageEvent.user_id == current_user.id,
                UsageEvent.created_at >= period_start_dt,
                UsageEvent.created_at <= period_end_dt,
            )
        )
    )
    events = result.scalars().all()

    agent_usage: dict[str, dict[str, float | int]] = {}
    for event in events:
        metadata = _decode_event_metadata(event.event_metadata)
        agent_key = metadata.get("agent_id") if isinstance(metadata.get("agent_id"), str) else None

        if not agent_key and event.resource_type == "agent" and event.resource_id:
            agent_key = event.resource_id

        if not agent_key and event.event_type.startswith("agent_") and event.resource_id:
            agent_key = event.resource_id

        if not agent_key:
            continue

        if agent_key not in agent_usage:
            agent_usage[agent_key] = {"credits": 0.0, "count": 0}
        agent_usage[agent_key]["credits"] += event.credits_used or 0
        agent_usage[agent_key]["count"] += 1

    usage_by_agent = []
    for agent_id_str, data in agent_usage.items():
        agent_uuid = _safe_uuid(agent_id_str)
        agent_name = f"Unscoped usage ({str(agent_uuid)[:8]})"

        if agent_uuid.int != 0:
            agent_result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
            agent = agent_result.scalar_one_or_none()
            if agent is not None:
                agent_name = agent.name
            else:
                agent_name = f"Unknown agent ({str(agent_uuid)[:8]})"

        usage_by_agent.append(
            UsageByAgent(
                agent_id=agent_uuid,
                agent_name=agent_name,
                credits_used=round(float(data["credits"]), 2),
                event_count=int(data["count"]),
            )
        )

    type_usage = {}
    for event in events:
        event_type = event.event_type or "unknown"
        if event_type not in type_usage:
            type_usage[event_type] = {"credits": 0.0, "count": 0}
        type_usage[event_type]["credits"] += event.credits_used or 0
        type_usage[event_type]["count"] += 1

    usage_by_type = [
        UsageByType(
            event_type=event_type,
            credits_used=round(data["credits"], 2),
            event_count=data["count"],
        )
        for event_type, data in type_usage.items()
    ]

    total_credits = sum((event.credits_used or 0) for event in events)

    credits_total = get_plan_credits(current_user.plan)

    return UsageBreakdownResponse(
        total_credits_used=round(total_credits, 2),
        credits_remaining=max(0, credits_total - total_credits),
        credits_total=credits_total,
        period_start=period_start_dt,
        period_end=period_end_dt,
        usage_by_agent=sorted(usage_by_agent, key=lambda x: x.credits_used, reverse=True),
        usage_by_type=sorted(usage_by_type, key=lambda x: x.credits_used, reverse=True),
    )
