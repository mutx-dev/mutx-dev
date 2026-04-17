"""
Persistent governance registry for MUTX-native AGT parity surfaces.

The registry keeps per-operator state for governed identities, trust,
lifecycle transitions, discovery inventory, and generated attestation
bundles. It intentionally reuses existing MUTX governance services
instead of creating a parallel subsystem.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from collections import Counter
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from src.api.routes import security as security_routes
from src.api.routes.sessions import (
    get_local_claude_sessions,
    get_local_codex_sessions,
    get_local_hermes_sessions,
)
from src.api.services.credential_broker import get_credential_broker
from src.api.services.faramesh_supervisor import get_faramesh_supervisor
from src.api.services.policy_store import get_policy_store
from src.security import AARMComplianceChecker

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


class GovernanceLifecycleState(str, Enum):
    PENDING_APPROVAL = "pending_approval"
    PROVISIONED = "provisioned"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ROTATING_CREDENTIALS = "rotating_credentials"
    ORPHANED = "orphaned"
    DECOMMISSIONING = "decommissioning"
    DECOMMISSIONED = "decommissioned"


def _trust_tier(score: int) -> str:
    if score >= 850:
        return "trusted"
    if score >= 650:
        return "elevated"
    if score >= 400:
        return "baseline"
    if score >= 200:
        return "restricted"
    return "critical"


class TrustEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    timestamp: datetime = Field(default_factory=_now)
    actor: str = "system"
    reason: str = ""
    previous_score: int
    new_score: int


class LifecycleEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    timestamp: datetime = Field(default_factory=_now)
    actor: str = "system"
    reason: str = ""
    previous_state: GovernanceLifecycleState
    new_state: GovernanceLifecycleState


class GovernedIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    agent_id: str
    display_name: Optional[str] = None
    source: str = "manual"
    capability_scope: list[str] = Field(default_factory=list)
    resource_scope: list[str] = Field(default_factory=list)
    trust_score: int = 500
    trust_tier: str = "baseline"
    credential_status: str = "unknown"
    lifecycle_status: GovernanceLifecycleState = GovernanceLifecycleState.PENDING_APPROVAL
    launch_profile: Optional[str] = None
    faramesh_policy: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
    last_seen_at: Optional[datetime] = None
    trust_history: list[TrustEvent] = Field(default_factory=list)
    lifecycle_history: list[LifecycleEvent] = Field(default_factory=list)


class DiscoveryRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    finding_id: str
    entity_id: str
    entity_type: str
    title: str
    source: str
    passive: bool = True
    registration_status: str = "unregistered"
    remediation_status: str = "unreviewed"
    risk_level: str = "medium"
    confidence: float = 0.5
    discovered_at: datetime = Field(default_factory=_now)
    last_seen_at: datetime = Field(default_factory=_now)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class GovernanceNamespaceState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identities: dict[str, GovernedIdentity] = Field(default_factory=dict)
    discovery: dict[str, DiscoveryRecord] = Field(default_factory=dict)
    latest_attestation: dict[str, Any] = Field(default_factory=dict)
    last_discovery_scan_at: Optional[datetime] = None


class GovernanceRegistry:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._namespaces: dict[str, GovernanceNamespaceState] = {}
        mutx_home = Path(
            os.environ.get("MUTX_HOME")
            or os.environ.get("MUTX_HOME_DIR")
            or (Path.home() / ".mutx")
        ).expanduser()
        self._config_dir = mutx_home / "governance"
        self._config_file = self._config_dir / "registry.json"
        self._load()

    @staticmethod
    def _normalize_namespace(namespace: str) -> str:
        normalized = (namespace or "default").strip()
        return normalized or "default"

    @staticmethod
    def _default_lifecycle_for_runtime(state: str) -> GovernanceLifecycleState:
        normalized = (state or "").lower()
        if normalized in {"running", "starting", "restarting"}:
            return GovernanceLifecycleState.ACTIVE
        if normalized in {"stopping", "stopped"}:
            return GovernanceLifecycleState.SUSPENDED
        if normalized == "failed":
            return GovernanceLifecycleState.ORPHANED
        return GovernanceLifecycleState.PROVISIONED

    @staticmethod
    def _allowed_lifecycle_transitions() -> (
        dict[GovernanceLifecycleState, set[GovernanceLifecycleState]]
    ):
        return {
            GovernanceLifecycleState.PENDING_APPROVAL: {
                GovernanceLifecycleState.PROVISIONED,
                GovernanceLifecycleState.DECOMMISSIONED,
            },
            GovernanceLifecycleState.PROVISIONED: {
                GovernanceLifecycleState.ACTIVE,
                GovernanceLifecycleState.SUSPENDED,
                GovernanceLifecycleState.DECOMMISSIONING,
            },
            GovernanceLifecycleState.ACTIVE: {
                GovernanceLifecycleState.SUSPENDED,
                GovernanceLifecycleState.ROTATING_CREDENTIALS,
                GovernanceLifecycleState.ORPHANED,
                GovernanceLifecycleState.DECOMMISSIONING,
            },
            GovernanceLifecycleState.SUSPENDED: {
                GovernanceLifecycleState.ACTIVE,
                GovernanceLifecycleState.ROTATING_CREDENTIALS,
                GovernanceLifecycleState.DECOMMISSIONING,
            },
            GovernanceLifecycleState.ROTATING_CREDENTIALS: {
                GovernanceLifecycleState.ACTIVE,
                GovernanceLifecycleState.SUSPENDED,
                GovernanceLifecycleState.DECOMMISSIONING,
            },
            GovernanceLifecycleState.ORPHANED: {
                GovernanceLifecycleState.SUSPENDED,
                GovernanceLifecycleState.ACTIVE,
                GovernanceLifecycleState.DECOMMISSIONING,
            },
            GovernanceLifecycleState.DECOMMISSIONING: {
                GovernanceLifecycleState.DECOMMISSIONED,
            },
            GovernanceLifecycleState.DECOMMISSIONED: set(),
        }

    def _load(self) -> None:
        if not self._config_file.exists():
            return

        try:
            payload = json.loads(self._config_file.read_text())
            namespaces = payload.get("namespaces", {})
            if not isinstance(namespaces, dict):
                raise ValueError("Governance registry payload is invalid")

            self._namespaces = {
                str(namespace): GovernanceNamespaceState.model_validate(data)
                for namespace, data in namespaces.items()
                if isinstance(data, dict)
            }
        except Exception as exc:
            logger.error("Failed to load governance registry: %s", exc)
            self._namespaces = {}

    def _save_locked(self) -> None:
        self._config_dir.mkdir(parents=True, exist_ok=True)
        os.chmod(self._config_dir, 0o700)
        payload = {
            "schema_version": 1,
            "namespaces": {
                namespace: state.model_dump(mode="json")
                for namespace, state in self._namespaces.items()
            },
        }
        self._config_file.write_text(json.dumps(payload, indent=2))
        os.chmod(self._config_file, 0o600)

    def _state_for_namespace(self, namespace: str) -> GovernanceNamespaceState:
        normalized = self._normalize_namespace(namespace)
        if normalized not in self._namespaces:
            self._namespaces[normalized] = GovernanceNamespaceState()
        return self._namespaces[normalized]

    @staticmethod
    def _identity_from_agent(
        existing: Optional[GovernedIdentity],
        agent: dict[str, Any],
        *,
        capability_scope: list[str],
        resource_scope: list[str],
        credential_status: str,
    ) -> GovernedIdentity:
        now = _now()
        lifecycle_status = GovernanceRegistry._default_lifecycle_for_runtime(
            str(agent.get("state", ""))
        )
        default_score = 720 if lifecycle_status == GovernanceLifecycleState.ACTIVE else 560

        if existing is None:
            return GovernedIdentity(
                agent_id=str(agent.get("agent_id", "")).strip(),
                display_name=str(agent.get("agent_id", "")).strip() or None,
                source="supervised",
                capability_scope=capability_scope,
                resource_scope=resource_scope,
                trust_score=default_score,
                trust_tier=_trust_tier(default_score),
                credential_status=credential_status,
                lifecycle_status=lifecycle_status,
                launch_profile=agent.get("launch_profile"),
                faramesh_policy=agent.get("faramesh_policy"),
                metadata={
                    "command": agent.get("command", []),
                    "pid": agent.get("pid"),
                    "runtime_state": agent.get("state"),
                    "restart_count": agent.get("restart_count", 0),
                },
                created_at=now,
                updated_at=now,
                last_seen_at=now,
            )

        existing.source = "supervised"
        existing.capability_scope = capability_scope or existing.capability_scope
        existing.resource_scope = resource_scope or existing.resource_scope
        existing.credential_status = credential_status
        existing.launch_profile = agent.get("launch_profile")
        existing.faramesh_policy = agent.get("faramesh_policy")
        existing.lifecycle_status = lifecycle_status
        existing.metadata = {
            **existing.metadata,
            "command": agent.get("command", []),
            "pid": agent.get("pid"),
            "runtime_state": agent.get("state"),
            "restart_count": agent.get("restart_count", 0),
        }
        existing.updated_at = now
        existing.last_seen_at = now
        return existing

    async def list_identities(self, namespace: str) -> list[GovernedIdentity]:
        broker = get_credential_broker(namespace=self._normalize_namespace(namespace))
        backends = await broker.list_backends()
        healthy_backends = [backend for backend in backends if backend.get("is_healthy")]
        credential_status = "brokered" if healthy_backends else "unbound"

        supervisor = get_faramesh_supervisor()
        profile_names = {profile["name"] for profile in supervisor.list_profiles()}
        supervised_agents = [agent for agent in supervisor.list_agents() if isinstance(agent, dict)]

        async with self._lock:
            state = self._state_for_namespace(namespace)
            for agent in supervised_agents:
                agent_id = str(agent.get("agent_id", "")).strip()
                if not agent_id:
                    continue

                capability_scope = ["runtime:governed", "security:enforced"]
                launch_profile = agent.get("launch_profile")
                if launch_profile and launch_profile in profile_names:
                    capability_scope.append(f"profile:{launch_profile}")

                resource_scope = []
                faramesh_policy = agent.get("faramesh_policy")
                if isinstance(faramesh_policy, str) and faramesh_policy.strip():
                    resource_scope.append(f"policy:{Path(faramesh_policy).name}")

                existing = state.identities.get(agent_id)
                state.identities[agent_id] = self._identity_from_agent(
                    existing,
                    agent,
                    capability_scope=capability_scope,
                    resource_scope=resource_scope,
                    credential_status=credential_status,
                )

            self._save_locked()
            return sorted(
                state.identities.values(),
                key=lambda identity: identity.updated_at,
                reverse=True,
            )

    async def update_trust(
        self,
        namespace: str,
        agent_id: str,
        *,
        actor: str,
        reason: str = "",
        score: Optional[int] = None,
        delta: Optional[int] = None,
        capability_scope: Optional[list[str]] = None,
        resource_scope: Optional[list[str]] = None,
        credential_status: Optional[str] = None,
        display_name: Optional[str] = None,
    ) -> GovernedIdentity:
        if score is None and delta is None:
            raise ValueError("score or delta is required")

        await self.list_identities(namespace)

        async with self._lock:
            state = self._state_for_namespace(namespace)
            identity = state.identities.get(agent_id)
            if identity is None:
                identity = GovernedIdentity(
                    agent_id=agent_id, display_name=display_name or agent_id
                )
                state.identities[agent_id] = identity

            previous_score = identity.trust_score
            new_score = score if score is not None else previous_score + int(delta or 0)
            identity.trust_score = max(0, min(1000, int(new_score)))
            identity.trust_tier = _trust_tier(identity.trust_score)
            identity.updated_at = _now()
            identity.last_seen_at = identity.updated_at
            if capability_scope is not None:
                identity.capability_scope = capability_scope
            if resource_scope is not None:
                identity.resource_scope = resource_scope
            if credential_status is not None:
                identity.credential_status = credential_status
            if display_name:
                identity.display_name = display_name
            identity.trust_history.append(
                TrustEvent(
                    actor=actor,
                    reason=reason,
                    previous_score=previous_score,
                    new_score=identity.trust_score,
                )
            )
            self._save_locked()
            return identity

    async def update_lifecycle(
        self,
        namespace: str,
        agent_id: str,
        *,
        actor: str,
        target_state: GovernanceLifecycleState,
        reason: str = "",
    ) -> GovernedIdentity:
        await self.list_identities(namespace)

        async with self._lock:
            state = self._state_for_namespace(namespace)
            identity = state.identities.get(agent_id)
            if identity is None:
                identity = GovernedIdentity(agent_id=agent_id, display_name=agent_id)
                state.identities[agent_id] = identity

            current_state = GovernanceLifecycleState(identity.lifecycle_status)
            allowed_transitions = self._allowed_lifecycle_transitions().get(current_state, set())
            if target_state != current_state and target_state not in allowed_transitions:
                raise ValueError(
                    f"Invalid lifecycle transition: {current_state.value} -> {target_state.value}"
                )

            identity.lifecycle_status = target_state
            identity.updated_at = _now()
            identity.last_seen_at = identity.updated_at

            if target_state == GovernanceLifecycleState.ROTATING_CREDENTIALS:
                identity.credential_status = "rotating"
            elif target_state == GovernanceLifecycleState.DECOMMISSIONED:
                identity.credential_status = "revoked"
                identity.trust_score = 0
                identity.trust_tier = _trust_tier(0)

            identity.lifecycle_history.append(
                LifecycleEvent(
                    actor=actor,
                    reason=reason,
                    previous_state=current_state,
                    new_state=target_state,
                )
            )
            self._save_locked()
            return identity

    async def list_discovery(self, namespace: str) -> list[DiscoveryRecord]:
        async with self._lock:
            state = self._state_for_namespace(namespace)
            return sorted(
                state.discovery.values(),
                key=lambda record: record.last_seen_at,
                reverse=True,
            )

    async def scan_discovery(self, namespace: str) -> dict[str, Any]:
        identities = {
            identity.agent_id: identity for identity in await self.list_identities(namespace)
        }
        broker = get_credential_broker(namespace=self._normalize_namespace(namespace))
        backends = await broker.list_backends()
        policies = await (await get_policy_store()).list_policies()
        supervisor = get_faramesh_supervisor()
        supervised_agents = [agent for agent in supervisor.list_agents() if isinstance(agent, dict)]

        findings: list[DiscoveryRecord] = []
        seen_at = _now()

        for session in (
            get_local_claude_sessions() + get_local_codex_sessions() + get_local_hermes_sessions()
        ):
            session_id = str(session.get("id", "")).strip()
            if not session_id:
                continue
            source = str(session.get("source", "local"))
            evidence = [
                {
                    "kind": "local_session",
                    "source": source,
                    "last_activity": session.get("last_activity"),
                }
            ]
            file_path = session.get("file_path")
            if file_path:
                evidence.append({"kind": "path", "value": file_path})

            findings.append(
                DiscoveryRecord(
                    finding_id=f"discovery:{session_id}",
                    entity_id=session_id,
                    entity_type="local_session",
                    title=f"{source.capitalize()} session",
                    source=source,
                    passive=True,
                    registration_status=(
                        "registered" if session_id in identities else "unregistered"
                    ),
                    remediation_status="observe",
                    risk_level="medium" if session_id in identities else "high",
                    confidence=0.92,
                    discovered_at=seen_at,
                    last_seen_at=seen_at,
                    evidence=evidence,
                    metadata={
                        key: value
                        for key, value in session.items()
                        if key not in {"file_path", "last_activity"}
                    },
                )
            )

        for agent in supervised_agents:
            agent_id = str(agent.get("agent_id", "")).strip()
            if not agent_id:
                continue
            findings.append(
                DiscoveryRecord(
                    finding_id=f"discovery:supervised:{agent_id}",
                    entity_id=agent_id,
                    entity_type="supervised_agent",
                    title="Governed supervised agent",
                    source="faramesh",
                    passive=True,
                    registration_status="registered" if agent_id in identities else "unregistered",
                    remediation_status="managed",
                    risk_level="low",
                    confidence=0.98,
                    discovered_at=seen_at,
                    last_seen_at=seen_at,
                    evidence=[
                        {
                            "kind": "supervision",
                            "state": agent.get("state"),
                            "launch_profile": agent.get("launch_profile"),
                        }
                    ],
                    metadata=agent,
                )
            )

        for backend in backends:
            name = str(backend.get("name", "")).strip()
            if not name:
                continue
            findings.append(
                DiscoveryRecord(
                    finding_id=f"discovery:backend:{name}",
                    entity_id=name,
                    entity_type="credential_backend",
                    title="Credential backend",
                    source="credential_broker",
                    passive=True,
                    registration_status="registered",
                    remediation_status="managed",
                    risk_level="low" if backend.get("is_healthy") else "medium",
                    confidence=0.99,
                    discovered_at=seen_at,
                    last_seen_at=seen_at,
                    evidence=[{"kind": "backend", "path": backend.get("path")}],
                    metadata=backend,
                )
            )

        for policy in policies:
            findings.append(
                DiscoveryRecord(
                    finding_id=f"discovery:policy:{policy.name}",
                    entity_id=policy.name,
                    entity_type="policy",
                    title="Governance policy",
                    source="policy_store",
                    passive=True,
                    registration_status="registered",
                    remediation_status="managed",
                    risk_level="low" if policy.enabled else "medium",
                    confidence=0.96,
                    discovered_at=seen_at,
                    last_seen_at=seen_at,
                    evidence=[
                        {
                            "kind": "policy",
                            "version": policy.version,
                            "enabled": policy.enabled,
                            "rule_count": len(policy.rules),
                        }
                    ],
                    metadata=policy.model_dump(mode="json"),
                )
            )

        async with self._lock:
            state = self._state_for_namespace(namespace)
            state.discovery = {record.finding_id: record for record in findings}
            state.last_discovery_scan_at = seen_at
            self._save_locked()

        risk_counts = Counter(record.risk_level for record in findings)
        registration_counts = Counter(record.registration_status for record in findings)
        return {
            "scanned_at": seen_at.isoformat(),
            "count": len(findings),
            "summary": {
                "risk_levels": dict(risk_counts),
                "registration": dict(registration_counts),
            },
            "items": [record.model_dump(mode="json") for record in findings],
        }

    async def build_attestation(self, namespace: str) -> dict[str, Any]:
        scan_result = await self.scan_discovery(namespace)
        identities = await self.list_identities(namespace)
        discovery_items = scan_result["items"]
        broker = get_credential_broker(namespace=self._normalize_namespace(namespace))
        backends = await broker.list_backends()
        policies = await (await get_policy_store()).list_policies()

        active_sessions = security_routes._context_accumulator.list_active_sessions()
        pending_approvals = security_routes._approval_service.list_pending()
        security_routes._telemetry_exporter.set_active_sessions(len(active_sessions))
        security_routes._telemetry_exporter.set_pending_approvals(len(pending_approvals))
        telemetry = security_routes._telemetry_exporter.get_metrics_summary()

        checker = AARMComplianceChecker(
            mediator=security_routes._mediator,
            context_accumulator=security_routes._context_accumulator,
            policy_engine=security_routes._policy_engine,
            approval_service=security_routes._approval_service,
            receipt_generator=security_routes._receipt_generator,
            telemetry_exporter=security_routes._telemetry_exporter,
        )
        compliance = checker.full_audit()

        supervisor = get_faramesh_supervisor()
        supervised_agents = [agent for agent in supervisor.list_agents() if isinstance(agent, dict)]
        launch_profiles = supervisor.list_profiles()

        receipt_chains: list[dict[str, Any]] = []
        total_receipts = 0
        valid_chains = 0
        generator = security_routes._receipt_generator
        chain_map = getattr(generator, "_chains", {})
        for chain in chain_map.values():
            is_valid, errors = chain.verify_chain()
            total_receipts += len(chain.receipts)
            if is_valid:
                valid_chains += 1
            receipt_chains.append(
                {
                    "session_id": chain.session_id,
                    "chain_id": chain.chain_id,
                    "receipt_count": len(chain.receipts),
                    "valid": is_valid,
                    "errors": errors,
                }
            )

        identity_tiers = Counter(identity.trust_tier for identity in identities)
        lifecycle_counts = Counter(identity.lifecycle_status for identity in identities)
        healthy_backends = sum(1 for backend in backends if backend.get("is_healthy"))

        coverage = {
            "policy_coverage": len(policies) > 0,
            "telemetry_coverage": telemetry["total_evaluations"] >= 0,
            "receipt_integrity": not receipt_chains or len(receipt_chains) == valid_chains,
            "credential_rotation_posture": len(backends) == healthy_backends,
            "lifecycle_enforcement": len(identities) > 0
            and all(identity.lifecycle_status for identity in identities),
            "discovery_coverage": len(discovery_items) > 0,
            "runtime_guardrail_presence": len(launch_profiles) > 0 or len(supervised_agents) > 0,
        }

        owasp_mapping = [
            {
                "risk": "agent_identity_and_authentication",
                "mapped_surface": ["trust", "lifecycle", "credentials"],
                "status": "covered" if identities and backends else "gap",
            },
            {
                "risk": "unsafe_tool_or_runtime_execution",
                "mapped_surface": ["runtime", "supervision", "policies"],
                "status": "covered" if coverage["runtime_guardrail_presence"] else "gap",
            },
            {
                "risk": "missing_auditability",
                "mapped_surface": ["receipts", "telemetry", "attestations"],
                "status": "covered" if coverage["receipt_integrity"] else "gap",
            },
            {
                "risk": "shadow_agents_or_untracked_sessions",
                "mapped_surface": ["discovery", "trust"],
                "status": (
                    "covered"
                    if any(
                        item["registration_status"] == "unregistered" for item in discovery_items
                    )
                    or coverage["discovery_coverage"]
                    else "gap"
                ),
            },
        ]

        bundle = {
            "generated_at": _now().isoformat(),
            "namespace": self._normalize_namespace(namespace),
            "summary": {
                "identities": len(identities),
                "trust_tiers": dict(identity_tiers),
                "lifecycle": dict(lifecycle_counts),
                "discovery_items": len(discovery_items),
                "credential_backends": len(backends),
                "healthy_credential_backends": healthy_backends,
                "supervised_agents": len(supervised_agents),
                "launch_profiles": len(launch_profiles),
                "pending_approvals": len(pending_approvals),
                "receipt_chains": len(receipt_chains),
                "total_receipts": total_receipts,
            },
            "coverage": coverage,
            "telemetry": telemetry,
            "approvals": [
                {
                    "request_id": request.id,
                    "token": request.token,
                    "tool_name": request.tool_name,
                    "status": request.status.value,
                    "expires_at": request.expires_at.isoformat(),
                    "remaining_seconds": request.remaining_seconds,
                }
                for request in pending_approvals
            ],
            "policies": [policy.model_dump(mode="json") for policy in policies],
            "credentials": backends,
            "runtime": {
                "supervised_agents": supervised_agents,
                "launch_profiles": launch_profiles,
            },
            "trust": [identity.model_dump(mode="json") for identity in identities],
            "discovery": {
                "scanned_at": scan_result["scanned_at"],
                "items": discovery_items,
            },
            "receipts": {
                "chains": receipt_chains,
                "valid_chains": valid_chains,
                "invalid_chains": len(receipt_chains) - valid_chains,
            },
            "compliance": {
                "overall_satisfied": compliance.overall_satisfied,
                "checked_at": compliance.checked_at.isoformat(),
                "version": compliance.version,
                "summary": compliance.summary(),
                "results": [
                    {
                        "requirement_id": result.requirement_id,
                        "level": result.level.value,
                        "description": result.description,
                        "satisfied": result.satisfied,
                        "details": result.details,
                    }
                    for result in compliance.results
                ],
            },
            "prompt_defense": {
                "mode": "offline",
                "status": "not_configured",
                "details": "Prompt-defense parity is exposed as an attestable evaluation seam, not an inline runtime blocker.",
            },
            "owasp_agentic_risk_mapping": owasp_mapping,
        }

        async with self._lock:
            state = self._state_for_namespace(namespace)
            state.latest_attestation = bundle
            self._save_locked()

        return bundle

    async def get_latest_attestation(self, namespace: str) -> dict[str, Any]:
        async with self._lock:
            state = self._state_for_namespace(namespace)
            if state.latest_attestation:
                return dict(state.latest_attestation)
        return await self.build_attestation(namespace)


_registry: GovernanceRegistry | None = None
_registry_lock = asyncio.Lock()


async def get_governance_registry() -> GovernanceRegistry:
    global _registry
    if _registry is None:
        async with _registry_lock:
            if _registry is None:
                _registry = GovernanceRegistry()
    return _registry
