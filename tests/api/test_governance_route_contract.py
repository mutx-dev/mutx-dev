"""Contract tests for public governance routes used by dashboard, CLI, and SDK clients."""

import pytest
from httpx import AsyncClient

import src.api.routes.governance as governance


@pytest.fixture(autouse=True)
def reset_governance_contract_state():
    governance._IDENTITIES.clear()
    governance._DISCOVERY_FINDINGS.clear()


@pytest.mark.asyncio
async def test_governance_contract_routes_are_mounted(client: AsyncClient):
    trust_response = await client.get("/v1/governance/trust")
    lifecycle_response = await client.get("/v1/governance/lifecycle")
    discovery_response = await client.get("/v1/governance/discovery")
    attestation_response = await client.get("/v1/governance/attestations")

    assert trust_response.status_code == 200
    assert trust_response.json() == {"items": []}
    assert lifecycle_response.status_code == 200
    assert lifecycle_response.json() == {"items": []}
    assert discovery_response.status_code == 200
    assert discovery_response.json() == {"items": []}
    assert attestation_response.status_code == 200
    assert attestation_response.json()["summary"]["identities"] == 0


@pytest.mark.asyncio
async def test_governance_contract_write_routes_update_identity(client: AsyncClient):
    trust_response = await client.post(
        "/v1/governance/trust/agent-1",
        json={
            "score": 720,
            "reason": "production launch",
            "credential_status": "brokered",
            "capability_scope": ["tools:read"],
        },
    )
    lifecycle_response = await client.post(
        "/v1/governance/lifecycle/agent-1",
        json={
            "state": "suspended",
            "reason": "operator pause",
            "apply_runtime_action": False,
        },
    )
    list_response = await client.get("/v1/governance/lifecycle")

    assert trust_response.status_code == 200
    assert trust_response.json()["trust_tier"] == "elevated"
    assert lifecycle_response.status_code == 200
    assert lifecycle_response.json()["lifecycle_status"] == "suspended"
    assert list_response.status_code == 200
    assert list_response.json()["items"][0]["agent_id"] == "agent-1"


@pytest.mark.asyncio
async def test_governance_attestation_verify_route(client: AsyncClient):
    response = await client.post("/v1/governance/attestations/verify")

    assert response.status_code == 200
    payload = response.json()
    assert payload["verified"] is True
    assert "coverage" in payload


@pytest.mark.asyncio
async def test_governance_contract_routes_require_internal_user(
    other_user_client: AsyncClient,
):
    trust_response = await other_user_client.get("/v1/governance/trust")
    lifecycle_response = await other_user_client.post(
        "/v1/governance/lifecycle/agent-1",
        json={"state": "suspended"},
    )
    attestations_response = await other_user_client.get("/v1/governance/attestations")

    assert trust_response.status_code == 403
    assert lifecycle_response.status_code == 403
    assert attestations_response.status_code == 403
