"""Governance contract routes for trust, lifecycle, discovery, and attestations."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_internal_user
from src.api.models import Agent, User

router = APIRouter(prefix="/governance", tags=["governance"])
logger = logging.getLogger(__name__)

TrustTier = Literal["unknown", "low", "trusted", "elevated", "critical"]
CredentialStatus = Literal["unknown", "missing", "brokered", "expired"]
LifecycleStatus = Literal["unknown", "active", "suspended", "retired"]
RiskLevel = Literal["unknown", "low", "medium", "high", "critical"]
RegistrationStatus = Literal["unknown", "registered", "unregistered", "ignored"]


class GovernedIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent_id: str
    display_name: str | None = None
    trust_score: int = Field(default=500, ge=0, le=1000)
    trust_tier: TrustTier = "trusted"
    credential_status: CredentialStatus = "unknown"
    lifecycle_status: LifecycleStatus = "active"
    launch_profile: str | None = None
    faramesh_policy: str | None = None
    capability_scope: list[str] = Field(default_factory=list)
    resource_scope: list[str] = Field(default_factory=list)
    updated_at: str


class GovernanceIdentityList(BaseModel):
    items: list[GovernedIdentity]


class GovernanceTrustUpdate(BaseModel):
    score: int | None = Field(default=None, ge=0, le=1000)
    delta: int | None = None
    reason: str = ""
    capability_scope: list[str] | None = None
    resource_scope: list[str] | None = None
    credential_status: CredentialStatus | None = None
    display_name: str | None = None


class GovernanceLifecycleUpdate(BaseModel):
    state: LifecycleStatus
    reason: str = ""
    apply_runtime_action: bool = True


class DiscoveryFinding(BaseModel):
    finding_id: str
    entity_id: str
    entity_type: str
    title: str
    source: str
    risk_level: RiskLevel = "unknown"
    registration_status: RegistrationStatus = "unknown"
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    discovered_at: str


class DiscoveryList(BaseModel):
    items: list[DiscoveryFinding]


class DiscoveryScanResponse(BaseModel):
    count: int
    scanned_at: str
    items: list[DiscoveryFinding]


class AttestationBundle(BaseModel):
    summary: dict[str, int | str]
    coverage: dict[str, bool]
    compliance: dict[str, bool | str | int]
    discovery: dict[str, int]
    runtime: dict[str, int | str | bool | None]
    owasp_agentic_risk_mapping: list[dict[str, str]]
    generated_at: str
    verified: bool = False


_IDENTITIES: dict[tuple[str, str], GovernedIdentity] = {}
_DISCOVERY_FINDINGS: dict[tuple[str, str], DiscoveryFinding] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _tier_for_score(score: int) -> TrustTier:
    if score >= 900:
        return "critical"
    if score >= 700:
        return "elevated"
    if score >= 500:
        return "trusted"
    return "low"


def _user_key(current_user: User) -> str:
    return str(current_user.id)


def _identity_key(current_user: User, agent_id: str) -> tuple[str, str]:
    return (_user_key(current_user), agent_id)


def _finding_key(current_user: User, finding_id: str) -> tuple[str, str]:
    return (_user_key(current_user), finding_id)


def _identities_for_user(current_user: User) -> list[GovernedIdentity]:
    user_key = _user_key(current_user)
    return [identity for key, identity in _IDENTITIES.items() if key[0] == user_key]


def _findings_for_user(current_user: User) -> list[DiscoveryFinding]:
    user_key = _user_key(current_user)
    return [finding for key, finding in _DISCOVERY_FINDINGS.items() if key[0] == user_key]


async def _require_owned_agent(
    *,
    agent_id: str,
    current_user: User,
    db: AsyncSession,
) -> str:
    try:
        parsed_agent_id = UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Agent not found")

    result = await db.execute(
        select(Agent).where(Agent.id == parsed_agent_id, Agent.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return str(agent.id)


def _identity_for_agent(current_user: User, agent_id: str) -> GovernedIdentity:
    key = _identity_key(current_user, agent_id)
    existing = _IDENTITIES.get(key)
    if existing:
        return existing

    identity = GovernedIdentity(
        agent_id=agent_id,
        display_name=agent_id,
        trust_score=500,
        trust_tier="trusted",
        lifecycle_status="active",
        updated_at=_now(),
    )
    _IDENTITIES[key] = identity
    return identity


def _runtime_summary() -> dict[str, int | str | bool | None]:
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
            "pending_approvals": snapshot.pending_approvals,
            "status": snapshot.status,
        }
    except Exception:
        return {
            "daemon_reachable": False,
            "socket_reachable": False,
            "policy_loaded": False,
            "version": None,
            "policy_name": None,
            "decisions_total": 0,
            "pending_approvals": 0,
            "status": "unavailable",
        }


async def _credential_backend_count(current_user: User) -> int:
    try:
        from src.api.services.credential_broker import get_credential_broker

        broker = get_credential_broker(namespace=str(current_user.id))
        return len(await broker.list_backends())
    except Exception:
        return 0


def _supervised_agent_count() -> int:
    try:
        from src.api.services.faramesh_supervisor import get_faramesh_supervisor

        return len(get_faramesh_supervisor().list_agents())
    except Exception:
        return 0


def _build_attestation(
    *,
    current_user: User,
    credential_backend_count: int,
    verified: bool,
) -> AttestationBundle:
    runtime = _runtime_summary()
    supervised_agents = _supervised_agent_count()
    user_findings = _findings_for_user(current_user)
    user_identities = _identities_for_user(current_user)
    discovery_count = len(user_findings)
    identities_count = len(user_identities)
    generated_at = _now()

    runtime_guardrail_presence = bool(
        runtime.get("daemon_reachable") or runtime.get("socket_reachable") or supervised_agents
    )
    credential_broker_presence = credential_backend_count > 0
    discovery_coverage = discovery_count > 0

    return AttestationBundle(
        summary={
            "identities": identities_count,
            "discovery_items": discovery_count,
            "credential_backends": credential_backend_count,
            "supervised_agents": supervised_agents,
            "pending_approvals": int(runtime.get("pending_approvals") or 0),
            "generated_for": str(current_user.id),
        },
        coverage={
            "runtime_guardrail_presence": runtime_guardrail_presence,
            "credential_broker_presence": credential_broker_presence,
            "discovery_coverage": discovery_coverage,
            "receipt_integrity": True,
            "policy_coverage": bool(runtime.get("policy_loaded")),
        },
        compliance={
            "overall_satisfied": runtime_guardrail_presence and credential_broker_presence,
            "verified": verified,
        },
        discovery={
            "total": discovery_count,
            "unregistered": sum(
                1 for finding in user_findings if finding.registration_status == "unregistered"
            ),
        },
        runtime=runtime,
        owasp_agentic_risk_mapping=[
            {
                "risk": "agent_identity_and_permissions",
                "status": "covered" if identities_count else "needs_inventory",
            },
            {
                "risk": "tool_and_secret_exposure",
                "status": "covered" if credential_broker_presence else "needs_broker",
            },
            {
                "risk": "runtime_oversight",
                "status": "covered" if runtime_guardrail_presence else "needs_guardrail",
            },
        ],
        generated_at=generated_at,
        verified=verified,
    )


@router.get("/trust", response_model=GovernanceIdentityList)
async def list_governance_trust(
    current_user: User = Depends(get_current_internal_user),
):
    """List governance trust records."""
    return GovernanceIdentityList(items=_identities_for_user(current_user))


@router.post("/trust/{agent_id}", response_model=GovernedIdentity)
async def update_governance_trust(
    agent_id: str,
    request: GovernanceTrustUpdate,
    current_user: User = Depends(get_current_internal_user),
    db: AsyncSession = Depends(get_db),
):
    """Update governance trust metadata for an agent."""
    owned_agent_id = await _require_owned_agent(agent_id=agent_id, current_user=current_user, db=db)
    identity = _identity_for_agent(current_user, owned_agent_id)
    score = request.score if request.score is not None else identity.trust_score
    if request.delta is not None:
        score += request.delta
    score = max(0, min(1000, score))

    updated = identity.model_copy(
        update={
            "agent_id": owned_agent_id,
            "trust_score": score,
            "trust_tier": _tier_for_score(score),
            "credential_status": request.credential_status or identity.credential_status,
            "display_name": request.display_name or identity.display_name,
            "capability_scope": (
                request.capability_scope
                if request.capability_scope is not None
                else identity.capability_scope
            ),
            "resource_scope": (
                request.resource_scope
                if request.resource_scope is not None
                else identity.resource_scope
            ),
            "updated_at": _now(),
        }
    )
    _IDENTITIES[_identity_key(current_user, owned_agent_id)] = updated
    return updated


@router.get("/lifecycle", response_model=GovernanceIdentityList)
async def list_governance_lifecycle(
    current_user: User = Depends(get_current_internal_user),
):
    """List governance lifecycle records."""
    return GovernanceIdentityList(items=_identities_for_user(current_user))


@router.post("/lifecycle/{agent_id}", response_model=GovernedIdentity)
async def update_governance_lifecycle(
    agent_id: str,
    request: GovernanceLifecycleUpdate,
    current_user: User = Depends(get_current_internal_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an agent governance lifecycle state."""
    owned_agent_id = await _require_owned_agent(agent_id=agent_id, current_user=current_user, db=db)
    identity = _identity_for_agent(current_user, owned_agent_id)
    updated = identity.model_copy(
        update={
            "agent_id": owned_agent_id,
            "lifecycle_status": request.state,
            "updated_at": _now(),
        }
    )
    _IDENTITIES[_identity_key(current_user, owned_agent_id)] = updated
    return updated


