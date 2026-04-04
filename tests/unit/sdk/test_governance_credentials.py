"""
Comprehensive pytest coverage for governance_credentials SDK module.

Tests all public methods of GovernanceCredentials, CredentialBackend, and Credential,
using httpx.MockTransport for realistic HTTP-layer testing.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone as tz
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import httpx
import pytest

# Ensure mutx SDK is importable (supports both direct runs and pytest discovery)
_ROOT = Path(__file__).resolve().parents[3]  # .../MUTX
_SDK_ROOT = _ROOT / "sdk"
if str(_SDK_ROOT) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(_SDK_ROOT))

from mutx.governance_credentials import (
    Credential,
    CredentialBackend,
    GovernanceCredentials,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sync_transport(handler):
    """Build a sync httpx.Client with a MockTransport and base_url.

    base_url is required so httpx can construct a fully-qualified URL on the
    mocked request; without it httpx 0.28's cookie-extraction path raises a
    ValueError when the request URL has no scheme.
    """
    return httpx.Client(
        base_url="http://test", transport=httpx.MockTransport(handler)
    )


def _async_transport(handler):
    """Build an async httpx.AsyncClient with a MockTransport and base_url."""
    return httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    )


# ---------------------------------------------------------------------------
# CredentialBackend tests
# ---------------------------------------------------------------------------

class TestCredentialBackendInit:
    """Unit tests for CredentialBackend.__init__."""

    def test_required_fields(self):
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
        assert cb._data == data

    def test_is_active_default_true(self):
        cb = CredentialBackend({"name": "b", "backend": "v", "path": "/p", "ttl": 60})
        assert cb.is_active is True

    def test_is_active_explicit_false(self):
        cb = CredentialBackend(
            {"name": "b", "backend": "v", "path": "/p", "ttl": 60, "is_active": False}
        )
        assert cb.is_active is False

    def test_is_healthy_default_false(self):
        cb = CredentialBackend({"name": "b", "backend": "v", "path": "/p", "ttl": 60})
        assert cb.is_healthy is False

    def test_is_healthy_explicit_true(self):
        cb = CredentialBackend(
            {"name": "b", "backend": "v", "path": "/p", "ttl": 60, "is_healthy": True}
        )
        assert cb.is_healthy is True

    def test_all_backend_types(self):
        for backend_type in ("vault", "awssecrets", "gcpsm", "azurekv", "1password", "infisical"):
            cb = CredentialBackend(
                {"name": f"test-{backend_type}", "backend": backend_type, "path": "/p", "ttl": 60}
            )
            assert cb.backend == backend_type


class TestCredentialBackendRepr:
    def test_repr_contains_name_and_backend(self):
        cb = CredentialBackend(
            {"name": "my-backend", "backend": "awssecrets", "path": "/p", "ttl": 60}
        )
        r = repr(cb)
        assert "my-backend" in r
        assert "awssecrets" in r


# ---------------------------------------------------------------------------
# Credential tests
# ---------------------------------------------------------------------------

class TestCredentialInit:
    """Unit tests for Credential.__init__."""

    def test_required_fields(self):
        data = {
            "name": "api-key",
            "backend": "vault",
            "path": "vault:/secret/myapp/api-key",
            "has_value": True,
            "expires_at": "2025-06-15T12:00:00+00:00",
            "metadata": {"owner": "team-a", "env": "prod"},
        }
        c = Credential(data)
        assert c.name == "api-key"
        assert c.backend == "vault"
        assert c.path == "vault:/secret/myapp/api-key"
        assert c.has_value is True
        assert isinstance(c.expires_at, datetime)
        assert c.expires_at.year == 2025
        assert c.expires_at.month == 6
        assert c.expires_at.day == 15
        assert c.metadata == {"owner": "team-a", "env": "prod"}

    def test_expires_at_z_suffix_parsed(self):
        data = {
            "name": "key",
            "backend": "vault",
            "path": "/p",
            "has_value": True,
            "expires_at": "2025-01-01T00:00:00Z",
        }
        c = Credential(data)
        assert isinstance(c.expires_at, datetime)

    def test_expires_at_none(self):
        data = {
            "name": "key",
            "backend": "vault",
            "path": "/p",
            "has_value": False,
            "expires_at": None,
            "metadata": {},
        }
        c = Credential(data)
        assert c.expires_at is None

    def test_expires_at_missing_key(self):
        data = {
            "name": "key",
            "backend": "vault",
            "path": "/p",
            "has_value": True,
        }
        c = Credential(data)
        assert c.expires_at is None

    def test_metadata_defaults_empty_dict(self):
        data = {"name": "key", "backend": "vault", "path": "/p"}
        c = Credential(data)
        assert c.metadata == {}

    def test_has_value_defaults_false(self):
        data = {"name": "key", "backend": "vault", "path": "/p"}
        c = Credential(data)
        assert c.has_value is False


# ---------------------------------------------------------------------------
# GovernanceCredentials – client-type guard tests
# ---------------------------------------------------------------------------

class TestGovernanceCredentialsClientGuards:
    """Verify that sync/async client guards raise correctly."""

    def test_list_backends_rejects_async_client(self):
        gc = GovernanceCredentials(httpx.AsyncClient())
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.list_backends()

    def test_alist_backends_rejects_sync_client(self):
        gc = GovernanceCredentials(httpx.Client())
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.alist_backends())

    def test_register_backend_rejects_async_client(self):
        gc = GovernanceCredentials(httpx.AsyncClient())
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.register_backend("name", "vault", "/path")

    def test_aregister_backend_rejects_sync_client(self):
        gc = GovernanceCredentials(httpx.Client())
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.aregister_backend("name", "vault", "/path"))

    def test_unregister_backend_rejects_async_client(self):
        gc = GovernanceCredentials(httpx.AsyncClient())
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.unregister_backend("name")

    def test_aunregister_backend_rejects_sync_client(self):
        gc = GovernanceCredentials(httpx.Client())
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.aunregister_backend("name"))

    def test_check_backend_health_rejects_async_client(self):
        gc = GovernanceCredentials(httpx.AsyncClient())
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.check_backend_health("name")

    def test_acheck_backend_health_rejects_sync_client(self):
        gc = GovernanceCredentials(httpx.Client())
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.acheck_backend_health("name"))

    def test_health_check_rejects_async_client(self):
        gc = GovernanceCredentials(httpx.AsyncClient())
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.health_check()

    def test_ahealth_check_rejects_sync_client(self):
        gc = GovernanceCredentials(httpx.Client())
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.ahealth_check())

    def test_get_credential_rejects_async_client(self):
        gc = GovernanceCredentials(httpx.AsyncClient())
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gc.get_credential("vault:/secret/myapp/key")

    def test_aget_credential_rejects_sync_client(self):
        gc = GovernanceCredentials(httpx.Client())
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gc.aget_credential("vault:/secret/myapp/key"))


# ---------------------------------------------------------------------------
# GovernanceCredentials – sync method tests via MockTransport
# ---------------------------------------------------------------------------

class TestGovernanceCredentialsSyncListBackends:
    def test_list_backends_returns_list_of_credential_backends(self):
        backends_payload = [
            {
                "name": "vault-prod",
                "backend": "vault",
                "path": "https://vault.internal:8200",
                "ttl": 900,
                "is_active": True,
                "is_healthy": True,
            },
            {
                "name": "aws-prod",
                "backend": "awssecrets",
                "path": "/prod/myapp",
                "ttl": 3600,
                "is_active": False,
                "is_healthy": False,
            },
        ]

        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/governance/credentials/backends"
            return httpx.Response(200, json=backends_payload)

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        result = gc.list_backends()

        assert len(result) == 2
        assert isinstance(result[0], CredentialBackend)
        assert result[0].name == "vault-prod"
        assert result[0].backend == "vault"
        assert result[0].is_active is True
        assert result[0].is_healthy is True
        assert result[1].name == "aws-prod"
        assert result[1].backend == "awssecrets"
        assert result[1].is_active is False
        assert result[1].is_healthy is False

    def test_list_backends_empty_response(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        result = gc.list_backends()
        assert result == []

    def test_list_backends_raises_for_status(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(500, json={"detail": "server error"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.list_backends()


class TestGovernanceCredentialsSyncRegisterBackend:
    def test_register_backend_sends_correct_payload(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(201, json={"status": "registered"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        result = gc.register_backend(
            name="my-vault",
            backend="vault",
            path="https://vault.internal/secrets",
            ttl=3600,
            config={"role": "deploy"},
        )

        assert captured["path"] == "/governance/credentials/backends"
        assert captured["json"]["name"] == "my-vault"
        assert captured["json"]["backend"] == "vault"
        assert captured["json"]["path"] == "https://vault.internal/secrets"
        assert captured["json"]["ttl"] == 3600
        assert captured["json"]["config"] == {"role": "deploy"}
        assert result == {"status": "registered"}

    def test_register_backend_without_optional_config(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(201, json={"status": "registered"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        gc.register_backend(name="b", backend="vault", path="/p", ttl=60)

        assert "config" not in captured["json"]

    def test_register_backend_default_ttl(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(201, json={})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        gc.register_backend(name="b", backend="vault", path="/p")

        assert captured["json"]["ttl"] == 900

    def test_register_backend_raises_for_status(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(409, json={"detail": "backend already exists"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.register_backend("b", "vault", "/p")


class TestGovernanceCredentialsSyncUnregisterBackend:
    def test_unregister_backend_sends_delete_to_correct_path(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["method"] = request.method
            captured["path"] = request.url.path
            return httpx.Response(200, json={"status": "unregistered"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        result = gc.unregister_backend("vault-prod")

        assert captured["method"] == "DELETE"
        assert captured["path"] == "/governance/credentials/backends/vault-prod"
        assert result == {"status": "unregistered"}

    def test_unregister_backend_raises_for_status(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "not found"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.unregister_backend("nonexistent")


class TestGovernanceCredentialsSyncCheckBackendHealth:
    def test_check_backend_health_gets_correct_path(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["method"] = request.method
            captured["path"] = request.url.path
            return httpx.Response(
                200, json={"name": "vault-prod", "is_healthy": True, "latency_ms": 12}
            )

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        result = gc.check_backend_health("vault-prod")

        assert captured["method"] == "GET"
        assert captured["path"] == "/governance/credentials/backends/vault-prod/health"
        assert result["is_healthy"] is True

    def test_check_backend_health_raises_for_status(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "backend not found"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.check_backend_health("nonexistent")


class TestGovernanceCredentialsSyncHealthCheck:
    def test_health_check_gets_correct_path(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["method"] = request.method
            captured["path"] = request.url.path
            return httpx.Response(
                200,
                json={
                    "backends": [
                        {"name": "v1", "backend": "vault", "is_healthy": True},
                        {"name": "v2", "backend": "awssecrets", "is_healthy": False},
                    ]
                },
            )

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        result = gc.health_check()

        assert captured["method"] == "GET"
        assert captured["path"] == "/governance/credentials/health"
        assert len(result["backends"]) == 2

    def test_health_check_raises_for_status(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "service unavailable"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.health_check()


class TestGovernanceCredentialsSyncGetCredential:
    def test_get_credential_returns_credential_instance(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(
                200,
                json={
                    "name": "api-key",
                    "backend": "vault",
                    "path": "vault:/secret/myapp/api-key",
                    "has_value": True,
                    "expires_at": "2025-06-15T12:00:00+00:00",
                    "metadata": {"owner": "team-a"},
                },
            )

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        cred = gc.get_credential("vault:/secret/myapp/api-key")

        assert captured["path"] == "/governance/credentials/get/vault:/secret/myapp/api-key"
        assert isinstance(cred, Credential)
        assert cred.name == "api-key"
        assert cred.has_value is True
        assert cred.metadata == {"owner": "team-a"}

    def test_get_credential_all_supported_backend_paths(self):
        test_paths = [
            "vault:/secret/myapp/api-key",
            "awssecrets:/prod/myapp/api-key",
            "gcpsm:/my-project/my-secret",
            "azurekv:/myvault/mysecret",
            "1password:/my-vault/api-key",
            "infisical:/my-project/secret",
        ]

        for full_path in test_paths:
            captured_path = None

            def handler(request: httpx.Request) -> httpx.Response:
                nonlocal captured_path
                captured_path = request.url.path
                return httpx.Response(
                    200,
                    json={
                        "name": "key",
                        "backend": "vault",
                        "path": full_path,
                        "has_value": True,
                        "expires_at": None,
                        "metadata": {},
                    },
                )

            client = _sync_transport(handler)
            gc = GovernanceCredentials(client)
            gc.get_credential(full_path)
            assert captured_path == f"/governance/credentials/get/{full_path}"

    def test_get_credential_raises_for_status(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "credential not found"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.get_credential("vault:/nonexistent/key")


# ---------------------------------------------------------------------------
# GovernanceCredentials – async method tests via MockTransport
# ---------------------------------------------------------------------------

class TestGovernanceCredentialsAsyncListBackends:
    @pytest.mark.asyncio
    async def test_alist_backends_returns_list(self):
        backends_payload = [
            {
                "name": "vault-prod",
                "backend": "vault",
                "path": "/secret/prod",
                "ttl": 900,
            },
        ]

        async def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/governance/credentials/backends"
            return httpx.Response(200, json=backends_payload)

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        result = await gc.alist_backends()

        assert len(result) == 1
        assert isinstance(result[0], CredentialBackend)
        assert result[0].name == "vault-prod"


class TestGovernanceCredentialsAsyncRegisterBackend:
    @pytest.mark.asyncio
    async def test_aregister_backend_sends_correct_payload(self):
        captured: dict[str, Any] = {}

        async def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(201, json={"status": "registered"})

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        result = await gc.aregister_backend(
            name="async-vault",
            backend="vault",
            path="/async/path",
            ttl=1800,
            config={"key": "value"},
        )

        assert captured["path"] == "/governance/credentials/backends"
        assert captured["json"]["name"] == "async-vault"
        assert captured["json"]["ttl"] == 1800
        assert captured["json"]["config"] == {"key": "value"}
        assert result == {"status": "registered"}

    @pytest.mark.asyncio
    async def test_aregister_backend_without_config(self):
        captured: dict[str, Any] = {}

        async def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(201, json={})

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        await gc.aregister_backend(name="b", backend="vault", path="/p")

        assert "config" not in captured["json"]


class TestGovernanceCredentialsAsyncUnregisterBackend:
    @pytest.mark.asyncio
    async def test_aunregister_backend_sends_delete(self):
        captured: dict[str, Any] = {}

        async def handler(request: httpx.Request) -> httpx.Response:
            captured["method"] = request.method
            captured["path"] = request.url.path
            return httpx.Response(200, json={"status": "unregistered"})

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        result = await gc.aunregister_backend("my-backend")

        assert captured["method"] == "DELETE"
        assert captured["path"] == "/governance/credentials/backends/my-backend"
        assert result == {"status": "unregistered"}


class TestGovernanceCredentialsAsyncCheckBackendHealth:
    @pytest.mark.asyncio
    async def test_acheck_backend_health(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200, json={"name": "v", "is_healthy": True, "latency_ms": 5}
            )

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        result = await gc.acheck_backend_health("my-backend")

        assert result["is_healthy"] is True
        assert result["latency_ms"] == 5


class TestGovernanceCredentialsAsyncHealthCheck:
    @pytest.mark.asyncio
    async def test_ahealth_check(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/governance/credentials/health"
            return httpx.Response(
                200, json={"backends": [{"name": "v1", "is_healthy": True}]}
            )

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        result = await gc.ahealth_check()

        assert len(result["backends"]) == 1


class TestGovernanceCredentialsAsyncGetCredential:
    @pytest.mark.asyncio
    async def test_aget_credential(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "name": "api-key",
                    "backend": "vault",
                    "path": "vault:/secret/myapp/key",
                    "has_value": True,
                    "expires_at": "2025-06-15T12:00:00+00:00",
                    "metadata": {},
                },
            )

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        cred = await gc.aget_credential("vault:/secret/myapp/key")

        assert isinstance(cred, Credential)
        assert cred.has_value is True
        assert cred.name == "api-key"

    @pytest.mark.asyncio
    async def test_aget_credential_expires_at_none(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "name": "key",
                    "backend": "vault",
                    "path": "/p",
                    "has_value": False,
                    "expires_at": None,
                    "metadata": {},
                },
            )

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        cred = await gc.aget_credential("/p")

        assert cred.expires_at is None
        assert cred.has_value is False


# ---------------------------------------------------------------------------
# GovernanceCredentials – HTTP error propagation
# ---------------------------------------------------------------------------

class TestGovernanceCredentialsHttpErrors:
    """Verify HTTP errors propagate via raise_for_status."""

    @pytest.mark.asyncio
    async def test_alist_backends_raises_httperror(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(403, json={"detail": "forbidden"})

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        with pytest.raises(httpx.HTTPStatusError):
            await gc.alist_backends()

    def test_register_backend_raises_httperror(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(422, json={"detail": "validation error"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.register_backend("b", "vault", "/p")

    def test_unregister_backend_raises_httperror(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "not found"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.unregister_backend("nonexistent")

    def test_check_backend_health_raises_httperror(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(500, json={"detail": "internal error"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.check_backend_health("b")

    def test_health_check_raises_httperror(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "unavailable"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.health_check()

    def test_get_credential_raises_httperror(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "credential not found"})

        client = _sync_transport(handler)
        gc = GovernanceCredentials(client)
        with pytest.raises(httpx.HTTPStatusError):
            gc.get_credential("vault:/nonexistent/key")

    @pytest.mark.asyncio
    async def test_ahealth_check_raises_httperror(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "service unavailable"})

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        with pytest.raises(httpx.HTTPStatusError):
            await gc.ahealth_check()

    @pytest.mark.asyncio
    async def test_aget_credential_raises_httperror(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "not found"})

        async_client = _async_transport(handler)
        gc = GovernanceCredentials(async_client)
        with pytest.raises(httpx.HTTPStatusError):
            await gc.aget_credential("vault:/nonexistent/key")
