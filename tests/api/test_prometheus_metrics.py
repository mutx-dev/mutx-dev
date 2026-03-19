"""
Tests for Prometheus /metrics endpoint.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_returns_200(client_no_auth: AsyncClient):
    response = await client_no_auth.get("/metrics")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_returns_prometheus_format(
    client_no_auth: AsyncClient,
):
    response = await client_no_auth.get("/metrics")

    assert response.status_code == 200
    content = response.text
    assert (
        "# HELP" in content
        or "# TYPE" in content
        or any(line for line in content.split("\n") if line and not line.startswith("#"))
    )


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_content_type(client_no_auth: AsyncClient):
    response = await client_no_auth.get("/metrics")

    assert response.status_code == 200
    assert "text/plain" in response.headers.get("content-type", "")
    assert "version=0.0.4" in response.headers.get("content-type", "")
