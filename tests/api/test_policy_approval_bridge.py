"""The approval bridge preserves tenant, entitlement and persistence boundaries."""

import uuid

import pytest
from sqlalchemy import select

from src.api.models.approval import ApprovalRecord
from src.api.routes.policies import _redact_approval_context_value
from src.api.services.policy_store import Policy, PolicyStore, Rule


async def approval_policy(db, user, decision="require_approval"):
    await PolicyStore(db, user.id).create_policy(
        Policy(
            id=str(uuid.uuid4()),
            name="deploy",
            enabled=True,
            version=1,
            rules=[
                Rule(
                    type="block" if decision == "block" else "allow",
                    pattern="deploy",
                    action=decision,
                    scope="tool",
                )
            ],
        )
    )


@pytest.mark.parametrize(
    "key", ["secret_key", "secretKey", "service_secret_key", "serviceSecretKey"]
)
def test_common_secret_keys_are_redacted(key):
    value, changed = _redact_approval_context_value({key: "private-value"})
    assert changed
    assert value == {key: "[REDACTED]"}


@pytest.mark.asyncio
async def test_bridge_persists_and_replays_owner_approval(
    client, db_session, test_user, other_user
):
    test_user.roles = ["DEVELOPER"]
    test_user.plan = "starter"
    await db_session.commit()
    await approval_policy(db_session, test_user)
    context = {"tool": "deploy", "run_id": "run-1", "tool_args": {"secretKey": "private-value"}}
    first = await client.post("/v1/policies/evaluate-and-request-approval", json=context)
    assert first.status_code == 200, first.text
    result = first.json()
    assert result["approval_created"] is True
    assert "private-value" not in first.text
    second = await client.post("/v1/policies/evaluate-and-request-approval", json=context)
    assert second.status_code == 200, second.text
    assert second.json()["approval_created"] is False
    assert second.json()["approval_request"]["id"] == result["approval_request"]["id"]
    records = (await db_session.execute(select(ApprovalRecord))).scalars().all()
    assert len(records) == 1
    assert records[0].owner_id == test_user.id
    assert records[0].payload["policy_matches"][0]["policy_name"] == "deploy"


@pytest.mark.asyncio
@pytest.mark.parametrize("roles,plan", [(["VIEWER"], "starter"), (["DEVELOPER"], "free")])
async def test_bridge_rejects_unentitled_users(client, db_session, test_user, roles, plan):
    test_user.roles = roles
    test_user.plan = plan
    await db_session.commit()
    response = await client.post(
        "/v1/policies/evaluate-and-request-approval", json={"tool": "deploy"}
    )
    assert response.status_code == (402 if plan == "free" else 403)
    assert not (await db_session.execute(select(ApprovalRecord))).scalars().all()


@pytest.mark.asyncio
@pytest.mark.parametrize("decision", ["allow", "warn", "block"])
async def test_bridge_does_not_create_approval_for_other_decisions(
    client, db_session, test_user, decision
):
    test_user.roles = ["DEVELOPER"]
    test_user.plan = "starter"
    await db_session.commit()
    await approval_policy(db_session, test_user, decision)
    response = await client.post(
        "/v1/policies/evaluate-and-request-approval", json={"tool": "deploy"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["approval_created"] is False
    assert response.json()["approval_request"] is None
    assert not (await db_session.execute(select(ApprovalRecord))).scalars().all()


@pytest.mark.asyncio
async def test_bridge_does_not_evaluate_other_tenants_policies(
    client, db_session, test_user, other_user
):
    test_user.roles = ["DEVELOPER"]
    test_user.plan = "starter"
    await db_session.commit()
    await approval_policy(db_session, other_user)
    response = await client.post(
        "/v1/policies/evaluate-and-request-approval", json={"tool": "deploy"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["decision"] == "allow"
    assert response.json()["approval_request"] is None
