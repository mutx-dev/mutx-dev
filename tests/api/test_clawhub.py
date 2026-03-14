"""Tests for /clawhub endpoints."""

import pytest
from httpx import AsyncClient


class TestClawHubSkillManagementAuthz:
    """Authorization checks for install/uninstall operations."""

    @pytest.mark.asyncio
    async def test_install_skill_requires_authentication(
        self, client_no_auth: AsyncClient, test_agent
    ):
        response = await client_no_auth.post(
            "/clawhub/install",
            json={"agent_id": str(test_agent.id), "skill_id": "skill-demo"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_install_skill_for_other_user_agent_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        response = await other_user_client.post(
            "/clawhub/install",
            json={"agent_id": str(test_agent.id), "skill_id": "skill-demo"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_uninstall_skill_for_other_user_agent_forbidden(
        self, other_user_client: AsyncClient, test_agent
    ):
        response = await other_user_client.post(
            "/clawhub/uninstall",
            json={"agent_id": str(test_agent.id), "skill_id": "skill-demo"},
        )

        assert response.status_code == 403
