"""
Tests for /deployments endpoints.
"""

from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import (
    Agent,
    AgentLog,
    AgentMetric,
    AgentStatus,
    Deployment,
    DeploymentEvent,
    DeploymentVersion,
)


class TestListDeployments:
    """Tests for GET /deployments endpoint."""

    @pytest.mark.asyncio
    async def test_list_deployments_empty(self, client: AsyncClient):
        """Test listing deployments when none exist."""
        response = await client.get("/v1/deployments")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_deployments_with_data(self, client: AsyncClient, test_deployment):
        """Test listing deployments returns all."""
        response = await client.get("/v1/deployments")
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

        response = await client.get("/v1/deployments?limit=2")
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
        response = await client.get(f"/v1/deployments?agent_id={test_agent.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["agent_id"] == str(test_agent.id)

    @pytest.mark.asyncio
    async def test_list_deployments_other_user_agent_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        """Test filtering by another user's agent is forbidden."""
        response = await other_user_client.get(f"/v1/deployments?agent_id={test_agent.id}")
        assert response.status_code == 403

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
        response = await client.get("/v1/deployments?status=running")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "running"


class TestGetDeployment:
    """Tests for GET /deployments/{deployment_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_deployment_success(self, client: AsyncClient, test_deployment):
        """Test getting a specific deployment."""
        response = await client.get(f"/v1/deployments/{test_deployment.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_deployment.id)
        assert data["status"] == test_deployment.status

    @pytest.mark.asyncio
    async def test_get_deployment_not_found(self, client: AsyncClient):
        """Test getting non-existent deployment returns 404."""
        response = await client.get("/v1/deployments/00000000-0000-0000-0000-999999999999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_deployment_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment
    ):
        """Test other users cannot read deployments they do not own."""
        response = await other_user_client.get(f"/v1/deployments/{test_deployment.id}")
        assert response.status_code == 403


class TestScaleDeployment:
    """Tests for POST /deployments/{deployment_id}/scale endpoint."""

    @pytest.mark.asyncio
    async def test_scale_deployment_success(self, client: AsyncClient, test_deployment):
        """Test scaling a deployment."""
        response = await client.post(
            f"/v1/deployments/{test_deployment.id}/scale",
            json={"replicas": 5},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["replicas"] == 5

    @pytest.mark.asyncio
    async def test_scale_deployment_not_found(self, client: AsyncClient):
        """Test scaling non-existent deployment returns 404."""
        response = await client.post(
            "/v1/deployments/00000000-0000-0000-0000-999999999999/scale",
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
            f"/v1/deployments/{test_deployment.id}/scale",
            json={"replicas": 5},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_scale_deployment_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment
    ):
        """Test other users cannot scale deployments they do not own."""
        response = await other_user_client.post(
            f"/v1/deployments/{test_deployment.id}/scale",
            json={"replicas": 5},
        )
        assert response.status_code == 403


class TestDeploymentEvents:
    """Tests for GET /deployments/{deployment_id}/events endpoint."""

    @pytest.mark.asyncio
    async def test_get_deployment_events_success(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        event = DeploymentEvent(
            deployment_id=test_deployment.id,
            event_type="scale",
            status=test_deployment.status,
            node_id="node-123",
        )
        db_session.add(event)
        await db_session.commit()

        response = await client.get(f"/v1/deployments/{test_deployment.id}/events")
        assert response.status_code == 200
        data = response.json()
        assert data["deployment_id"] == str(test_deployment.id)
        assert data["deployment_status"] == test_deployment.status
        assert data["total"] == 1
        assert data["skip"] == 0
        assert data["limit"] == 100
        assert len(data["items"]) == 1
        assert data["items"][0]["event_type"] == "scale"

    @pytest.mark.asyncio
    async def test_get_deployment_events_filter_by_type(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        db_session.add_all(
            [
                DeploymentEvent(
                    deployment_id=test_deployment.id,
                    event_type="scale",
                    status=test_deployment.status,
                ),
                DeploymentEvent(
                    deployment_id=test_deployment.id,
                    event_type="restart",
                    status="pending",
                ),
            ]
        )
        await db_session.commit()

        response = await client.get(
            f"/v1/deployments/{test_deployment.id}/events?event_type=restart"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["deployment_id"] == str(test_deployment.id)
        assert data["deployment_status"] == test_deployment.status
        assert data["total"] == 1
        assert data["event_type"] == "restart"
        assert data["status"] is None
        assert len(data["items"]) == 1
        assert data["items"][0]["event_type"] == "restart"

    @pytest.mark.asyncio
    async def test_get_deployment_events_filter_by_status_and_paginate(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        db_session.add_all(
            [
                DeploymentEvent(
                    deployment_id=test_deployment.id,
                    event_type="deploy.requested",
                    status="pending",
                ),
                DeploymentEvent(
                    deployment_id=test_deployment.id,
                    event_type="deploy.active",
                    status="active",
                ),
                DeploymentEvent(
                    deployment_id=test_deployment.id,
                    event_type="deploy.failed",
                    status="failed",
                ),
            ]
        )
        await db_session.commit()

        response = await client.get(
            f"/v1/deployments/{test_deployment.id}/events?status=failed&limit=1"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["deployment_id"] == str(test_deployment.id)
        assert data["deployment_status"] == test_deployment.status
        assert data["total"] == 1
        assert data["limit"] == 1
        assert data["status"] == "failed"
        assert len(data["items"]) == 1
        assert data["items"][0]["event_type"] == "deploy.failed"
        assert data["items"][0]["status"] == "failed"

    @pytest.mark.asyncio
    async def test_get_deployment_events_empty_history_returns_metadata(
        self, client: AsyncClient, test_deployment
    ):
        response = await client.get(f"/v1/deployments/{test_deployment.id}/events")
        assert response.status_code == 200

        data = response.json()
        assert data == {
            "deployment_id": str(test_deployment.id),
            "deployment_status": test_deployment.status,
            "items": [],
            "total": 0,
            "skip": 0,
            "limit": 100,
            "event_type": None,
            "status": None,
        }

    @pytest.mark.asyncio
    async def test_get_deployment_events_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment
    ):
        response = await other_user_client.get(f"/v1/deployments/{test_deployment.id}/events")
        assert response.status_code == 403


class TestDeploymentLogs:
    """Tests for GET /deployments/{deployment_id}/logs endpoint."""

    @pytest.mark.asyncio
    async def test_get_deployment_logs_supports_level_filter(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        db_session.add_all(
            [
                AgentLog(
                    agent_id=test_deployment.agent_id,
                    level="INFO",
                    message="startup complete",
                    extra_data='{"node":"node-1"}',
                ),
                AgentLog(
                    agent_id=test_deployment.agent_id,
                    level="ERROR",
                    message="probe failed",
                    extra_data='{"node":"node-1"}',
                ),
            ]
        )
        await db_session.commit()

        response = await client.get(
            f"/v1/deployments/{test_deployment.id}/logs?level=ERROR&limit=10"
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1
        assert data[0]["agent_id"] == str(test_deployment.agent_id)
        assert data[0]["level"] == "ERROR"
        assert data[0]["message"] == "probe failed"

    @pytest.mark.asyncio
    async def test_get_deployment_logs_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment
    ):
        response = await other_user_client.get(f"/v1/deployments/{test_deployment.id}/logs")
        assert response.status_code == 403


class TestDeploymentMetrics:
    """Tests for GET /deployments/{deployment_id}/metrics endpoint."""

    @pytest.mark.asyncio
    async def test_get_deployment_metrics_returns_agent_metrics_descending(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        db_session.add_all(
            [
                AgentMetric(
                    agent_id=test_deployment.agent_id,
                    cpu_usage=0.22,
                    memory_usage=0.40,
                    timestamp=datetime.fromisoformat("2026-03-12T09:00:00"),
                ),
                AgentMetric(
                    agent_id=test_deployment.agent_id,
                    cpu_usage=0.85,
                    memory_usage=0.92,
                    timestamp=datetime.fromisoformat("2026-03-12T09:10:00"),
                ),
            ]
        )
        await db_session.commit()

        response = await client.get(f"/v1/deployments/{test_deployment.id}/metrics?limit=10")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2
        assert data[0]["agent_id"] == str(test_deployment.agent_id)
        assert data[0]["cpu_usage"] == 0.85
        assert data[1]["cpu_usage"] == 0.22

    @pytest.mark.asyncio
    async def test_get_deployment_metrics_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment
    ):
        response = await other_user_client.get(f"/v1/deployments/{test_deployment.id}/metrics")
        assert response.status_code == 403


class TestKillDeployment:
    """Tests for DELETE /deployments/{deployment_id} endpoint."""

    @pytest.mark.asyncio
    async def test_kill_deployment_success(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test killing a deployment."""
        response = await client.delete(f"/v1/deployments/{test_deployment.id}")
        assert response.status_code == 204

        # Verify deployment status changed
        await db_session.refresh(test_deployment)
        assert test_deployment.status == "killed"
        assert test_deployment.ended_at is not None

    @pytest.mark.asyncio
    async def test_kill_deployment_not_found(self, client: AsyncClient):
        """Test killing non-existent deployment returns 404."""
        response = await client.delete("/v1/deployments/00000000-0000-0000-0000-999999999999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_kill_deployment_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment
    ):
        """Test other users cannot kill deployments they do not own."""
        response = await other_user_client.delete(f"/v1/deployments/{test_deployment.id}")
        assert response.status_code == 403

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

        response = await client.delete(f"/v1/deployments/{test_deployment.id}")
        assert response.status_code == 204

        # Verify agent status changed
        await db_session.refresh(test_agent)
        assert test_agent.status == AgentStatus.STOPPED.value


class TestCreateDeployment:
    """Tests for POST /deployments endpoint."""

    @pytest.mark.asyncio
    async def test_create_deployment_other_user_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        """Test other users cannot deploy agents they do not own."""
        response = await other_user_client.post(
            "/v1/deployments",
            json={"agent_id": str(test_agent.id), "replicas": 1},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_deployment_records_create_event_and_sets_agent_running(
        self, client: AsyncClient, test_agent, db_session: AsyncSession
    ):
        """Test canonical deployment creation persists lifecycle event metadata."""
        test_agent.status = AgentStatus.STOPPED.value
        await db_session.commit()

        response = await client.post(
            "/v1/deployments",
            json={"agent_id": str(test_agent.id), "replicas": 3},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["agent_id"] == str(test_agent.id)
        assert data["status"] == "pending"
        assert data["replicas"] == 3
        assert len(data["events"]) == 1
        assert data["events"][0]["event_type"] == "create"
        assert data["events"][0]["status"] == "pending"

        await db_session.refresh(test_agent)
        assert test_agent.status == AgentStatus.RUNNING.value

    @pytest.mark.asyncio
    async def test_create_deployment_rejects_agents_being_deleted(
        self, client: AsyncClient, test_agent, db_session: AsyncSession
    ):
        """Test canonical deployment creation rejects deleting agents."""
        test_agent.status = AgentStatus.DELETING.value
        await db_session.commit()

        response = await client.post(
            "/v1/deployments",
            json={"agent_id": str(test_agent.id), "replicas": 1},
        )

        assert response.status_code == 400
        assert response.json() == {"detail": "Cannot deploy an agent that is being deleted"}


class TestRestartDeployment:
    """Tests for POST /deployments/{deployment_id}/restart endpoint."""

    @pytest.mark.asyncio
    async def test_restart_deployment_success(
        self, client: AsyncClient, test_deployment, test_agent, db_session: AsyncSession
    ):
        """Restarting a stopped deployment should reset lifecycle fields and append an event."""
        test_deployment.status = "failed"
        test_deployment.ended_at = datetime.now(timezone.utc)
        test_deployment.error_message = "boot failed"
        test_agent.status = AgentStatus.STOPPED.value
        await db_session.commit()

        response = await client.post(f"/v1/deployments/{test_deployment.id}/restart")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == str(test_deployment.id)
        assert data["status"] == "pending"
        assert data["ended_at"] is None
        assert data["error_message"] is None

        events_response = await client.get(
            f"/v1/deployments/{test_deployment.id}/events?event_type=restart"
        )
        assert events_response.status_code == 200
        events_data = events_response.json()
        assert events_data["total"] == 1
        assert events_data["items"][0]["event_type"] == "restart"
        assert events_data["items"][0]["status"] == "pending"

        await db_session.refresh(test_agent)
        assert test_agent.status == AgentStatus.RUNNING.value

    @pytest.mark.asyncio
    async def test_restart_deployment_rejects_running_deployments(
        self, client: AsyncClient, test_deployment
    ):
        """Running deployments cannot be restarted via the restart contract."""
        response = await client.post(f"/v1/deployments/{test_deployment.id}/restart")
        assert response.status_code == 400
        assert "Cannot restart deployment with status 'running'" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_restart_deployment_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test other users cannot restart deployments they do not own."""
        test_deployment.status = "stopped"
        await db_session.commit()

        response = await other_user_client.post(f"/v1/deployments/{test_deployment.id}/restart")
        assert response.status_code == 403


class TestRollbackDeployment:
    """Tests for POST /deployments/{deployment_id}/rollback endpoint."""

    @pytest.mark.asyncio
    async def test_rollback_applies_snapshot_to_deployment_state(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Rollback should restore deployment config fields from the target snapshot."""
        test_deployment.version = "v2.0.0"
        test_deployment.replicas = 5
        await db_session.commit()

        db_session.add_all(
            [
                DeploymentVersion(
                    deployment_id=test_deployment.id,
                    version=1,
                    config_snapshot='{"replicas": 2, "version": "v1.0.0"}',
                    status="superseded",
                ),
                DeploymentVersion(
                    deployment_id=test_deployment.id,
                    version=2,
                    config_snapshot='{"replicas": 5, "version": "v2.0.0"}',
                    status="current",
                ),
            ]
        )
        await db_session.commit()

        response = await client.post(
            f"/v1/deployments/{test_deployment.id}/rollback",
            json={"version": 1},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "v1.0.0"
        assert data["replicas"] == 2

    @pytest.mark.asyncio
    async def test_rollback_deployment_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test other users cannot rollback deployments they do not own."""
        test_deployment.status = "stopped"
        await db_session.commit()

        db_session.add(
            DeploymentVersion(
                deployment_id=test_deployment.id,
                version=1,
                config_snapshot='{"replicas": 1, "version": "v1.0.0"}',
                status="current",
            )
        )
        await db_session.commit()

        response = await other_user_client.post(
            f"/v1/deployments/{test_deployment.id}/rollback",
            json={"version": 1},
        )
        assert response.status_code == 403



class TestDeploymentVersions:
    """Tests for GET /deployments/{deployment_id}/versions endpoint."""

    @pytest.mark.asyncio
    async def test_get_deployment_versions_success(
        self, client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test getting version history for a deployment."""
        db_session.add_all(
            [
                DeploymentVersion(
                    deployment_id=test_deployment.id,
                    version=1,
                    config_snapshot='{"replicas": 1, "version": "v1.0.0"}',
                    status="superseded",
                ),
                DeploymentVersion(
                    deployment_id=test_deployment.id,
                    version=2,
                    config_snapshot='{"replicas": 2, "version": "v2.0.0"}',
                    status="current",
                ),
            ]
        )
        await db_session.commit()

        response = await client.get(f"/v1/deployments/{test_deployment.id}/versions")
        assert response.status_code == 200
        data = response.json()
        assert data["deployment_id"] == str(test_deployment.id)
        assert data["total"] == 2
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_get_deployment_versions_other_user_forbidden(
        self, other_user_client: AsyncClient, test_deployment, db_session: AsyncSession
    ):
        """Test other users cannot view versions for deployments they do not own."""
        response = await other_user_client.get(f"/v1/deployments/{test_deployment.id}/versions")
        assert response.status_code == 403
