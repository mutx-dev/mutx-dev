from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient


class _FakeBroker:
    async def list_backends(self):
        return [
            {
                "name": "vault-prod",
                "backend": "vault",
                "path": "secret/prod",
                "ttl": 900,
                "is_active": True,
                "is_healthy": True,
            }
        ]


class _FakeSupervisor:
    def __init__(self):
        self.stop_calls: list[str] = []
        self.restart_calls: list[str] = []

    def list_agents(self):
        return [
            {
                "agent_id": "agent-1",
                "state": "running",
                "pid": 4242,
                "restart_count": 1,
                "launch_profile": "assistant-runner",
                "faramesh_policy": "/tmp/policies/starter.fpl",
                "command": ["python", "agent.py"],
            }
        ]

    def list_profiles(self):
        return [
            {
                "name": "assistant-runner",
                "command": ["python", "agent.py"],
                "env_keys": ["OPENAI_API_KEY"],
                "faramesh_policy": "/tmp/policies/starter.fpl",
            }
        ]

    def get_agent_status(self, agent_id: str):
        for agent in self.list_agents():
            if agent["agent_id"] == agent_id:
                return dict(agent)
        return None

    async def stop_agent(self, agent_id: str, timeout=None):
        self.stop_calls.append(agent_id)
        return True

    async def restart_agent(self, agent_id: str):
        self.restart_calls.append(agent_id)
        return True


@pytest.fixture
def governance_state_env(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("MUTX_HOME", str(tmp_path))

    import src.api.services.governance_registry as governance_registry
    import src.api.services.policy_store as policy_store

    monkeypatch.setattr(governance_registry, "_registry", None)
    monkeypatch.setattr(policy_store, "_policy_store", None)

    yield tmp_path

    monkeypatch.setattr(governance_registry, "_registry", None)
    monkeypatch.setattr(policy_store, "_policy_store", None)


@pytest.mark.asyncio
async def test_governance_trust_lists_supervised_identities(
    client: AsyncClient, monkeypatch, governance_state_env
):
    import src.api.routes.governance_state as governance_state
    import src.api.services.governance_registry as governance_registry

    supervisor = _FakeSupervisor()
    monkeypatch.setattr(governance_state, "get_faramesh_supervisor", lambda: supervisor)
    monkeypatch.setattr(governance_registry, "get_faramesh_supervisor", lambda: supervisor)
    monkeypatch.setattr(
        governance_registry,
        "get_credential_broker",
        lambda namespace=None: _FakeBroker(),
    )

    response = await client.get("/v1/governance/trust")

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["count"] == 1
    assert payload["items"][0]["agent_id"] == "agent-1"
    assert payload["items"][0]["trust_tier"] in {"elevated", "trusted"}


@pytest.mark.asyncio
async def test_governance_lifecycle_updates_and_stops_runtime(
    client: AsyncClient, monkeypatch, governance_state_env
):
    import src.api.routes.governance_state as governance_state
    import src.api.services.governance_registry as governance_registry

    supervisor = _FakeSupervisor()
    monkeypatch.setattr(governance_state, "get_faramesh_supervisor", lambda: supervisor)
    monkeypatch.setattr(governance_registry, "get_faramesh_supervisor", lambda: supervisor)
    monkeypatch.setattr(
        governance_registry,
        "get_credential_broker",
        lambda namespace=None: _FakeBroker(),
    )

    warm_response = await client.get("/v1/governance/lifecycle")
    assert warm_response.status_code == 200

    response = await client.post(
        "/v1/governance/lifecycle/agent-1",
        json={"state": "suspended", "reason": "operator stop"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["lifecycle_status"] == "suspended"
    assert supervisor.stop_calls == ["agent-1"]


@pytest.mark.asyncio
async def test_governance_discovery_scan_returns_inventory(
    client: AsyncClient, monkeypatch, governance_state_env
):
    import src.api.services.governance_registry as governance_registry

    supervisor = _FakeSupervisor()
    monkeypatch.setattr(governance_registry, "get_faramesh_supervisor", lambda: supervisor)
    monkeypatch.setattr(
        governance_registry,
        "get_credential_broker",
        lambda namespace=None: _FakeBroker(),
    )
    monkeypatch.setattr(
        governance_registry,
        "get_local_codex_sessions",
        lambda: [
            {
                "id": "codex:session-1",
                "source": "codex",
                "name": "Mission Control",
                "last_activity": 1710000000,
            }
        ],
    )
    monkeypatch.setattr(governance_registry, "get_local_claude_sessions", lambda: [])
    monkeypatch.setattr(governance_registry, "get_local_hermes_sessions", lambda: [])

    response = await client.post("/v1/governance/discovery/scan")

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] >= 2
    entity_types = {item["entity_type"] for item in payload["items"]}
    assert "local_session" in entity_types
    assert "supervised_agent" in entity_types


@pytest.mark.asyncio
async def test_governance_attestation_verify_returns_bundle(
    client: AsyncClient, monkeypatch, governance_state_env
):
    import src.api.services.governance_registry as governance_registry
    from src.api.services.policy_store import Policy, Rule, get_policy_store

    supervisor = _FakeSupervisor()
    monkeypatch.setattr(governance_registry, "get_faramesh_supervisor", lambda: supervisor)
    monkeypatch.setattr(
        governance_registry,
        "get_credential_broker",
        lambda namespace=None: _FakeBroker(),
    )
    monkeypatch.setattr(governance_registry, "get_local_codex_sessions", lambda: [])
    monkeypatch.setattr(governance_registry, "get_local_claude_sessions", lambda: [])
    monkeypatch.setattr(governance_registry, "get_local_hermes_sessions", lambda: [])

    store = await get_policy_store()
    store._policies.clear()
    await store.upsert_policy(
        Policy(
            id="policy-1",
            name="starter",
            rules=[Rule(type="allow", pattern="*", action="permit", scope="tool")],
            enabled=True,
            version=1,
        )
    )

    response = await client.post("/v1/governance/attestations/verify")

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["identities"] == 1
    assert payload["summary"]["credential_backends"] == 1
    assert "coverage" in payload
    assert "owasp_agentic_risk_mapping" in payload


@pytest.mark.asyncio
async def test_governance_state_routes_require_internal_user(
    other_user_client: AsyncClient, monkeypatch, governance_state_env
):
    import src.api.services.governance_registry as governance_registry

    monkeypatch.setattr(
        governance_registry,
        "get_credential_broker",
        lambda namespace=None: _FakeBroker(),
    )
    monkeypatch.setattr(governance_registry, "get_local_codex_sessions", lambda: [])
    monkeypatch.setattr(governance_registry, "get_local_claude_sessions", lambda: [])
    monkeypatch.setattr(governance_registry, "get_local_hermes_sessions", lambda: [])

    response = await other_user_client.get("/v1/governance/trust")
    assert response.status_code == 403
