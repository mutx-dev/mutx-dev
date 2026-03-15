"""
Tests for main.py endpoints: /, /health, /ready

These are critical infrastructure endpoints that need coverage
for the backend route test expansion task (issue #373).
"""

import pytest
from httpx import AsyncClient


class TestRootEndpoint:
    """Tests for GET / (root endpoint)"""

    @pytest.mark.asyncio
    async def test_root_returns_message_and_version(self, client: AsyncClient):
        """Test root endpoint returns expected response"""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["message"] == "mutx.dev API"
        assert data["version"] == "1.0.0"


class TestHealthEndpoint:
    """Tests for GET /health (health check endpoint)"""

    @pytest.mark.asyncio
    async def test_health_returns_ok(self, client: AsyncClient):
        """Test health endpoint returns expected response"""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"


class TestReadyEndpoint:
    """Tests for GET /ready (readiness check endpoint)"""

    @pytest.mark.asyncio
    async def test_ready_returns_status(self, client: AsyncClient):
        """Test ready endpoint returns expected response"""
        response = await client.get("/ready")
        
        # Returns 200 if ready, 503 if not
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
