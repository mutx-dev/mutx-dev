"""
Budget routes for user credits and usage management.
"""

import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import UsageEvent, Agent, User
from src.api.models.plan_tiers import PlanTier

router = APIRouter(prefix="/budgets", tags=["budgets"])
logger = logging.getLogger(__name__)


PLAN_CREDITS = {
    PlanTier.FREE: 100,
    PlanTier.STARTER: 1000,
    PlanTier.PRO: 10000,
    PlanTier.ENTERPRISE: 100000,
}


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


def _parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


@router.get("", response_model=BudgetResponse)
async def get_budget(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's budget and credits."""
    result = await db.execute(
        select(func.sum(UsageEvent.credits_used)).where(
            UsageEvent.user_id == current_user.id
        )
    )
    credits_used = result.scalar_one() or 0.0
    
    credits_total = PLAN_CREDITS.get(current_user.plan, 100)
    credits_remaining = max(0, credits_total - credits_used)
    
    now = datetime.now(timezone.utc)
    # Reset date is first day of next month
    if now.month == 12:
        reset_date = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        reset_date = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    
    return BudgetResponse(
        user_id=current_user.id,
        plan=current_user.plan.value,
        credits_total=credits_total,
        credits_used=credits_used,
        credits_remaining=credits_remaining,
        reset_date=reset_date,
        usage_percentage=round(credits_used / credits_total * 100, 2) if credits_total > 0 else 0,
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
    
    # Get all usage events in period
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
    
    # Aggregate by agent
    agent_usage = {}
    for event in events:
        if event.resource_id:
            if event.resource_id not in agent_usage:
                agent_usage[event.resource_id] = {"credits": 0, "count": 0}
            agent_usage[event.resource_id]["credits"] += event.credits_used or 0
            agent_usage[event.resource_id]["count"] += 1
    
    # Get agent names
    usage_by_agent = []
    for agent_id_str, data in agent_usage.items():
        try:
            agent_id = uuid.UUID(agent_id_str)
            agent_result = await db.execute(
                select(Agent).where(Agent.id == agent_id)
            )
            agent = agent_result.scalar_one_or_none()
            agent_name = agent.name if agent else f"Unknown ({agent_id_str[:8]})"
        except ValueError:
            agent_name = f"Unknown ({agent_id_str[:8]})"
        
        usage_by_agent.append(UsageByAgent(
            agent_id=uuid.UUID(agent_id_str) if agent_id_str else uuid.UUID(),
            agent_name=agent_name,
            credits_used=round(data["credits"], 2),
            event_count=data["count"],
        ))
    
    # Aggregate by event type
    type_usage = {}
    for event in events:
        event_type = event.event_type or "unknown"
        if event_type not in type_usage:
            type_usage[event_type] = {"credits": 0, "count": 0}
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
    
    # Calculate totals
    total_credits = sum(data["credits"] for data in agent_usage.values())
    credits_total = PLAN_CREDITS.get(current_user.plan, 100)
    
    return UsageBreakdownResponse(
        total_credits_used=round(total_credits, 2),
        credits_remaining=max(0, credits_total - total_credits),
        credits_total=credits_total,
        period_start=period_start_dt,
        period_end=period_end_dt,
        usage_by_agent=sorted(usage_by_agent, key=lambda x: x.credits_used, reverse=True),
        usage_by_type=sorted(usage_by_type, key=lambda x: x.credits_used, reverse=True),
    )
