"""
Policy store service — in-memory policy repository with hot-reload support.
"""

import asyncio
from datetime import datetime, timezone
from fnmatch import fnmatch
import json
from typing import Literal

from pydantic import BaseModel, Field, JsonValue


class Rule(BaseModel):
    """A policy rule matching mechanism and enforcement action."""

    type: Literal["block", "allow", "warn"]
    pattern: str
    action: str
    scope: Literal["input", "output", "tool"]


class Policy(BaseModel):
    """A named collection of rules with versioning and enablement."""

    id: str
    name: str
    rules: list[Rule]
    enabled: bool
    version: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PolicyEvaluationContext(BaseModel):
    """Inputs used to evaluate stored policies against a pending action."""

    input: str | None = None
    output: str | None = None
    tool: str | None = None
    tool_args: dict[str, JsonValue] | None = None
    run_id: str | None = None
    agent_id: str | None = None
    session_id: str | None = None
    metadata: dict[str, JsonValue] = Field(default_factory=dict)


class PolicyRuleMatch(BaseModel):
    """A stored policy rule that matched an evaluation context."""

    policy_id: str
    policy_name: str
    policy_version: int
    rule_type: Literal["block", "allow", "warn"]
    rule_scope: Literal["input", "output", "tool"]
    pattern: str
    action: str


class PolicyEvaluationResult(BaseModel):
    """Decision returned by policy evaluation."""

    decision: Literal["allow", "warn", "block", "require_approval"]
    reason: str
    matches: list[PolicyRuleMatch] = Field(default_factory=list)
    evaluated_policy_count: int
    run_id: str | None = None
    agent_id: str | None = None
    session_id: str | None = None


def _normalize_match_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, sort_keys=True, default=str)


def _rule_matches(pattern: str, value: object) -> bool:
    if value is None:
        return False
    candidate = _normalize_match_value(value).casefold()
    normalized_pattern = pattern.casefold()
    return fnmatch(candidate, normalized_pattern) or normalized_pattern in candidate


def _decision_for_match(
    match: PolicyRuleMatch,
) -> Literal["allow", "warn", "block", "require_approval"]:
    if match.action.casefold() in {"approval", "require_approval", "request_approval"}:
        return "require_approval"
    if match.rule_type == "block":
        return "block"
    if match.rule_type == "warn":
        return "warn"
    return "allow"


def _select_decision(
    matches: list[PolicyRuleMatch],
) -> Literal["allow", "warn", "block", "require_approval"]:
    decisions = {_decision_for_match(match) for match in matches}
    for decision in ("block", "require_approval", "warn"):
        if decision in decisions:
            return decision
    return "allow"


class PolicyStore:
    """
    Thread-safe in-memory policy repository.

    Supports SSE-based hot-reload: callers can register
    async send-capable clients (e.g. ``EventSourceResponse``)
    to receive version-push notifications when a policy changes.
    """

    def __init__(self) -> None:
        self._policies: dict[str, Policy] = {}
        self._lock = asyncio.Lock()
        self._reload_clients: set[object] = set()

    # ------------------------------------------------------------------
    # Core CRUD
    # ------------------------------------------------------------------

    async def get_policy(self, name: str) -> Policy | None:
        """Return the policy with the given name, or None if not found."""
        async with self._lock:
            return self._policies.get(name)

    async def list_policies(self) -> list[Policy]:
        """Return all stored policies."""
        async with self._lock:
            return list(self._policies.values())

    async def upsert_policy(self, policy: Policy) -> Policy:
        """
        Insert or replace a policy, assigning/ incrementing its version
        and updating ``updated_at``. Notifies registered reload clients.
        """
        async with self._lock:
            now = datetime.now(timezone.utc)
            existing = self._policies.get(policy.name)
            if existing is not None:
                stored = Policy(
                    id=existing.id,
                    name=policy.name,
                    rules=policy.rules,
                    enabled=policy.enabled,
                    version=existing.version + 1,
                    created_at=existing.created_at,
                    updated_at=now,
                )
            else:
                stored = Policy(
                    id=policy.id,
                    name=policy.name,
                    rules=policy.rules,
                    enabled=policy.enabled,
                    version=1,
                    created_at=now,
                    updated_at=now,
                )
            self._policies[policy.name] = stored
        await self._notify_reload(policy.name)
        return stored

    async def delete_policy(self, name: str) -> bool:
        """
        Remove the policy with the given name. Returns True if the policy
        existed and was deleted, False otherwise.
        """
        async with self._lock:
            deleted = name in self._policies
            if deleted:
                del self._policies[name]
        if deleted:
            await self._notify_reload(name)
        return deleted

    async def evaluate(self, context: PolicyEvaluationContext) -> PolicyEvaluationResult:
        """Evaluate enabled policies against the supplied action context."""
        async with self._lock:
            policies = [policy for policy in self._policies.values() if policy.enabled]

        matches: list[PolicyRuleMatch] = []
        for policy in policies:
            for rule in policy.rules:
                scoped_value: object
                if rule.scope == "input":
                    scoped_value = context.input
                elif rule.scope == "output":
                    scoped_value = context.output
                else:
                    scoped_value = (
                        {
                            "tool": context.tool,
                            "tool_args": context.tool_args or {},
                        }
                        if context.tool is not None or context.tool_args
                        else None
                    )

                if not _rule_matches(rule.pattern, scoped_value):
                    continue

                matches.append(
                    PolicyRuleMatch(
                        policy_id=policy.id,
                        policy_name=policy.name,
                        policy_version=policy.version,
                        rule_type=rule.type,
                        rule_scope=rule.scope,
                        pattern=rule.pattern,
                        action=rule.action,
                    )
                )

        decision = _select_decision(matches)
        if matches:
            reason = f"{len(matches)} policy rule(s) matched"
        else:
            reason = "No enabled policy rules matched"

        return PolicyEvaluationResult(
            decision=decision,
            reason=reason,
            matches=matches,
            evaluated_policy_count=len(policies),
            run_id=context.run_id,
            agent_id=context.agent_id,
            session_id=context.session_id,
        )

    # ------------------------------------------------------------------
    # SSE hot-reload
    # ------------------------------------------------------------------

    def register_reload_client(self, client: object) -> None:
        """Register an async send-capable client for reload pings (e.g. EventSourceResponse)."""
        self._reload_clients.add(client)

    def unregister_reload_client(self, client: object) -> None:
        """Remove a reload client."""
        self._reload_clients.discard(client)

    async def _notify_reload(self, policy_name: str) -> None:
        """Send a minimal SSE payload to all registered clients."""
        import json

        data = json.dumps({"policy": policy_name, "event": "reload"})
        payload = f"data: {data}\n\n"
        dead: set[object] = set()
        for client in self._reload_clients:
            try:
                await client.send(payload)  # type: ignore[attr-defined]
            except Exception:
                dead.add(client)
        for client in dead:
            self._reload_clients.discard(client)


# ------------------------------------------------------------------
# Application-level singleton (used by dependency injection)
# ------------------------------------------------------------------

_policy_store: PolicyStore | None = None
_store_lock = asyncio.Lock()


async def get_policy_store() -> PolicyStore:
    """Return the global PolicyStore instance."""
    global _policy_store
    if _policy_store is None:
        async with _store_lock:
            if _policy_store is None:
                _policy_store = PolicyStore()
    return _policy_store
