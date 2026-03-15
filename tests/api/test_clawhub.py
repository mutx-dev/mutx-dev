"""Tests for /clawhub endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Agent, AgentStatus


class TestClawHubSkillManagement:
    @pytest.mark.asyncio
    async def test_install_skill_requires_auth(self, client_no_auth: AsyncClient, test_agent):
        response = await client_no_auth.post(
            "/v1/clawhub/install",
            json={"agent_id": str(test_agent.id), "skill_id": "web_search"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_install_skill_other_user_forbidden(
        self,
        other_user_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
    ):
        agent = Agent(
            name="owned-by-test-user",
            description="for clawhub auth test",
            config="{}",
            user_id=test_user.id,
            status=AgentStatus.CREATING,
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await other_user_client.post(
            "/v1/clawhub/install",
            json={"agent_id": str(agent.id), "skill_id": "web_search"},
        )

        assert response.status_code == 403
