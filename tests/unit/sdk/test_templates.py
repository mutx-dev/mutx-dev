"""Tests for templates module."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.templates import (
    AssistantTemplate,
    TemplateDeployResponse,
    Templates,
)


# ---------------------------------------------------------------------------
# AssistantTemplate
# ---------------------------------------------------------------------------

class TestAssistantTemplateInit:
    def test_full_data(self):
        data = {
            "id": "tpl-001",
            "name": "Research Agent",
            "description": "A capable research agent",
            "category": "research",
            "icon": "🔬",
            "default_model": "claude-3-5-sonnet",
            "skills": ["web-search", "memory"],
            "config": {"temperature": 0.7},
        }
        tpl = AssistantTemplate(data)
        assert tpl.id == "tpl-001"
        assert tpl.name == "Research Agent"
        assert tpl.description == "A capable research agent"
        assert tpl.category == "research"
        assert tpl.icon == "🔬"
        assert tpl.default_model == "claude-3-5-sonnet"
        assert tpl.skills == ["web-search", "memory"]
        assert tpl.config == {"temperature": 0.7}
        assert tpl._data == data

    def test_minimal_data(self):
        """Required fields only; all optional fields fall back to defaults."""
        data = {"id": "tpl-002", "name": "Minimal Agent"}
        tpl = AssistantTemplate(data)
        assert tpl.id == "tpl-002"
        assert tpl.name == "Minimal Agent"
        assert tpl.description == ""
        assert tpl.category == ""
        assert tpl.icon is None
        assert tpl.default_model is None
        assert tpl.skills == []
        assert tpl.config == {}

    def test_missing_required_raises_key_error(self):
        with pytest.raises(KeyError):
            AssistantTemplate({"name": "no-id-here"})

    def test_repr(self):
        data = {"id": "tpl-003", "name": "Repr Test"}
        tpl = AssistantTemplate(data)
        r = repr(tpl)
        assert "tpl-003" in r
        assert "Repr Test" in r


# ---------------------------------------------------------------------------
# TemplateDeployResponse
# ---------------------------------------------------------------------------

class TestTemplateDeployResponse:
    def test_init(self):
        data = {
            "template_id": "tpl-abc",
            "agent": {"id": "agent-1", "name": "My Agent"},
            "deployment": {"id": "dep-1", "status": "starting"},
        }
        resp = TemplateDeployResponse(data)
        assert resp.template_id == "tpl-abc"
        assert resp.agent == {"id": "agent-1", "name": "My Agent"}
        assert resp.deployment == {"id": "dep-1", "status": "starting"}
        assert resp._data == data


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

class TestTemplatesInit:
    def test_sync_client(self):
        client = httpx.Client()
        t = Templates(client)
        assert t._client is client

    def test_async_client(self):
        client = httpx.AsyncClient()
        t = Templates(client)
        assert t._client is client


class TestRequireSyncClient:
    def test_raises_on_async_client(self):
        async_client = httpx.AsyncClient()
        t = Templates(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            t.list()

    def test_no_raise_on_sync_client(self):
        mock_client = MagicMock(spec=httpx.Client)
        t = Templates(mock_client)
        # Should not raise
        t._require_sync_client()


class TestRequireAsyncClient:
    def test_raises_on_sync_client(self):
        sync_client = httpx.Client()
        t = Templates(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(t.alist())

    def test_no_raise_on_async_client(self):
        mock_client = MagicMock(spec=httpx.AsyncClient)
        t = Templates(mock_client)
        # Should not raise
        t._require_async_client()


class TestTemplatesList:
    def test_list_success(self):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"id": "tpl-1", "name": "Template One"},
            {"id": "tpl-2", "name": "Template Two", "description": "Desc"},
        ]
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        t = Templates(mock_client)
        result = t.list()

        assert len(result) == 2
        assert all(isinstance(r, AssistantTemplate) for r in result)
        assert result[0].id == "tpl-1"
        assert result[1].id == "tpl-2"
        mock_client.get.assert_called_once_with("/templates")
        mock_response.raise_for_status.assert_called_once()

    def test_list_empty(self):
        mock_response = MagicMock()
        mock_response.json.return_value = []
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        t = Templates(mock_client)
        result = t.list()

        assert result == []


class TestTemplatesAList:
    def test_alist_success(self):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"id": "tpl-x", "name": "Async Template"},
        ]

        async def run():
            mock_client = MagicMock(spec=httpx.AsyncClient)
            mock_client.get.return_value = mock_response
            t = Templates(mock_client)
            result = await t.alist()
            assert len(result) == 1
            assert result[0].id == "tpl-x"
            mock_client.get.assert_called_once_with("/templates")

        asyncio.run(run())

    def test_alist_raises_on_sync_client(self):
        sync_client = httpx.Client()
        t = Templates(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(t.alist())


class TestTemplatesDeploy:
    def test_deploy_required_fields_only(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "template_id": "tpl-001",
            "agent": {"id": "agent-new"},
            "deployment": {"id": "dep-new"},
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        t = Templates(mock_client)
        result = t.deploy(template_id="tpl-001", name="My Agent")

        assert isinstance(result, TemplateDeployResponse)
        assert result.template_id == "tpl-001"
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args
        assert call_kwargs.kwargs["json"] == {"name": "My Agent", "replicas": 1}
        mock_response.raise_for_status.assert_called_once()

    def test_deploy_all_optional_fields(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "template_id": "tpl-002",
            "agent": {"id": "agent-full"},
            "deployment": {"id": "dep-full"},
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        t = Templates(mock_client)
        result = t.deploy(
            template_id="tpl-002",
            name="Full Agent",
            description="With everything set",
            model="gpt-4o",
            workspace="/my/workspace",
            assistant_id="asst-123",
            skills=["skill-a", "skill-b"],
            channels={"discord": {"enabled": True}},
            replicas=3,
            runtime_metadata={"env": "prod"},
        )

        payload = mock_client.post.call_args.kwargs["json"]
        assert payload["name"] == "Full Agent"
        assert payload["description"] == "With everything set"
        assert payload["model"] == "gpt-4o"
        assert payload["workspace"] == "/my/workspace"
        assert payload["assistant_id"] == "asst-123"
        assert payload["skills"] == ["skill-a", "skill-b"]
        assert payload["channels"] == {"discord": {"enabled": True}}
        assert payload["replicas"] == 3
        assert payload["runtime_metadata"] == {"env": "prod"}

    def test_deploy_skips_none_optional_fields(self):
        """Fields set to None must not appear in the payload."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "template_id": "tpl-003",
            "agent": {},
            "deployment": {},
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        t = Templates(mock_client)
        t.deploy(
            template_id="tpl-003",
            name="Sparse Agent",
            description=None,
            model=None,
            workspace=None,
            assistant_id=None,
            skills=None,
            channels=None,
            replicas=1,
            runtime_metadata=None,
        )

        payload = mock_client.post.call_args.kwargs["json"]
        # Only the two required fields
        assert payload == {"name": "Sparse Agent", "replicas": 1}

    def test_deploy_raises_on_async_client(self):
        async_client = httpx.AsyncClient()
        t = Templates(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            t.deploy(template_id="tpl-001", name="My Agent")


class TestTemplatesADeploy:
    def test_adeploy_success(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "template_id": "tpl-async",
            "agent": {"id": "agent-async"},
            "deployment": {"id": "dep-async"},
        }

        async def run():
            mock_client = MagicMock(spec=httpx.AsyncClient)
            mock_client.post.return_value = mock_response
            t = Templates(mock_client)
            result = await t.adeploy(template_id="tpl-async", name="Async Agent")
            assert isinstance(result, TemplateDeployResponse)
            assert result.template_id == "tpl-async"
            mock_client.post.assert_called_once()

        asyncio.run(run())

    def test_adeploy_raises_on_sync_client(self):
        sync_client = httpx.Client()
        t = Templates(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(t.adeploy(template_id="tpl-001", name="My Agent"))
