from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.models.schemas import RuntimeProviderSnapshotResponse, RuntimeProviderSnapshotUpsert
from src.api.services.operator_state import (
    get_runtime_provider_snapshot,
    upsert_runtime_provider_snapshot,
)

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.get("/providers/{provider}", response_model=RuntimeProviderSnapshotResponse)
async def runtime_provider_state(
    provider: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_runtime_provider_snapshot(db, user=current_user, provider=provider)


@router.put("/providers/{provider}", response_model=RuntimeProviderSnapshotResponse)
async def upsert_runtime_provider_state(
    provider: str,
    request: RuntimeProviderSnapshotUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = request.model_dump(mode="json", exclude_none=True)
    payload["provider"] = provider
    return await upsert_runtime_provider_snapshot(
        db,
        user=current_user,
        provider=provider,
        payload=payload,
    )


@router.get("/governance/metrics")
async def governance_metrics(
    current_user: User = Depends(get_current_user),
):
    try:
        from cli.faramesh_runtime import (
            collect_faramesh_snapshot,
            generate_prometheus_metrics,
        )

        snapshot = collect_faramesh_snapshot()
        metrics_text = generate_prometheus_metrics(snapshot)
        return Response(content=metrics_text, media_type="text/plain")
    except Exception as e:
        return Response(content=f"# Error: {e}\n", status_code=500, media_type="text/plain")


@router.get("/governance/status")
async def governance_status(
    current_user: User = Depends(get_current_user),
):
    try:
        from cli.faramesh_runtime import collect_faramesh_snapshot, get_faramesh_health

        health = get_faramesh_health()
        snapshot = collect_faramesh_snapshot()
        return {
            "daemon_reachable": health.daemon_reachable,
            "socket_reachable": health.socket_reachable,
            "policy_loaded": health.policy_loaded,
            "version": health.version,
            "policy_name": health.policy_name,
            "decisions_total": snapshot.decisions_total,
            "permits_today": snapshot.permits_today,
            "denies_today": snapshot.denies_today,
            "defers_today": snapshot.defers_today,
            "pending_approvals": snapshot.pending_approvals,
            "status": snapshot.status,
        }
    except Exception as e:
        return {"error": str(e)}
