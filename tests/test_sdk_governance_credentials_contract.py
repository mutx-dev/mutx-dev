"""
SDK contract tests for governance credentials module.
Tests verify that the SDK correctly maps to the /governance/credentials backend API contract.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Any

import httpx
import pytest

from mutx.governance_credentials import Credential, CredentialBackend, GovernanceCredentials


def _backend_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "test-backend",
        "backend": "vault",
        "path": "vault:/secret/test",
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
        "path": "vault:/secret/test/api-key",
        "has_value": True,
        "expires_at": "2026-04-14T10:00:00",
        "metadata": {"owner": "test-team"},
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Data model tests
# ---------------------------------------------------------------------------


def test_credential_backend_parses_required_fields() -> None:
    backend = CredentialBackend(_backend_payload())

    assert backend.name == "test-backend"
    assert backend.backend == "vault"
    assert backend.path == "vault:/secret/test"
    assert backend.ttl == 900


def test_credential_backend_parses_optional_fields() -> None:
    backend = CredentialBackend(_backend_payload(is_active=False, is_healthy=True))

    assert backend.is_active is False
    assert backend.is_healthy is True


def test_credential_backend_repr_includes_name_and_backend() -> None:
    backend = CredentialBackend(_backend_payload(name="my-vault", backend="vault"))
    assert "my-vault" in repr(backend)
    assert "vault" in repr(backend)


def test_credential_parses_required_fields() -> None:
    cred = Credential(_credential_payload())

    assert cred.name == "api-key"
    assert cred.backend == "vault"
    assert cred.path == "vault:/secret/test/api-key"
    assert cred.has_value is True


def test_credential_parses_optional_expires_at() -> None:
    cred = Credential(_credential_payload(expires_at="2026-05-01T12:00:00"))
    assert cred.expires_at is not None
    assert cred.expires_at.year == 2026


def test_credential_parses_optional_expires_at_none() -> None:
    cred = Credential(_credential_payload(expires_at=None))
    assert cred.expires_at is None


def test_credential_parses_metadata() -> None:
    cred = Credential(_credential_payload(metadata={"owner": "test-team", "env": "prod"}))
    assert cred.metadata["owner"] == "test-team"
    assert cred.metadata["env"] == "prod"


# ---------------------------------------------------------------------------
# list_backends / alist_backends
# ---------------------------------------------------------------------------


def test_list_backends_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_backend_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.list_backends()

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "GET"
    assert isinstance(result, list)
    assert isinstance(result[0], CredentialBackend)


def test_alist_backends_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_backend_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = asyncio.run(gc.alist_backends())

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "GET"
    assert isinstance(result, list)
    assert isinstance(result[0], CredentialBackend)


def test_list_backends_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.list_backends()


# ---------------------------------------------------------------------------
# register_backend / aregister_backend
# ---------------------------------------------------------------------------


def test_register_backend_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = dict(eval(request.content.decode()))
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.register_backend(
        name="my-vault",
        backend="vault",
        path="vault:/secret/myapp",
        ttl=1800,
        config={"auth_method": "token"},
    )

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "POST"
    assert captured["json"]["name"] == "my-vault"
    assert captured["json"]["backend"] == "vault"
    assert captured["json"]["path"] == "vault:/secret/myapp"
    assert captured["json"]["ttl"] == 1800
    assert captured["json"]["config"]["auth_method"] == "token"
    assert isinstance(result, dict)


def test_register_backend_defaults_ttl_when_not_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = dict(eval(request.content.decode()))
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(name="my-vault", backend="vault", path="vault:/secret/myapp")

    assert captured["json"]["ttl"] == 900  # default


def test_register_backend_omits_config_when_not_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = dict(eval(request.content.decode()))
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(name="my-vault", backend="vault", path="vault:/secret/myapp")

    assert "config" not in captured["json"]


def test_aregister_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(201, json={"status": "registered"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = asyncio.run(
        gc.aregister_backend(name="async-vault", backend="vault", path="vault:/secret/async")
    )

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "POST"
    assert isinstance(result, dict)


def test_register_backend_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.register_backend(name="x", backend="vault", path="vault:/x")


# ---------------------------------------------------------------------------
# unregister_backend / aunregister_backend
# ---------------------------------------------------------------------------


def test_unregister_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    backend_name = "my-vault"

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "unregistered"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.unregister_backend(backend_name)

    assert captured["path"] == f"/governance/credentials/backends/{backend_name}"
    assert captured["method"] == "DELETE"
    assert isinstance(result, dict)


def test_aunregister_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    backend_name = "async-vault"

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "unregistered"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = asyncio.run(gc.aunregister_backend(backend_name))

    assert captured["path"] == f"/governance/credentials/backends/{backend_name}"
    assert captured["method"] == "DELETE"
    assert isinstance(result, dict)


def test_unregister_backend_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.unregister_backend("my-vault")


# ---------------------------------------------------------------------------
# check_backend_health / acheck_backend_health
# ---------------------------------------------------------------------------


def test_check_backend_health_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    backend_name = "my-vault"

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "healthy", "backend": backend_name})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.check_backend_health(backend_name)

    assert captured["path"] == f"/governance/credentials/backends/{backend_name}/health"
    assert captured["method"] == "GET"
    assert isinstance(result, dict)
    assert result["status"] == "healthy"


def test_acheck_backend_health_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    backend_name = "async-vault"

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "healthy"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = asyncio.run(gc.acheck_backend_health(backend_name))

    assert captured["path"] == f"/governance/credentials/backends/{backend_name}/health"
    assert captured["method"] == "GET"
    assert isinstance(result, dict)


def test_check_backend_health_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.check_backend_health("my-vault")


# ---------------------------------------------------------------------------
# health_check / ahealth_check
# ---------------------------------------------------------------------------


def test_health_check_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"backends": [{"name": "vault", "is_healthy": True}]})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.health_check()

    assert captured["path"] == "/governance/credentials/health"
    assert captured["method"] == "GET"
    assert isinstance(result, dict)
    assert "backends" in result


def test_ahealth_check_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"backends": []})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = asyncio.run(gc.ahealth_check())

    assert captured["path"] == "/governance/credentials/health"
    assert captured["method"] == "GET"
    assert isinstance(result, dict)


def test_health_check_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.health_check()


# ---------------------------------------------------------------------------
# get_credential / aget_credential
# ---------------------------------------------------------------------------


def test_get_credential_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    full_path = "vault:/secret/myapp/api-key"

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_credential_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.get_credential(full_path)

    assert captured["path"] == f"/governance/credentials/get/{full_path}"
    assert captured["method"] == "GET"
    assert isinstance(result, Credential)
    assert result.name == "api-key"


def test_aget_credential_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    full_path = "vault:/secret/myapp/api-key"

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_credential_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = asyncio.run(gc.aget_credential(full_path))

    assert captured["path"] == f"/governance/credentials/get/{full_path}"
    assert captured["method"] == "GET"
    assert isinstance(result, Credential)


def test_get_credential_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.get_credential("vault:/secret/myapp/api-key")


def test_get_credential_returns_credential_instance() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_credential_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    cred = gc.get_credential("vault:/secret/myapp/api-key")

    assert isinstance(cred, Credential)
    assert cred.has_value is True
    assert cred.metadata == {"owner": "test-team"}
