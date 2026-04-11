import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import Agent, AgentRun, Deployment, UsageEvent, Metrics, AgentMetric, User
from src.api.models.schemas import (
    AnalyticsSummaryResponse,
    AgentMetricsSummary,
    AnalyticsTimeSeriesResponse,
    AnalyticsTimeSeries,
    CostSummaryResponse,
    BudgetResponse,
)
from src.api.services.billing import get_current_billing_period, get_plan_credits, get_usage_credits

router = APIRouter(prefix="/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)


def _parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def _resolve_period(
    period_start: Optional[str],
    period_end: Optional[str],
    *,
    default_days: int = 30,
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if period_start == "24h":
        period_start_dt = now - timedelta(hours=24)
    elif period_start == "7d":
        period_start_dt = now - timedelta(days=7)
    elif period_start == "30d":
        period_start_dt = now - timedelta(days=30)
    else:
        period_start_dt = _parse_datetime(period_start) or (now - timedelta(days=default_days))

    period_end_dt = _parse_datetime(period_end) or now
    return period_start_dt, period_end_dt


def _decode_event_metadata(raw: Optional[str]) -> dict[str, str]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _resolve_usage_agent_key(event: UsageEvent, owned_agent_ids: set[str]) -> str | None:
    metadata = _decode_event_metadata(event.event_metadata)
    metadata_agent_id = metadata.get("agent_id")
    if isinstance(metadata_agent_id, str) and metadata_agent_id:
        return metadata_agent_id

    if event.resource_type == "agent" and event.resource_id:
        return event.resource_id

    if event.event_type.startswith("agent_") and event.resource_id in owned_agent_ids:
        return event.resource_id

    return None


@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    period_start: Optional[str] = Query(None),
    period_end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    period_start_dt, period_end_dt = _resolve_period(period_start, period_end)

    agent_query = select(Agent).where(Agent.user_id == current_user.id)
    agent_result = await db.execute(agent_query)
    user_agents = agent_result.scalars().all()
    agent_ids = [a.id for a in user_agents]

    total_agents = len(user_agents)
    active_agents = sum(1 for a in user_agents if a.status == "running")

    if agent_ids:
        deploy_query = select(Deployment).where(Deployment.agent_id.in_(agent_ids))
        deploy_result = await db.execute(deploy_query)
        deployments = deploy_result.scalars().all()
        total_deployments = len(deployments)
        active_deployments = sum(
            1 for d in deployments if d.status in ["running", "ready", "deploying"]
        )
    else:
        total_deployments = active_deployments = 0

    if agent_ids:
        runs_query = select(AgentRun).where(
            and_(
                AgentRun.agent_id.in_(agent_ids),
                AgentRun.started_at >= period_start_dt,
                AgentRun.started_at <= period_end_dt,
            )
        )
        runs_result = await db.execute(runs_query)
        runs = runs_result.scalars().all()
        total_runs = len(runs)
        successful_runs = sum(1 for r in runs if r.status == "completed")
        failed_runs = sum(1 for r in runs if r.status == "failed")
    else:
        total_runs = successful_runs = failed_runs = 0

    api_call_query = (
        select(func.count())
        .select_from(UsageEvent)
        .where(
            and_(
                UsageEvent.user_id == current_user.id,
                UsageEvent.event_type == "api_call",
                UsageEvent.created_at >= period_start_dt,
                UsageEvent.created_at <= period_end_dt,
            )
        )
    )
    total_api_calls = (await db.execute(api_call_query)).scalar_one() or 0

    avg_latency_ms = 0.0
    if agent_ids:
        latency_query = select(func.avg(Metrics.latency)).where(
            and_(
                Metrics.agent_id.in_(agent_ids),
                Metrics.timestamp >= period_start_dt,
                Metrics.timestamp <= period_end_dt,
            )
        )
        result = await db.execute(latency_query)
        avg_latency_ms = result.scalar_one() or 0.0

    return AnalyticsSummaryResponse(
        total_agents=total_agents,
        active_agents=active_agents,
        total_deployments=total_deployments,
        active_deployments=active_deployments,
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        total_api_calls=total_api_calls,
        avg_latency_ms=round(avg_latency_ms, 2),
        period_start=period_start_dt,
        period_end=period_end_dt,
    )


@router.get("/agents/{agent_id}/summary", response_model=AgentMetricsSummary)
async def get_agent_metrics_summary(
    agent_id: uuid.UUID,
    period_start: Optional[str] = Query(None),
    period_end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException

    agent_result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.user_id == current_user.id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

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

    runs_result = await db.execute(
        select(AgentRun).where(
            and_(
                AgentRun.agent_id == agent_id,
                AgentRun.started_at >= period_start_dt,
                AgentRun.started_at <= period_end_dt,
            )
        )
    )
    runs = runs_result.scalars().all()
    total_runs = len(runs)
    successful_runs = sum(1 for r in runs if r.status == "completed")
    failed_runs = sum(1 for r in runs if r.status == "failed")

    metrics_result = await db.execute(
        select(AgentMetric).where(
            and_(
                AgentMetric.agent_id == agent_id,
                AgentMetric.timestamp >= period_start_dt,
                AgentMetric.timestamp <= period_end_dt,
            )
        )
    )
    metrics = metrics_result.scalars().all()
    avg_cpu = sum(m.cpu_usage for m in metrics if m.cpu_usage) / len(metrics) if metrics else None
    avg_memory = (
        sum(m.memory_usage for m in metrics if m.memory_usage) / len(metrics) if metrics else None
    )

    sys_result = await db.execute(
        select(Metrics).where(
            and_(
                Metrics.agent_id == agent_id,
                Metrics.timestamp >= period_start_dt,
                Metrics.timestamp <= period_end_dt,
            )
        )
    )
    sys_metrics = sys_result.scalars().all()
    total_requests = sum(m.requests for m in sys_metrics)
    avg_latency = (
        sum(m.latency for m in sys_metrics if m.latency) / len(sys_metrics) if sys_metrics else None
    )

    return AgentMetricsSummary(
        agent_id=agent_id,
        agent_name=agent.name,
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        avg_cpu=round(avg_cpu, 2) if avg_cpu else None,
        avg_memory=round(avg_memory, 2) if avg_memory else None,
        total_requests=total_requests,
        avg_latency_ms=round(avg_latency, 2) if avg_latency else None,
        period_start=period_start_dt,
        period_end=period_end_dt,
    )


@router.get("/timeseries", response_model=AnalyticsTimeSeriesResponse)
async def get_analytics_timeseries(
    metric: str = Query(...),
    interval: str = Query("hour"),
    period_start: Optional[str] = Query(None),
    period_end: Optional[str] = Query(None),
    agent_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    data = []
    if metric == "runs":
        q = select(
            func.date_trunc(interval, AgentRun.started_at).label("ts"), func.count().label("count")
        ).where(
            and_(
                AgentRun.user_id == current_user.id,
                AgentRun.started_at >= period_start_dt,
                AgentRun.started_at <= period_end_dt,
            )
        )
        if agent_id:
            q = q.where(AgentRun.agent_id == agent_id)
        q = q.group_by("ts").order_by("ts")
        for row in await db.execute(q):
            data.append(
                AnalyticsTimeSeries(
                    timestamp=row.ts.replace(tzinfo=timezone.utc) if row.ts else now,
                    value=row.count,
                )
            )
    elif metric == "api_calls":
        q = select(
            func.date_trunc(interval, UsageEvent.created_at).label("ts"),
            func.count().label("count"),
        ).where(
            and_(
                UsageEvent.user_id == current_user.id,
                UsageEvent.event_type == "api_call",
                UsageEvent.created_at >= period_start_dt,
                UsageEvent.created_at <= period_end_dt,
            )
        )
        q = q.group_by("ts").order_by("ts")
        for row in await db.execute(q):
            data.append(
                AnalyticsTimeSeries(
                    timestamp=row.ts.replace(tzinfo=timezone.utc) if row.ts else now,
                    value=row.count,
                )
            )
    elif metric == "latency":
        q = (
            select(
                func.date_trunc(interval, Metrics.timestamp).label("ts"),
                func.avg(Metrics.latency).label("avg"),
            )
            .join(Agent, Agent.id == Metrics.agent_id)
            .where(
                and_(
                    Agent.user_id == current_user.id,
                    Metrics.timestamp >= period_start_dt,
                    Metrics.timestamp <= period_end_dt,
                )
            )
        )
        if agent_id:
            q = q.where(Metrics.agent_id == agent_id)
        q = q.group_by("ts").order_by("ts")
        for row in await db.execute(q):
            data.append(
                AnalyticsTimeSeries(
                    timestamp=row.ts.replace(tzinfo=timezone.utc) if row.ts else now,
                    value=round(row.avg, 2) if row.avg else 0,
                )
            )

    return AnalyticsTimeSeriesResponse(
        metric=metric,
        interval=interval,
        data=data,
        period_start=period_start_dt,
        period_end=period_end_dt,
    )


@router.get("/costs", response_model=CostSummaryResponse)
async def get_cost_summary(
    period_start: Optional[str] = Query(None),
    period_end: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    period_start_dt, period_end_dt = _resolve_period(period_start, period_end)

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

    agent_result = await db.execute(select(Agent.id).where(Agent.user_id == current_user.id))
    owned_agent_ids = {str(agent_id) for agent_id in agent_result.scalars().all()}

    usage_by_event_type: dict[str, float] = {}
    usage_by_agent: dict[str, float] = {}
    total_credits = 0.0

    for event in events:
        event_credits = float(event.credits_used or 0.0)
        total_credits += event_credits

        event_type = event.event_type or "unknown"
        usage_by_event_type[event_type] = usage_by_event_type.get(event_type, 0.0) + event_credits

        agent_key = _resolve_usage_agent_key(event, owned_agent_ids)
        if agent_key:
            usage_by_agent[agent_key] = usage_by_agent.get(agent_key, 0.0) + event_credits

    credits_total = get_plan_credits(current_user.plan)

    return CostSummaryResponse(
        total_credits_used=round(total_credits, 2),
        credits_remaining=round(max(0.0, credits_total - total_credits), 2),
        credits_total=credits_total,
        usage_by_event_type={key: round(value, 2) for key, value in usage_by_event_type.items()},
        usage_by_agent={key: round(value, 2) for key, value in usage_by_agent.items()},
        period_start=period_start_dt,
        period_end=period_end_dt,
    )


@router.get("/budget", response_model=BudgetResponse)
async def get_budget(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
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