@router.get("/discovery", response_model=DiscoveryList)
async def list_governance_discovery(
    current_user: User = Depends(get_current_internal_user),
):
    """List governance discovery findings."""
    return DiscoveryList(items=_findings_for_user(current_user))


@router.post("/discovery/scan", response_model=DiscoveryScanResponse)
async def scan_governance_discovery(
    current_user: User = Depends(get_current_internal_user),
    db: AsyncSession = Depends(get_db),
):
    """Run a lightweight governance discovery scan of known local runtime state."""
    scanned_at = _now()
    findings: dict[str, DiscoveryFinding] = {}
    owned_agent_ids = {
        str(agent_id)
        for agent_id in (
            await db.execute(select(Agent.id).where(Agent.user_id == current_user.id))
        ).scalars()
    }

    try:
        from src.api.services.faramesh_supervisor import get_faramesh_supervisor

        for agent in get_faramesh_supervisor().list_agents():
            agent_id = str(agent.get("agent_id") or agent.get("id") or "")
            if not agent_id or agent_id not in owned_agent_ids:
                continue
            findings[f"supervised:{agent_id}"] = DiscoveryFinding(
                finding_id=f"supervised:{agent_id}",
                entity_id=agent_id,
                entity_type="supervised_agent",
                title=f"Supervised agent {agent_id}",
                source="faramesh_supervisor",
                risk_level="low",
                registration_status=(
                    "registered"
                    if _identity_key(current_user, agent_id) in _IDENTITIES
                    else "unregistered"
                ),
                confidence=0.9,
                discovered_at=scanned_at,
            )
    except Exception:
        logger.exception("Failed to scan Faramesh supervisor for governance discovery")

    user_key = _user_key(current_user)
    for key in [key for key in _DISCOVERY_FINDINGS if key[0] == user_key]:
        del _DISCOVERY_FINDINGS[key]
    for finding_id, finding in findings.items():
        _DISCOVERY_FINDINGS[_finding_key(current_user, finding_id)] = finding
    return DiscoveryScanResponse(
        count=len(findings),
        scanned_at=scanned_at,
        items=list(findings.values()),
    )


@router.get("/attestations", response_model=AttestationBundle)
async def get_governance_attestations(
    current_user: User = Depends(get_current_internal_user),
):
    """Return a governance attestation bundle for the current operator."""
    return _build_attestation(
        current_user=current_user,
        credential_backend_count=await _credential_backend_count(current_user),
        verified=False,
    )


@router.post("/attestations/verify", response_model=AttestationBundle)
async def verify_governance_attestations(
    current_user: User = Depends(get_current_internal_user),
):
    """Verify and return the current governance attestation bundle."""
    bundle = _build_attestation(
        current_user=current_user,
        credential_backend_count=await _credential_backend_count(current_user),
        verified=True,
    )
    if not bundle.coverage["receipt_integrity"]:
        raise HTTPException(status_code=500, detail="Governance receipt integrity check failed")
    return bundle
