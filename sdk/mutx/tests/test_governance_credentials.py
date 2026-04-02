"""Tests for governance_credentials module."""

from __future__ import annotations

import asyncio
from datetime import datetime
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.governance_credentials import (
    Credential,
    CredentialBackend,
    GovernanceCredentials,
)


class TestCredentialBackend:
    def test_init_required_fields(self):
        data = {
            "name": "vault-prod",
            "backend": "vault",
            "path": "https://vault.internal:8200",
            "ttl": 900,
        }
        cb = CredentialBackend(data)
        assert cb.name == "vault-prod"
        assert cb.backend == "vault"
        assert cb.path == "https://vault.internal:8200"
        assert cb.ttl == 900

    def test_init_optional_fields(self):
        data = {
            "name": "vault-prod",
            "backend": "vault",
            "path": "/secret/path",
            "ttl": 3600,
            "is_active": False,
            "is_healthy": True,
        }
        cb = CredentialBackend(data)
        assert cb.is_active is False
        assert cb.is_healthy is True

    def test_init_is_active_defaults_true(self):
        data = {
            "name": "test",
            "backend": "vault",
            "path": "/path",
            "ttl": 900,
        }
        cb = CredentialBackend(data)
        assert cb.is_active is True

    def test_init_is_healthy_defaults_false(self):
        data = {
            "name": "test",
            "backend": "vault",
            "path": "/path",
            "ttl": 900,
        }
        cb = CredentialBackend(data)
        assert cb.is_healthy is False

    def test_repr(self):
        data = {
            "name": "my-backend",
            "backend": "awssecrets",
            "path": "/prod/myapp",
            "ttl": 900,
        }
        cb = CredentialBackend(data)
        r = repr(cb)
        assert "my-backend" in r
        assert "awssecrets" in r


class TestCredential:
    def test_init_required_fields(self):
        data = {
            "name": "api-key",
            "backend": "vault",
            "path": "vault:/secret/myapp/api-key",
            "has_value": True,
            "expires_at": "2025-01-01T00:00:00+00:00",
            "metadata": {"owner": "team-a"},
        }
        c = Credential(data)
        assert c.name == "api-key"
        assert c.backend == "vault"
        assert c.path == "vault:/secret/myapp/api-key"
        assert c.has_value is True
        assert isinstance(c.expires_at, datetime)
        assert c.metadata == {"owner": "team-a"}

    def test_init_expires_at_none(self):
        data = {
            "name": "api-key",
            "backend": "vault",
            "path": "/path",
            "has_value": False,
            "expires_at": None,
            "metadata": {},
        }
        c = Credential(data)
        assert c.expires_at is None

    def test_init_metadata_defaults_empty(self):
        data = {
            "name": "key",
            "backend": "vault",
            "path": "/path",
        }
        c = Credential(data)
        assert c.metadata == {}


class TestGovernanceCredentials:
    def test_init_sync(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert gc._client is client

    def test_init_async(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert gc._client is client

    def test_require_sync_client_raises_on_async(self):
        async_client = httpx.AsyncClient()
        gc = GovernanceCredentials(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.list_backends()

    def test_require_async_client_raises_on_sync(self):
        sync_client = httpx.Client()
        gc = GovernanceCredentials(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.alist_backends())

    def test_list_backends_method_exists(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert callable(gc.list_backends)

    def test_alist_backends_method_exists(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert callable(gc.alist_backends)

    def test_list_backends_returns_backends(self):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "name": "vault-prod",
                "backend": "vault",
                "path": "/secret/prod",
                "ttl": 900,
            },
        ]
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gc = GovernanceCredentials(mock_client)
        result = gc.list_backends()

        assert len(result) == 1
        assert isinstance(result[0], CredentialBackend)
        assert result[0].name == "vault-prod"

    def test_register_backend_method_exists(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert callable(gc.register_backend)

    def test_aregister_backend_method_exists(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert callable(gc.aregister_backend)

    def test_register_backend_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        gc = GovernanceCredentials(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.register_backend("name", "vault", "/path")

    def test_aregister_backend_requires_async_client(self):
        sync_client = httpx.Client()
        gc = GovernanceCredentials(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.aregister_backend("name", "vault", "/path"))

    def test_unregister_backend_method_exists(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert callable(gc.unregister_backend)

    def test_aunregister_backend_method_exists(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert callable(gc.aunregister_backend)

    def test_unregister_backend_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        gc = GovernanceCredentials(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.unregister_backend("name")

    def test_aunregister_backend_requires_async_client(self):
        sync_client = httpx.Client()
        gc = GovernanceCredentials(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.aunregister_backend("name"))

    def test_check_backend_health_method_exists(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert callable(gc.check_backend_health)

    def test_acheck_backend_health_method_exists(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert callable(gc.acheck_backend_health)

    def test_health_check_method_exists(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert callable(gc.health_check)

    def test_ahealth_check_method_exists(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert callable(gc.ahealth_check)

    def test_get_credential_method_exists(self):
        client = httpx.Client()
        gc = GovernanceCredentials(client)
        assert callable(gc.get_credential)

    def test_aget_credential_method_exists(self):
        client = httpx.AsyncClient()
        gc = GovernanceCredentials(client)
        assert callable(gc.aget_credential)

    def test_get_credential_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        gc = GovernanceCredentials(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.get_credential("vault:/secret/myapp/key")

    def test_aget_credential_requires_async_client(self):
        sync_client = httpx.Client()
        gc = GovernanceCredentials(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.aget_credential("vault:/secret/myapp/key"))

    def test_health_check_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        gc = GovernanceCredentials(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.health_check()

    def test_ahealth_check_requires_async_client(self):
        sync_client = httpx.Client()
        gc = GovernanceCredentials(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.ahealth_check())
