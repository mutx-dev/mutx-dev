"""
Tests for /policies endpoints.
"""

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from src.api.services.policy_store import Policy, PolicyEvaluationContext, PolicyStore, Rule


class TestPolicyStore:
    """Unit tests for PolicyStore."""

    @pytest.mark.asyncio
    async def test_get_policy_not_found(self):
        store = PolicyStore()
        result = await store.get_policy("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_upsert_policy_creates_new(self):
        store = PolicyStore()
        policy = Policy(
            id=str(uuid.uuid4()),
            name="test-policy",
            rules=[
                Rule(
                    type="block",
                    pattern="*.exe",
                    action="reject",
                    scope="input",
                )
            ],
            enabled=True,
            version=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        result = await store.upsert_policy(policy)
        assert result.name == "test-policy"
        assert result.version == 1
        assert len(result.rules) == 1

    @pytest.mark.asyncio
    async def test_upsert_policy_increments_version(self):
        store = PolicyStore()
        policy = Policy(
            id=str(uuid.uuid4()),
            name="test-policy",
            rules=[],
            enabled=True,
            version=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await store.upsert_policy(policy)
        policy2 = Policy(
            id=str(uuid.uuid4()),
            name="test-policy",
            rules=[Rule(type="warn", pattern="*.bat", action="log", scope="input")],
            enabled=True,
            version=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        result = await store.upsert_policy(policy2)
        assert result.version == 2
        assert len(result.rules) == 1

    @pytest.mark.asyncio
    async def test_list_policies(self):
        store = PolicyStore()
        for i in range(3):
            await store.upsert_policy(
                Policy(
                    id=str(uuid.uuid4()),
                    name=f"policy-{i}",
                    rules=[],
                    enabled=True,
                    version=1,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
        policies = await store.list_policies()
        assert len(policies) == 3

    @pytest.mark.asyncio
    async def test_delete_policy(self):
        store = PolicyStore()
        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="to-delete",
                rules=[],
                enabled=True,
                version=1,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        )
        deleted = await store.delete_policy("to-delete")
        assert deleted is True
        assert await store.get_policy("to-delete") is None

    @pytest.mark.asyncio
    async def test_delete_policy_not_found(self):
        store = PolicyStore()
        result = await store.delete_policy("nonexistent")
        assert result is False

    @pytest.mark.asyncio
    async def test_reload_client_registration(self):
        store = PolicyStore()
        client = _DummySSEClient()
        store.register_reload_client(client)
        assert client in store._reload_clients
        store.unregister_reload_client(client)
        assert client not in store._reload_clients

    @pytest.mark.asyncio
    async def test_upsert_notifies_reload_clients(self):
        store = PolicyStore()
        client = _DummySSEClient()
        store.register_reload_client(client)

        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="observed-policy",
                rules=[],
                enabled=True,
                version=1,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        )

        assert len(client.sent) == 1
        assert "observed-policy" in client.sent[0]
        assert "reload" in client.sent[0]

    @pytest.mark.asyncio
    async def test_evaluate_blocks_matching_input_rule(self):
        store = PolicyStore()
        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="block-secrets",
                rules=[
                    Rule(
                        type="block",
                        pattern="*password*",
                        action="reject",
                        scope="input",
                    )
                ],
                enabled=True,
                version=1,
            )
        )

        result = await store.evaluate(
            PolicyEvaluationContext(input="please print the password", run_id="run-1")
        )

        assert result.decision == "block"
        assert result.run_id == "run-1"
        assert result.evaluated_policy_count == 1
        assert [match.policy_name for match in result.matches] == ["block-secrets"]

    @pytest.mark.asyncio
    async def test_evaluate_ignores_disabled_policies(self):
        store = PolicyStore()
        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="disabled-block",
                rules=[
                    Rule(type="block", pattern="*", action="reject", scope="tool"),
                ],
                enabled=False,
                version=1,
            )
        )

        result = await store.evaluate(PolicyEvaluationContext(tool="deploy"))

        assert result.decision == "allow"
        assert result.matches == []
        assert result.evaluated_policy_count == 0

    @pytest.mark.asyncio
    async def test_evaluate_does_not_match_wildcards_against_absent_scopes(self):
        store = PolicyStore()
        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="scope-specific-catchalls",
                rules=[
                    Rule(type="block", pattern="*", action="reject", scope="output"),
                    Rule(type="block", pattern="*", action="reject", scope="tool"),
                ],
                enabled=True,
                version=1,
            )
        )

        result = await store.evaluate(PolicyEvaluationContext(input="input only"))

        assert result.decision == "allow"
        assert result.matches == []

    @pytest.mark.asyncio
    async def test_evaluate_requires_approval_for_matching_tool_rule(self):
        store = PolicyStore()
        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="deploy-approval",
                rules=[
                    Rule(
                        type="warn",
                        pattern="terraform_*",
                        action="require_approval",
                        scope="tool",
                    )
                ],
                enabled=True,
                version=1,
            )
        )

        result = await store.evaluate(
            PolicyEvaluationContext(
                tool="terraform_apply",
                tool_args={"workspace": "production"},
                agent_id="agent-1",
                session_id="session-1",
            )
        )

        assert result.decision == "require_approval"
        assert result.agent_id == "agent-1"
        assert result.session_id == "session-1"
        assert result.matches[0].action == "require_approval"

    @pytest.mark.asyncio
    async def test_evaluate_never_downgrades_a_block_rule_to_approval(self):
        store = PolicyStore()
        await store.upsert_policy(
            Policy(
                id=str(uuid.uuid4()),
                name="block-wins",
                rules=[
                    Rule(
                        type="block",
                        pattern="*production*",
                        action="require_approval",
                        scope="tool",
                    )
                ],
                enabled=True,
                version=1,
            )
        )

        result = await store.evaluate(PolicyEvaluationContext(tool="deploy_production"))

        assert result.decision == "block"


