"""
MUTX-native governance state routes for AGT parity surfaces.
"""

from __future__ import annotations

from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from src.api.middleware.auth import get_current_internal_user
from src.api.models import User
from src.api.services.faramesh_supervisor import get_faramesh_supervisor
from src.api.services.governance_registry import (
    GovernanceLifecycleState,
    get_governance_registry,
)

router = APIRouter(prefix="/governance", tags=["governance"])


class TrustUpdateRequest(BaseModel):
    score: Optional[int] = Field(default=None, ge=0, le=1000)
    delta: Optional[int] = None
    reason: str = ""
    capability_scope: Optional[list[str]] = None
    resource_scope: Optional[list[str]] = None
    credential_status: Optional[str] = None
    display_name: Optional[str] = None


class LifecycleUpdateRequest(BaseModel):
    state: GovernanceLifecycleState
    reason: str = ""
    apply_runtime_action: bool = True


def _identity_summary(items: list[dict]) -> dict[str, dict[str, int] | int]:
    trust_tiers = Counter(str(item.get("trust_tier", "unknown")) for item in items)
    lifecycle = Counter(str(item.get("lifecycle_status", "unknown")) for item in items)
    return {
        "count": len(items),
        "trust_tiers": dict(trust_tiers),
        "lifecycle": dict(lifecycle),
    }


@router.get("/trust")
async def list_governance_trust(
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    items = [
        identity.model_dump(mode="json")
        for identity in await registry.list_identities(str(current_user.id))
    ]
    return {
        "items": items,
        "summary": _identity_summary(items),
    }


@router.post("/trust/{agent_id}")
async def update_governance_trust(
    agent_id: str,
    request: TrustUpdateRequest,
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    try:
        identity = await registry.update_trust(
            str(current_user.id),
            agent_id,
            actor=current_user.email,
            reason=request.reason,
            score=request.score,
            delta=request.delta,
            capability_scope=request.capability_scope,
            resource_scope=request.resource_scope,
            credential_status=request.credential_status,
            display_name=request.display_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return identity.model_dump(mode="json")


@router.get("/lifecycle")
async def list_governance_lifecycle(
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    items = [
        identity.model_dump(mode="json")
        for identity in await registry.list_identities(str(current_user.id))
    ]
    return {
        "items": items,
        "summary": _identity_summary(items),
    }


@router.post("/lifecycle/{agent_id}")
async def update_governance_lifecycle(
    agent_id: str,
    request: LifecycleUpdateRequest,
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    supervisor = get_faramesh_supervisor()

    if request.apply_runtime_action:
        if request.state in {
            GovernanceLifecycleState.SUSPENDED,
            GovernanceLifecycleState.DECOMMISSIONING,
            GovernanceLifecycleState.DECOMMISSIONED,
        }:
            await supervisor.stop_agent(agent_id)
        elif request.state == GovernanceLifecycleState.ACTIVE:
            agent = supervisor.get_agent_status(agent_id)
            if agent is not None:
                await supervisor.restart_agent(agent_id)

    try:
        identity = await registry.update_lifecycle(
            str(current_user.id),
            agent_id,
            actor=current_user.email,
            target_state=request.state,
            reason=request.reason,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return identity.model_dump(mode="json")


@router.get("/discovery")
async def list_governance_discovery(
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    items = [
        item.model_dump(mode="json") for item in await registry.list_discovery(str(current_user.id))
    ]
    risk_counts = Counter(str(item.get("risk_level", "unknown")) for item in items)
    registration_counts = Counter(str(item.get("registration_status", "unknown")) for item in items)
    return {
        "items": items,
        "summary": {
            "count": len(items),
            "risk_levels": dict(risk_counts),
            "registration": dict(registration_counts),
        },
    }


@router.post("/discovery/scan")
async def scan_governance_discovery(
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    return await registry.scan_discovery(str(current_user.id))


@router.get("/attestations")
async def get_governance_attestations(
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    return await registry.get_latest_attestation(str(current_user.id))


@router.post("/attestations/verify")
async def verify_governance_attestations(
    current_user: User = Depends(get_current_internal_user),
):
    registry = await get_governance_registry()
    return await registry.build_attestation(str(current_user.id))
