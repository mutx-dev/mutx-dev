"""
SDK contract tests for governance_credentials module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import pytest

from mutx.governance_credentials import (
    Credential,
    CredentialBackend,
    GovernanceCredentials,
)


def _backend_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "test-vault",
        "backend": "vault",
        "path": "secret/test",
        "ttl": 900,
        "is_active": True,
        "is_healthy": False,
    }
    payload.update(overrides)
    return payload


def _credential_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "api-key",
        "backend": "vault",
        "path": "secret/test/api-key",
        "has_value": True,
        "expires_at": "2026-04-03T12:00:00",
        "metadata": {"owner": "test-team"},
    }
    payload.update(overrides)
    return payload


def _health_response_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "status": "healthy",
        "backends": [
            {"name": "test-vault", "backend": "vault", "is_healthy": True},
        ],
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# CredentialBackend tests
# ---------------------------------------------------------------------------


def test_credential_backend_parses_required_fields() -> None:
    backend = CredentialBackend(_backend_payload())

    assert backend.name == "test-vault"
    assert backend.backend == "vault"
    assert backend.path == "secret/test"
    assert backend.ttl == 900


def test_credential_backend_parses_optional_fields() -> None:
    backend = CredentialBackend(_backend_payload(is_active=False, is_healthy=True))

    assert backend.is_active is False
    assert backend.is_healthy is True


def test_credential_backend_repr() -> None:
    backend = CredentialBackend(_backend_payload())
    assert "test-vault" in repr(backend)
    assert "vault" in repr(backend)


# ---------------------------------------------------------------------------
# Credential tests
# ---------------------------------------------------------------------------


def test_credential_parses_required_fields() -> None:
    cred = Credential(_credential_payload())

    assert cred.name == "api-key"
    assert cred.backend == "vault"
    assert cred.path == "secret/test/api-key"
    assert cred.has_value is True


def test_credential_parses_expires_at() -> None:
    cred = Credential(_credential_payload(expires_at="2026-04-03T12:00:00"))

    assert cred.expires_at is not None
    assert isinstance(cred.expires_at, datetime)
    assert cred.expires_at.year == 2026
    assert cred.expires_at.month == 4
    assert cred.expires_at.day == 3


def test_credential_parses_null_expires_at() -> None:
    cred = Credential(_credential_payload(expires_at=None))

    assert cred.expires_at is None


def test_credential_parses_metadata() -> None:
    cred = Credential(_credential_payload(metadata={"env": "prod"}))

    assert cred.metadata == {"env": "prod"}


def test_credential_parses_explicit_null_expires_at() -> None:
    """When expires_at is explicitly null in the API response, expires_at is None."""
    cred = Credential(_credential_payload(expires_at=None))

    assert cred.expires_at is None


def test_credential_metadata_is_dict_from_response() -> None:
    """metadata field is whatever the API returns (None if explicitly null)."""
    cred = Credential(_credential_payload(metadata={"key": "value"}))
    assert cred.metadata == {"key": "value"}

    cred_null = Credential(_credential_payload(metadata=None))
    assert cred_null.metadata is None


# ---------------------------------------------------------------------------
# GovernanceCredentials: list_backends / alist_backends
# ---------------------------------------------------------------------------


def test_list_backends_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_backend_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    backends = gc.list_backends()

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "GET"
    assert len(backends) == 1
    assert backends[0].name == "test-vault"


def test_list_backends_returns_credential_backend_objects() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[_backend_payload(), _backend_payload(name="second")])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    backends = gc.list_backends()

    assert all(isinstance(b, CredentialBackend) for b in backends)
    assert backends[0].name == "test-vault"
    assert backends[1].name == "second"


def test_list_backends_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.list_backends()


def test_alist_backends_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_backend_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    asyncio.run(gc.alist_backends())

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "GET"


def test_alist_backends_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(gc.alist_backends())


# ---------------------------------------------------------------------------
# GovernanceCredentials: register_backend / aregister_backend
# ---------------------------------------------------------------------------


def test_register_backend_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(name="my-vault", backend="vault", path="secret/app", ttl=600)

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "POST"
    assert captured["json"]["name"] == "my-vault"
    assert captured["json"]["backend"] == "vault"
    assert captured["json"]["path"] == "secret/app"
    assert captured["json"]["ttl"] == 600


def test_register_backend_sends_config_when_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(
        name="my-vault",
        backend="vault",
        path="secret/app",
        ttl=600,
        config={"auth_method": "token"},
    )

    assert captured["json"]["config"] == {"auth_method": "token"}


def test_register_backend_omits_config_when_not_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(name="my-vault", backend="vault", path="secret/app")

    assert "config" not in captured["json"]


def test_register_backend_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.register_backend(name="x", backend="vault", path="y")


def test_aregister_backend_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    asyncio.run(gc.aregister_backend(name="async-vault", backend="vault", path="secret/app"))

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "POST"


def test_aregister_backend_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(gc.aregister_backend(name="x", backend="vault", path="y"))


# ---------------------------------------------------------------------------
# GovernanceCredentials: unregister_backend / aunregister_backend
# ---------------------------------------------------------------------------


def test_unregister_backend_hits_correct_route() -> None:
    captured: dict[str, Any] = {}
    backend_name = "my-vault"

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "unregistered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.unregister_backend(backend_name)

    assert captured["path"] == f"/governance/credentials/backends/{backend_name}"
    assert captured["method"] == "DELETE"


def test_unregister_backend_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.unregister_backend("my-vault")


def test_aunregister_backend_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "unregistered"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    asyncio.run(gc.aunregister_backend("my-vault"))

    assert captured["path"] == "/governance/credentials/backends/my-vault"
    assert captured["method"] == "DELETE"


def test_aunregister_backend_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(gc.aunregister_backend("my-vault"))


# ---------------------------------------------------------------------------
# GovernanceCredentials: check_backend_health / acheck_backend_health
# ---------------------------------------------------------------------------


def test_check_backend_health_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"name": "test-vault", "is_healthy": True})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.check_backend_health("test-vault")

    assert captured["path"] == "/governance/credentials/backends/test-vault/health"
    assert captured["method"] == "GET"


def test_check_backend_health_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.check_backend_health("test-vault")


def test_acheck_backend_health_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"name": "test-vault", "is_healthy": True})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    asyncio.run(gc.acheck_backend_health("test-vault"))

    assert captured["path"] == "/governance/credentials/backends/test-vault/health"
    assert captured["method"] == "GET"


def test_acheck_backend_health_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(gc.acheck_backend_health("test-vault"))


# ---------------------------------------------------------------------------
# GovernanceCredentials: health_check / ahealth_check
# ---------------------------------------------------------------------------


def test_health_check_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_health_response_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.health_check()

    assert captured["path"] == "/governance/credentials/health"
    assert captured["method"] == "GET"


def test_health_check_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.health_check()


def test_ahealth_check_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_health_response_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    asyncio.run(gc.ahealth_check())

    assert captured["path"] == "/governance/credentials/health"
    assert captured["method"] == "GET"


def test_ahealth_check_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(gc.ahealth_check())


# ---------------------------------------------------------------------------
# GovernanceCredentials: get_credential / aget_credential
# ---------------------------------------------------------------------------


def test_get_credential_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_credential_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    cred = gc.get_credential("vault:/secret/test/api-key")

    assert captured["path"] == "/governance/credentials/get/vault:/secret/test/api-key"
    assert captured["method"] == "GET"
    assert isinstance(cred, Credential)
    assert cred.name == "api-key"


def test_get_credential_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.get_credential("vault:/secret/test/api-key")


def test_aget_credential_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_credential_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    asyncio.run(gc.aget_credential("vault:/secret/test/api-key"))

    assert captured["path"] == "/governance/credentials/get/vault:/secret/test/api-key"
    assert captured["method"] == "GET"


def test_aget_credential_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(gc.aget_credential("vault:/secret/test/api-key"))


def test_aget_credential_returns_credential_object() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_credential_payload(name="my-secret"))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    cred = asyncio.run(gc.aget_credential("vault:/secret/my-secret"))

    assert isinstance(cred, Credential)
    assert cred.name == "my-secret"


# ---------------------------------------------------------------------------
# Error handling: raise_for_status is called
# ---------------------------------------------------------------------------


def test_list_backends_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "server error"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.list_backends()


def test_register_backend_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"detail": "bad request"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.register_backend(name="x", backend="vault", path="y")


def test_get_credential_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "not found"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.get_credential("vault:/nonexistent")
