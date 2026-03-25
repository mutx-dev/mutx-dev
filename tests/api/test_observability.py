"""Tests for observability API routes."""

import uuid

import pytest


@pytest.mark.asyncio
async def test_create_observability_run(client):
    """Test creating an observability run with minimal fields."""
    response = await client.post(
        "/v1/observability/runs",
        json={
            "agent_id": "test-agent-001",
            "status": "running",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["agent_id"] == "test-agent-001"
    assert payload["status"] == "running"


@pytest.mark.asyncio
async def test_list_observability_runs(client):
    """Test listing observability runs."""
    await client.post(
        "/v1/observability/runs",
        json={
            "agent_id": "test-agent-002",
            "status": "completed",
        },
    )

    response = await client.get("/v1/observability/runs")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload


@pytest.mark.asyncio
async def test_get_observability_run(client):
    """Test getting a specific observability run."""
    create_response = await client.post(
        "/v1/observability/runs",
        json={
            "agent_id": "test-agent-003",
            "status": "running",
        },
    )
    run_id = create_response.json()["id"]

    response = await client.get(f"/v1/observability/runs/{run_id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == run_id
    assert payload["agent_id"] == "test-agent-003"


@pytest.mark.asyncio
async def test_get_nonexistent_run(client):
    """Test getting a run that doesn't exist."""
    response = await client.get(f"/v1/observability/runs/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_security_evaluate_endpoint(client):
    """Test the security action evaluation endpoint."""
    response = await client.post(
        "/v1/security/actions/evaluate",
        json={
            "tool_name": "bash",
            "tool_args": {"command": "ls"},
            "agent_id": "test-agent",
            "session_id": "test-session",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "decision" in payload


@pytest.mark.asyncio
async def test_security_metrics_endpoint(client):
    """Test the security metrics endpoint."""
    response = await client.get("/v1/security/metrics")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_security_compliance_endpoint(client):
    """Test the security compliance endpoint."""
    response = await client.get("/v1/security/compliance")
    assert response.status_code == 200
    payload = response.json()
    assert "version" in payload
