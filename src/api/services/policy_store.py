"""
Policy store service — in-memory policy repository with hot-reload support.
"""
import asyncio
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel


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