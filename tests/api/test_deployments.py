"""
Tests for /deployments endpoints.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Agent, Deployment, AgentStatus


class TestListDeployments:
    """Tests for GET /deployments endpoint."""
    
    @pytest.mark.asyncio
    async def test_list_deployments_empty(self, client: AsyncClient):
        """Test listing deployments when none exist."""
        response = await client.get("/deployments")
        assert response.status_code == 200
        assert response.json() == []
    
    @pytest.mark.asyncio
    async def test_list_deployments_with_data(
        self, client: AsyncClient, test_deployment
    ):
        """Test listing deployments returns all."""
        response = await client.get("/deployments")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(test_deployment.id)
    
    @pytest.mark.asyncio
    async def test_list_deployments_pagination(
        self, client: AsyncClient, db_session: AsyncSession, test_agent
    ):
        """Test deployment listing pagination."""
        # Create multiple deployments
        for i in range(5):
            deployment = Deployment(
                agent_id=test_agent.id,
                status="running",
                replicas=1,
            )
            db_session.add(deployment)
        await db_session.commit()
        
        response = await client.get("/deployments?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    @pytest.mark.asyncio
    async def test_list_deployments_by_agent_id(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession, test_agent
    ):
        """Test filtering deployments by agent_id."""
        # Create another agent with deployments
        other_agent = Agent(
            name="other-agent",
            description="Other agent",
            config="{}",
            user_id=test_agent.user_id,
            status=AgentStatus.CREATING.value,
        )
        db_session.add(other_agent)
        await db_session.commit()
        await db_session.refresh(other_agent)
        
        other_deployment = Deployment(
            agent_id=other_agent.id,
            status="running",
            replicas=1,
        )
        db_session.add(other_deployment)
        await db_session.commit()
        
        # Filter by agent_id
        response = await client.get(f"/deployments?agent_id={test_agent.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["agent_id"] == str(test_agent.id)
    
    @pytest.mark.asyncio
    async def test_list_deployments_by_status(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession, test_agent
    ):
        """Test filtering deployments by status."""
        # Create deployment with different status
        stopped_deployment = Deployment(
            agent_id=test_agent.id,
            status="stopped",
            replicas=0,
        )
        db_session.add(stopped_deployment)
        await db_session.commit()
        
        # Filter by status
        response = await client.get("/deployments?status=running")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "running"


class TestGetDeployment:
    """Tests for GET /deployments/{deployment_id} endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_deployment_success(
        self, client: AsyncClient, test_deployment
    ):
        """Test getting a specific deployment."""
        response = await client.get(f"/deployments/{test_deployment.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_deployment.id)
        assert data["status"] == test_deployment.status
    
    @pytest.mark.asyncio
    async def test_get_deployment_not_found(self, client: AsyncClient):
        """Test getting non-existent deployment returns 404."""
        response = await client.get(
            "/deployments/00000000-0000-0000-0000-999999999999"
        )
        assert response.status_code == 404


class TestScaleDeployment:
    """Tests for POST /deployments/{deployment_id}/scale endpoint."""
    
    @pytest.mark.asyncio
    async def test_scale_deployment_success(
        self, client: AsyncClient, test_deployment
    ):
        """Test scaling a deployment."""
        response = await client.post(
            f"/deployments/{test_deployment.id}/scale",
            json={"replicas": 5},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["replicas"] == 5
    
    @pytest.mark.asyncio
    async def test_scale_deployment_not_found(self, client: AsyncClient):
        """Test scaling non-existent deployment returns 404."""
        response = await client.post(
            "/deployments/00000000-0000-0000-0000-999999999999/scale",
            json={"replicas": 5},
        )
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_scale_deployment_invalid_status(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test scaling a non-running deployment fails."""
        # Change to stopped status
        test_deployment.status = "stopped"
        await db_session.commit()
        
        response = await client.post(
            f"/deployments/{test_deployment.id}/scale",
            json={"replicas": 5},
        )
        assert response.status_code == 400


class TestKillDeployment:
    """Tests for DELETE /deployments/{deployment_id} endpoint."""
    
    @pytest.mark.asyncio
    async def test_kill_deployment_success(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test killing a deployment."""
        response = await client.delete(f"/deployments/{test_deployment.id}")
        assert response.status_code == 204
        
        # Verify deployment status changed
        await db_session.refresh(test_deployment)
        assert test_deployment.status == "killed"
        assert test_deployment.ended_at is not None
    
    @pytest.mark.asyncio
    async def test_kill_deployment_not_found(self, client: AsyncClient):
        """Test killing non-existent deployment returns 404."""
        response = await client.delete(
            "/deployments/00000000-0000-0000-0000-999999999999"
        )
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_kill_deployment_stops_agent(
        self,
        client: AsyncClient,
        test_deployment,
        test_agent,
        db_session: AsyncSession,
    ):
        """Test that killing a deployment stops the associated agent."""
        # Set agent to running
        test_agent.status = AgentStatus.RUNNING.value
        test_deployment.status = "running"
        await db_session.commit()
        
        response = await client.delete(f"/deployments/{test_deployment.id}")
        assert response.status_code == 204
        
        # Verify agent status changed
        await db_session.refresh(test_agent)
        assert test_agent.status == AgentStatus.STOPPED.value
