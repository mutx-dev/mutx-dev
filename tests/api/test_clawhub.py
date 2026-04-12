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
    async def test_install_bundle_requires_auth(self, client_no_auth: AsyncClient, test_agent):
        response = await client_no_auth.post(
            "/v1/clawhub/install-bundle",
            json={"agent_id": str(test_agent.id), "bundle_id": "orchestra-research-foundation"},
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

    @pytest.mark.asyncio
    async def test_list_skills_includes_workspace_skills(
        self, client: AsyncClient, tmp_path, monkeypatch
    ):
        skill_dir = tmp_path / "workspace-skills" / "demo-skill"
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(
            "# Demo Skill\nA workspace-discovered skill.\n",
            encoding="utf-8",
        )
        monkeypatch.setenv("OPENCLAW_SKILLS_DIR", str(tmp_path / "workspace-skills"))

        response = await client.get("/v1/clawhub/skills")

        assert response.status_code == 200
        payload = response.json()
        assert any(skill["id"] == "demo-skill" for skill in payload)

    @pytest.mark.asyncio
    async def test_list_bundles_returns_orchestra_catalog(self, client: AsyncClient):
        response = await client.get("/v1/clawhub/bundles")

        assert response.status_code == 200
        payload = response.json()
        assert any(bundle["id"] == "orchestra-research-foundation" for bundle in payload)

    @pytest.mark.asyncio
    async def test_install_bundle_returns_updated_skill_state(
        self, client: AsyncClient, monkeypatch, test_agent
    ):
        monkeypatch.setattr(
            "src.api.routes.clawhub.install_skill_bundle",
            lambda agent, bundle_id: {
                "bundle_id": bundle_id,
                "installed_skill_ids": ["langchain", "llamaindex"],
                "unavailable_skill_ids": ["0-autoresearch-skill"],
                "skills": ["langchain", "llamaindex"],
            },
        )
        monkeypatch.setattr(
            "src.api.routes.clawhub.list_assistant_skills",
            lambda agent: [
                {
                    "id": "langchain",
                    "name": "LangChain",
                    "description": "desc",
                    "author": "Orchestra Research",
                    "category": "Agents",
                    "source": "orchestra-research",
                    "is_official": False,
                    "installed": True,
                    "tags": ["agents"],
                    "path": "/tmp/langchain",
                    "canonical_name": "langchain",
                    "upstream_path": "14-agents/langchain",
                    "upstream_repo": "https://github.com/Orchestra-Research/AI-Research-SKILLs",
                    "upstream_commit": "05f1958",
                    "license": "MIT",
                    "available": True,
                }
            ],
        )

        response = await client.post(
            "/v1/clawhub/install-bundle",
            json={"agent_id": str(test_agent.id), "bundle_id": "orchestra-research-foundation"},
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["bundle_id"] == "orchestra-research-foundation"
        assert payload["installed_skill_ids"] == ["langchain", "llamaindex"]
        assert payload["unavailable_skill_ids"] == ["0-autoresearch-skill"]
        assert payload["skills"][0]["id"] == "langchain"
