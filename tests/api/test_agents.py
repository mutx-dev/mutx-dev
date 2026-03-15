"""
Tests for /agents endpoints.
"""

import json

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Agent, AgentStatus


class TestCreateAgent:
    """Tests for POST /agents endpoint."""

    @pytest.mark.asyncio
    async def test_create_agent_success(self, client: AsyncClient, test_user):
        """Test creating an agent successfully."""
        response = await client.post(
            "/api/agents",
            json={
                "name": "new-agent",
                "description": "A new test agent",
                "type": "openai",
                "config": {"model": "gpt-4o", "temperature": 0.7},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "new-agent"
        assert data["description"] == "A new test agent"
        assert data["type"] == "openai"
        assert data["status"] == "creating"
        assert data["config_version"] == 1

        # Verify validated config
        config = data["config"]
        assert config["name"] == "new-agent"
        assert config["model"] == "gpt-4o"
        assert config["temperature"] == 0.7
        assert config["version"] == 1
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_agent_invalid_config(self, client: AsyncClient):
        """Test creating an agent with invalid config schema."""
        response = await client.post(
            "/api/agents",
            json={
                "name": "invalid-config-agent",
                "type": "openai",
                "config": {"model": "gpt-4o", "temperature": 5.0},  # Invalid temperature > 2.0
            },
        )
        assert response.status_code == 400
        assert "Configuration validation failed" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_agent_with_minimal_data(self, client: AsyncClient):
        """Test creating an agent with minimal data."""
        response = await client.post(
            "/api/agents",
            json={
                "name": "minimal-agent",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "minimal-agent"
        assert data["config"]["name"] == "minimal-agent"
        assert data["config_version"] == 1


class TestListAgents:
    """Tests for GET /agents endpoint."""

    @pytest.mark.asyncio
    async def test_list_agents_empty(self, client: AsyncClient):
        """Test listing agents when none exist."""
        response = await client.get("/api/agents")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_agents_with_data(self, client: AsyncClient, test_agent):
        """Test listing agents returns user's agents."""
        response = await client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(test_agent.id)

    @pytest.mark.asyncio
    async def test_list_agents_pagination(
        self, client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test agent listing pagination."""
        # Create multiple agents
        for i in range(5):
            agent = Agent(
                name=f"agent-{i}",
                description=f"Agent {i}",
                config="{}",
                user_id=test_user.id,
                status=AgentStatus.CREATING,
            )
            db_session.add(agent)
        await db_session.commit()

        response = await client.get("/api/agents?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_list_agents_scoped_to_authenticated_user(
        self, client: AsyncClient, test_agent, other_user_client: AsyncClient
    ):
        """Test listing agents always uses the authenticated user scope."""
        # Test user can see their own agents
        response = await client.get("/api/agents")
        assert len(response.json()) == 1

        # Other user sees empty list
        response = await other_user_client.get("/api/agents")
        assert len(response.json()) == 0

        # Supplying user_id in query must not expand access scope
        response = await other_user_client.get(f"/api/agents?user_id={test_agent.user_id}")
        assert response.status_code == 200
        assert response.json() == []


class TestGetAgent:
    """Tests for GET /agents/{agent_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_agent_success(self, client: AsyncClient, test_agent):
        """Test getting a specific agent."""
        response = await client.get(f"/api/agents/{test_agent.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_agent.id)
        assert data["name"] == test_agent.name

    @pytest.mark.asyncio
    async def test_get_agent_not_found(self, client: AsyncClient):
        """Test getting non-existent agent returns 404."""
        response = await client.get("/api/agents/00000000-0000-0000-0000-999999999999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_agent_other_user_forbidden(
        self, client: AsyncClient, test_agent, other_user_client: AsyncClient
    ):
        """Test that users cannot access other users' agents."""
        response = await other_user_client.get(f"/api/agents/{test_agent.id}")
        assert response.status_code == 403


class TestDeleteAgent:
    """Tests for DELETE /agents/{agent_id} endpoint."""

    @pytest.mark.asyncio
    async def test_delete_agent_success(
        self, client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test deleting an agent."""
        # Create agent to delete
        agent = Agent(
            name="to-delete",
            description="Will be deleted",
            config="{}",
            user_id=test_user.id,
            status=AgentStatus.CREATING,
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.delete(f"/api/agents/{agent.id}")
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_agent_not_found(self, client: AsyncClient):
        """Test deleting non-existent agent returns 404."""
        response = await client.delete("/api/agents/00000000-0000-0000-0000-999999999999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_agent_other_user_forbidden(
        self, client: AsyncClient, test_agent, other_user_client: AsyncClient
    ):
        """Test that users cannot delete other users' agents."""
        response = await other_user_client.delete(f"/api/agents/{test_agent.id}")
        assert response.status_code == 403


class TestAgentConfig:
    """Tests for /agents/{agent_id}/config endpoints."""

    @pytest.mark.asyncio
    async def test_get_agent_config_success(self, client: AsyncClient, test_agent):
        response = await client.get(f"/api/agents/{test_agent.id}/config")
        assert response.status_code == 200

        data = response.json()
        assert data["agent_id"] == str(test_agent.id)
        assert data["type"] == "openai"
        assert data["config"]["model"] == "gpt-4"
        assert data["config"]["temperature"] == 0.7
        assert data["config_version"] == 1

    @pytest.mark.asyncio
    async def test_update_agent_config_success(self, client: AsyncClient, test_agent):
        response = await client.patch(
            f"/api/agents/{test_agent.id}/config",
            json={"config": {"model": "gpt-4o-mini", "temperature": 0.2, "max_tokens": 256}},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["config"]["name"] == test_agent.name
        assert data["config"]["model"] == "gpt-4o-mini"
        assert data["config"]["temperature"] == 0.2
        assert data["config"]["max_tokens"] == 256
        assert data["config"]["version"] == 2
        assert data["config_version"] == 2

    @pytest.mark.asyncio
    async def test_update_agent_config_accepts_json_string(self, client: AsyncClient, test_agent):
        response = await client.patch(
            f"/api/agents/{test_agent.id}/config",
            json={"config": json.dumps({"model": "gpt-4o", "temperature": 0.1})},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["config"]["model"] == "gpt-4o"
        assert data["config"]["temperature"] == 0.1
        assert data["config"]["version"] == 2

    @pytest.mark.asyncio
    async def test_update_agent_config_invalid_config(self, client: AsyncClient, test_agent):
        response = await client.patch(
            f"/api/agents/{test_agent.id}/config",
            json={"config": {"model": "gpt-4o", "temperature": 3.5}},
        )
        assert response.status_code == 400
        assert "Configuration validation failed" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_update_agent_config_other_user_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        response = await other_user_client.patch(
            f"/api/agents/{test_agent.id}/config",
            json={"config": {"model": "gpt-4o", "temperature": 0.3}},
        )
        assert response.status_code == 403


class TestDeployAgent:
    """Tests for POST /agents/{agent_id}/deploy endpoint."""

    @pytest.mark.asyncio
    async def test_deploy_agent_success(
        self, client: AsyncClient, test_agent, db_session: AsyncSession
    ):
        """Test deploying an agent."""
        response = await client.post(f"/api/agents/{test_agent.id}/deploy")
        assert response.status_code == 200
        data = response.json()
        assert "deployment_id" in data
        assert data["status"] == "deploying"

        # Verify agent status changed
        await db_session.refresh(test_agent)
        assert test_agent.status == AgentStatus.RUNNING

    @pytest.mark.asyncio
    async def test_deploy_agent_not_found(self, client: AsyncClient):
        """Test deploying non-existent agent returns 404."""
        response = await client.post("/api/agents/00000000-0000-0000-0000-999999999999/deploy")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_deploy_agent_other_user_forbidden(
        self, client: AsyncClient, test_agent, other_user_client: AsyncClient
    ):
        """Test that users cannot deploy other users' agents."""
        response = await other_user_client.post(f"/api/agents/{test_agent.id}/deploy")
        assert response.status_code == 403


class TestStopAgent:
    """Tests for POST /agents/{agent_id}/stop endpoint."""

    @pytest.mark.asyncio
    async def test_stop_agent_success(
        self, client: AsyncClient, test_agent, test_deployment, db_session: AsyncSession
    ):
        """Test stopping an agent."""
        # First deploy to have running deployment
        test_agent.status = AgentStatus.RUNNING
        test_deployment.status = "running"
        await db_session.commit()

        response = await client.post(f"/api/agents/{test_agent.id}/stop")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "stopped"

    @pytest.mark.asyncio
    async def test_stop_agent_not_found(self, client: AsyncClient):
        """Test stopping non-existent agent returns 404."""
        response = await client.post("/api/agents/00000000-0000-0000-0000-999999999999/stop")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_stop_agent_other_user_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        """Test that users cannot stop other users' agents."""
        response = await other_user_client.post(f"/api/agents/{test_agent.id}/stop")
        assert response.status_code == 403


class TestAgentLogs:
    """Tests for GET /agents/{agent_id}/logs endpoint."""

    @pytest.mark.asyncio
    async def test_get_agent_logs_success(self, client: AsyncClient, test_agent):
        """Test getting agent logs."""
        response = await client.get(f"/api/agents/{test_agent.id}/logs")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_agent_logs_not_found(self, client: AsyncClient):
        """Test getting logs for non-existent agent returns 404."""
        response = await client.get("/api/agents/00000000-0000-0000-0000-999999999999/logs")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_agent_logs_other_user_forbidden(
        self, client: AsyncClient, test_agent, other_user_client: AsyncClient
    ):
        """Test that users cannot access other users' agent logs."""
        response = await other_user_client.get(f"/api/agents/{test_agent.id}/logs")
        assert response.status_code == 403


class TestAgentMetrics:
    """Tests for GET /agents/{agent_id}/metrics endpoint."""

    @pytest.mark.asyncio
    async def test_get_agent_metrics_success(self, client: AsyncClient, test_agent):
        """Test getting agent metrics."""
        response = await client.get(f"/api/agents/{test_agent.id}/metrics")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_agent_metrics_not_found(self, client: AsyncClient):
        """Test getting metrics for non-existent agent returns 404."""
        response = await client.get("/api/agents/00000000-0000-0000-0000-999999999999/metrics")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_agent_metrics_other_user_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        """Test that users cannot access other users' agent metrics."""
        response = await other_user_client.get(f"/api/agents/{test_agent.id}/metrics")
        assert response.status_code == 403
