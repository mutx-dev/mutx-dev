"""Tests for /v1/security route — AARM security layer endpoints."""

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# POST /v1/security/actions/evaluate
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_evaluate_action_returns_decision(client: AsyncClient):
    """Evaluate action returns a policy decision."""
    response = await client.post(
        "/v1/security/actions/evaluate",
        json={
            "tool_name": "file_read",
            "tool_args": {"path": "/etc/passwd"},
            "agent_id": "agent-001",
            "session_id": "session-001",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "decision" in data
    assert "action_id" in data
    assert "action_hash" in data
    assert data["decision"] in ("permit", "deny", "defer")


@pytest.mark.asyncio
async def test_evaluate_action_missing_required_fields(client: AsyncClient):
    """Missing required fields returns 422."""
    response = await client.post(
        "/v1/security/actions/evaluate",
        json={"tool_name": "file_read"},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /v1/security/approvals/request
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_request_approval_success(client: AsyncClient):
    """Request approval creates a pending approval."""
    response = await client.post(
        "/v1/security/approvals/request",
        json={
            "tool_name": "file_write",
            "tool_args": {"path": "/tmp/test"},
            "agent_id": "agent-001",
            "session_id": "session-001",
            "reason": "Needs human review",
            "timeout_minutes": 5,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "request_id" in data
    assert "token" in data
    assert data["status"] == "pending"
    assert data["tool_name"] == "file_write"


@pytest.mark.asyncio
async def test_request_approval_missing_fields(client: AsyncClient):
    """Missing required fields returns 422."""
    response = await client.post(
        "/v1/security/approvals/request",
        json={"tool_name": "file_write"},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /v1/security/approvals/{request_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_approval_not_found(client: AsyncClient):
    """Non-existent approval returns 404."""
    response = await client.get("/v1/security/approvals/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_approval_after_request(client: AsyncClient):
    """GET approval after request returns the approval details."""
    # Create an approval first
    create_resp = await client.post(
        "/v1/security/approvals/request",
        json={
            "tool_name": "bash_exec",
            "tool_args": {"cmd": "rm -rf /tmp/test"},
            "agent_id": "agent-002",
            "session_id": "session-002",
            "reason": "Destructive command",
        },
    )
    assert create_resp.status_code == 201
    request_id = create_resp.json()["request_id"]

    response = await client.get(f"/v1/security/approvals/{request_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request_id
    assert data["status"] == "pending"


# ---------------------------------------------------------------------------
# POST /v1/security/approvals/{token}/approve
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_approve_request_success(client: AsyncClient):
    """Approve a pending request returns 200."""
    # Create approval
    create_resp = await client.post(
        "/v1/security/approvals/request",
        json={
            "tool_name": "file_delete",
            "agent_id": "agent-003",
            "session_id": "session-003",
        },
    )
    token = create_resp.json()["token"]

    response = await client.post(
        f"/v1/security/approvals/{token}/approve",
        json={"reviewer": "admin@mutx.dev", "comment": "Looks safe"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"


@pytest.mark.asyncio
async def test_approve_already_resolved(client: AsyncClient):
    """Approving an already-resolved request returns 400."""
    create_resp = await client.post(
        "/v1/security/approvals/request",
        json={
            "tool_name": "file_copy",
            "agent_id": "agent-004",
            "session_id": "session-004",
        },
    )
    token = create_resp.json()["token"]

    # Approve once
    await client.post(
        f"/v1/security/approvals/{token}/approve",
        json={"reviewer": "admin@mutx.dev"},
    )
    # Approve again
    response = await client.post(
        f"/v1/security/approvals/{token}/approve",
        json={"reviewer": "admin@mutx.dev"},
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# POST /v1/security/approvals/{token}/deny
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_deny_request_success(client: AsyncClient):
    """Deny a pending request returns 200."""
    create_resp = await client.post(
        "/v1/security/approvals/request",
        json={
            "tool_name": "network_access",
            "agent_id": "agent-005",
            "session_id": "session-005",
        },
    )
    token = create_resp.json()["token"]

    response = await client.post(
        f"/v1/security/approvals/{token}/deny",
        json={"reviewer": "admin@mutx.dev", "comment": "Too risky"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "denied"


# ---------------------------------------------------------------------------
# GET /v1/security/approvals  — list pending
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_pending_approvals(client: AsyncClient):
    """List pending approvals returns a list."""
    response = await client.get("/v1/security/approvals")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ---------------------------------------------------------------------------
# GET /v1/security/receipts/{receipt_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_receipt_not_found(client: AsyncClient):
    """Non-existent receipt returns 404."""
    response = await client.get("/v1/security/receipts/nonexistent")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /v1/security/receipts/session/{session_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_session_receipts(client: AsyncClient):
    """Session receipts endpoint returns structured response."""
    response = await client.get("/v1/security/receipts/session/test-session")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "count" in data
    assert "receipts" in data


# ---------------------------------------------------------------------------
# GET /v1/security/compliance
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_compliance_check(client: AsyncClient):
    """Compliance check returns AARM conformance report."""
    response = await client.get("/v1/security/compliance")
    assert response.status_code == 200
    data = response.json()
    assert "overall_satisfied" in data
    assert "version" in data
    assert "results" in data


# ---------------------------------------------------------------------------
# GET /v1/security/metrics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_metrics(client: AsyncClient):
    """Metrics endpoint returns governance counters."""
    response = await client.get("/v1/security/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_evaluations" in data
    assert "permits" in data
    assert "denials" in data
    assert "defers" in data


# ---------------------------------------------------------------------------
# GET /v1/security/metrics/prometheus
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_prometheus_metrics(client: AsyncClient):
    """Prometheus metrics returns plain text."""
    response = await client.get("/v1/security/metrics/prometheus")
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# POST /v1/security/sessions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_security_session(client: AsyncClient):
    """Create a security session returns session context."""
    response = await client.post(
        "/v1/security/sessions",
        params={"session_id": "sec-001", "agent_id": "agent-010"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "sec-001"
    assert "created_at" in data


# ---------------------------------------------------------------------------
# GET /v1/security/sessions/{session_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_security_session_not_found(client: AsyncClient):
    """Non-existent security session returns 404."""
    response = await client.get("/v1/security/sessions/does-not-exist")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_security_session_after_create(client: AsyncClient):
    """GET session after creating returns session summary."""
    await client.post(
        "/v1/security/sessions",
        params={"session_id": "sec-002", "agent_id": "agent-011"},
    )
    response = await client.get("/v1/security/sessions/sec-002")
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# DELETE /v1/security/sessions/{session_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_close_security_session(client: AsyncClient):
    """Close session returns 200 with closed status."""
    await client.post(
        "/v1/security/sessions",
        params={"session_id": "sec-003", "agent_id": "agent-012"},
    )
    response = await client.delete("/v1/security/sessions/sec-003")
    assert response.status_code == 200
    assert response.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_close_security_session_not_found(client: AsyncClient):
    """Closing non-existent session returns 404."""
    response = await client.delete("/v1/security/sessions/nonexistent")
    assert response.status_code == 404