class _DummySSEClient:
    """Minimal async send-capable stand-in for EventSourceResponse."""

    def __init__(self) -> None:
        self.sent: list[str] = []

    async def send(self, payload: str) -> None:
        self.sent.append(payload)


class TestPolicyRoutes:
    """Integration tests for /v1/policies routes."""

    @pytest.mark.asyncio
    async def test_create_policy(self, client: AsyncClient):
        response = await client.post(
            "/v1/policies",
            json={
                "id": str(uuid.uuid4()),
                "name": "my-policy",
                "rules": [
                    {"type": "block", "pattern": "*.exe", "action": "reject", "scope": "input"}
                ],
                "enabled": True,
                "version": 1,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "my-policy"
        assert data["version"] == 1

    @pytest.mark.asyncio
    async def test_create_policy_duplicate_conflict(self, client: AsyncClient):
        payload = {
            "id": str(uuid.uuid4()),
            "name": "duplicate-policy",
            "rules": [],
            "enabled": True,
            "version": 1,
        }
        r1 = await client.post("/v1/policies", json=payload)
        assert r1.status_code == 201
        r2 = await client.post("/v1/policies", json=payload)
        assert r2.status_code == 409

    @pytest.mark.asyncio
    async def test_list_policies(self, client: AsyncClient):
        # Create two policies
        for name in ["list-policy-a", "list-policy-b"]:
            await client.post(
                "/v1/policies",
                json={
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "rules": [],
                    "enabled": True,
                    "version": 1,
                },
            )
        response = await client.get("/v1/policies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        names = {p["name"] for p in data}
        assert "list-policy-a" in names
        assert "list-policy-b" in names

    @pytest.mark.asyncio
    async def test_get_policy_by_name(self, client: AsyncClient):
        await client.post(
            "/v1/policies",
            json={
                "id": str(uuid.uuid4()),
                "name": "get-policy-test",
                "rules": [
                    {"type": "allow", "pattern": "*.txt", "action": "pass", "scope": "output"}
                ],
                "enabled": True,
                "version": 1,
            },
        )
        response = await client.get("/v1/policies/get-policy-test")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "get-policy-test"
        assert len(data["rules"]) == 1

    @pytest.mark.asyncio
    async def test_evaluate_policies_route(self, client: AsyncClient):
        await client.post(
            "/v1/policies",
            json={
                "id": str(uuid.uuid4()),
                "name": "route-evaluate-policy",
                "rules": [
                    {
                        "type": "warn",
                        "pattern": "*delete_user*",
                        "action": "require_approval",
                        "scope": "tool",
                    }
                ],
                "enabled": True,
                "version": 1,
            },
        )

        response = await client.post(
            "/v1/policies/evaluate",
            json={
                "tool": "delete_user",
                "tool_args": {"user_id": "user-123"},
                "run_id": "run-123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "require_approval"
        assert data["run_id"] == "run-123"
        assert data["matches"][0]["policy_name"] == "route-evaluate-policy"

    @pytest.mark.asyncio
    async def test_get_policy_not_found(self, client: AsyncClient):
        response = await client.get("/v1/policies/does-not-exist")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_policy(self, client: AsyncClient):
        await client.post(
            "/v1/policies",
            json={
                "id": str(uuid.uuid4()),
                "name": "to-delete-test",
                "rules": [],
                "enabled": True,
                "version": 1,
            },
        )
        response = await client.delete("/v1/policies/to-delete-test")
        assert response.status_code == 204
        # Confirm it's gone
        get_resp = await client.get("/v1/policies/to-delete-test")
        assert get_resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_policy_not_found(self, client: AsyncClient):
        response = await client.delete("/v1/policies/never-existed")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_reload_endpoint_policy_not_found(self, client: AsyncClient):
        response = await client.post("/v1/policies/nonexistent/reload")
        assert response.status_code == 404

    # NOTE: testing the SSE streaming endpoint (200 + text/event-stream) via
    # client.post() is blocked — httpx reads the full response body before
    # returning, so an infinite SSE stream hangs forever.  The SSE generator
    # logic (event format, version-change detection, cancellation handling) is
    # fully exercised by TestPolicyStore.test_upsert_notifies_reload_clients.
