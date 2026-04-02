"""Tests for clawhub module."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.clawhub import ClawHub, Skill


class TestSkill:
    def test_skill_init(self):
        data = {
            "id": "skill-123",
            "name": "test-skill",
            "description": "A test skill",
            "author": "test-author",
            "stars": 42,
            "category": "testing",
            "is_official": True,
        }
        skill = Skill(data)
        assert skill.id == "skill-123"
        assert skill.name == "test-skill"
        assert skill.description == "A test skill"
        assert skill.author == "test-author"
        assert skill.stars == 42
        assert skill.category == "testing"
        assert skill.is_official is True
        assert skill._data == data

    def test_skill_repr(self):
        data = {
            "id": "skill-456",
            "name": "my-skill",
            "description": "desc",
            "author": "alice",
            "stars": 10,
            "category": "utils",
        }
        skill = Skill(data)
        assert "skill-456" in repr(skill)
        assert "my-skill" in repr(skill)
        assert "alice" in repr(skill)

    def test_skill_is_official_defaults_false(self):
        data = {
            "id": "s1",
            "name": "n",
            "description": "d",
            "author": "a",
            "stars": 0,
            "category": "c",
        }
        skill = Skill(data)
        assert skill.is_official is False


class TestClawHub:
    def test_init_sync(self):
        client = httpx.Client()
        hub = ClawHub(client)
        assert hub._client is client

    def test_init_async(self):
        client = httpx.AsyncClient()
        hub = ClawHub(client)
        assert hub._client is client

    def test_list_skills_method_exists(self):
        client = httpx.Client()
        hub = ClawHub(client)
        assert callable(hub.list_skills)

    def test_alist_skills_method_exists(self):
        client = httpx.AsyncClient()
        hub = ClawHub(client)
        assert callable(hub.alist_skills)

    def test_list_skills_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        hub = ClawHub(async_client)
        with pytest.raises(RuntimeError, match="Use alist_skills"):
            hub.list_skills()

    def test_alist_skills_requires_async_client(self):
        """alist_skills is async; RuntimeError is raised inside the coroutine."""
        sync_client = httpx.Client()
        hub = ClawHub(sync_client)
        with pytest.raises(RuntimeError, match="Use list_skills"):
            asyncio.run(hub.alist_skills())

    def test_list_skills_returns_list_of_skills(self):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "id": "s1",
                "name": "Skill One",
                "description": "Desc 1",
                "author": "auth1",
                "stars": 5,
                "category": "cat1",
            },
            {
                "id": "s2",
                "name": "Skill Two",
                "description": "Desc 2",
                "author": "auth2",
                "stars": 10,
                "category": "cat2",
            },
        ]
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        hub = ClawHub(mock_client)
        skills = hub.list_skills()

        assert len(skills) == 2
        assert isinstance(skills[0], Skill)
        assert skills[0].name == "Skill One"
        mock_client.get.assert_called_once_with("/v1/clawhub/skills")

    def test_install_skill_method_exists(self):
        client = httpx.Client()
        hub = ClawHub(client)
        assert callable(hub.install_skill)

    def test_ainstall_skill_method_exists(self):
        client = httpx.AsyncClient()
        hub = ClawHub(client)
        assert callable(hub.ainstall_skill)

    def test_install_skill_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        hub = ClawHub(async_client)
        with pytest.raises(RuntimeError, match="Use ainstall_skill"):
            hub.install_skill("agent-1", "skill-1")

    def test_ainstall_skill_requires_async_client(self):
        sync_client = httpx.Client()
        hub = ClawHub(sync_client)
        with pytest.raises(RuntimeError, match="Use install_skill"):
            asyncio.run(hub.ainstall_skill("agent-1", "skill-1"))

    def test_uninstall_skill_method_exists(self):
        client = httpx.Client()
        hub = ClawHub(client)
        assert callable(hub.uninstall_skill)

    def test_auninstall_skill_method_exists(self):
        client = httpx.AsyncClient()
        hub = ClawHub(client)
        assert callable(hub.auninstall_skill)

    def test_uninstall_skill_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        hub = ClawHub(async_client)
        with pytest.raises(RuntimeError, match="Use auninstall_skill"):
            hub.uninstall_skill("agent-1", "skill-1")

    def test_auninstall_skill_requires_async_client(self):
        sync_client = httpx.Client()
        hub = ClawHub(sync_client)
        with pytest.raises(RuntimeError, match="Use uninstall_skill"):
            asyncio.run(hub.auninstall_skill("agent-1", "skill-1"))
