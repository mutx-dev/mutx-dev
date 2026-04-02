"""
SDK contract tests for governance_credentials module.
Tests verify that the SDK correctly maps to the /governance/credentials API contract.
"""

from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.governance_credentials import (
    Credential,
    CredentialBackend,
    GovernanceCredentials,
)


# ---------------------------------------------------------------------------
# Payload factories
# ---------------------------------------------------------------------------


def _backend_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "vault-prod",
        "backend": "vault",
        "path": "secret/myapp",
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
        "path": "secret/myapp/api-key",
        "has_value": True,
        "expires_at": "2026-04-03T12:00:00",
        "metadata": {"owner": "platform"},
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# CredentialBackend model tests
# ---------------------------------------------------------------------------


def test_credential_backend_parses_required_fields() -> None:
    backend = CredentialBackend(_backend_payload())

    assert backend.name == "vault-prod"
    assert backend.backend == "vault"
    assert backend.path == "secret/myapp"
    assert backend.ttl == 900


def test_credential_backend_parses_optional_is_active() -> None:
    backend = CredentialBackend(_backend_payload(is_active=False))
    assert backend.is_active is False


def test_credential_backend_parses_optional_is_healthy() -> None:
    backend = CredentialBackend(_backend_payload(is_healthy=True))
    assert backend.is_healthy is True


def test_credential_backend_stores_raw_data() -> None:
    backend = CredentialBackend(_backend_payload())
    assert backend._data["name"] == "vault-prod"


def test_credential_backend_repr() -> None:
    backend = CredentialBackend(_backend_payload())
    assert "CredentialBackend" in repr(backend)
    assert "vault-prod" in repr(backend)


# ---------------------------------------------------------------------------
# Credential model tests
# ---------------------------------------------------------------------------


def test_credential_parses_required_fields() -> None:
    cred = Credential(_credential_payload())

    assert cred.name == "api-key"
    assert cred.backend == "vault"
    assert cred.path == "secret/myapp/api-key"
    assert cred.has_value is True


def test_credential_parses_optional_expires_at() -> None:
    cred = Credential(_credential_payload(expires_at="2026-04-10T08:00:00"))
    # datetime.fromisoformat preserves timezone from the string; "2026-04-10T08:00:00" is naive UTC
    assert cred.expires_at is not None


def test_credential_handles_null_expires_at() -> None:
    cred = Credential(_credential_payload(expires_at=None))
    assert cred.expires_at is None


def test_credential_parses_metadata() -> None:
    cred = Credential(_credential_payload(metadata={"env": "prod"}))
    assert cred.metadata["env"] == "prod"


def test_credential_stores_raw_data() -> None:
    cred = Credential(_credential_payload())
    assert cred._data["has_value"] is True


# ---------------------------------------------------------------------------
# GovernanceCredentials – sync client enforcement
# ---------------------------------------------------------------------------


def test_list_backends_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.list_backends()


def test_register_backend_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.register_backend(name="test", backend="vault", path="secret/test")


def test_unregister_backend_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.unregister_backend("test-backend")


def test_check_backend_health_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.check_backend_health("test-backend")


def test_health_check_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.health_check()


def test_get_credential_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        gc.get_credential("vault:/secret/test")


# ---------------------------------------------------------------------------
# GovernanceCredentials – async client enforcement
# ---------------------------------------------------------------------------


def test_alist_backends_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(gc.alist_backends())


def test_aregister_backend_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(gc.aregister_backend(name="test", backend="vault", path="secret/test"))


def test_aunregister_backend_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(gc.aunregister_backend("test-backend"))


def test_acheck_backend_health_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(gc.acheck_backend_health("test-backend"))


def test_ahealth_check_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(gc.ahealth_check())


def test_aget_credential_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    gc = GovernanceCredentials(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(gc.aget_credential("vault:/secret/test"))


# ---------------------------------------------------------------------------
# GovernanceCredentials – list_backends
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
    assert len(result) == 1
    assert isinstance(result[0], CredentialBackend)


def test_list_backends_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "server error"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.list_backends()


# ---------------------------------------------------------------------------
# GovernanceCredentials – alist_backends
# ---------------------------------------------------------------------------


def test_alist_backends_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_backend_payload()])

    client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    gc = GovernanceCredentials(client)

    import asyncio

    result = asyncio.run(gc.alist_backends())

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "GET"
    assert len(result) == 1
    assert isinstance(result[0], CredentialBackend)


# ---------------------------------------------------------------------------
# GovernanceCredentials – register_backend
# ---------------------------------------------------------------------------


def test_register_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "ok"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(name="vault-prod", backend="vault", path="secret/myapp", ttl=1800)

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "POST"
    assert captured["json"]["name"] == "vault-prod"
    assert captured["json"]["backend"] == "vault"
    assert captured["json"]["path"] == "secret/myapp"
    assert captured["json"]["ttl"] == 1800


def test_register_backend_with_config() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "ok"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(
        name="vault-prod",
        backend="vault",
        path="secret/myapp",
        config={"namespace": "admin"},
    )

    assert captured["json"]["config"] == {"namespace": "admin"}


def test_register_backend_default_ttl() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "ok"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.register_backend(name="test", backend="vault", path="secret/test")

    assert captured["json"]["ttl"] == 900  # default


def test_register_backend_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"detail": "invalid backend"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.register_backend(name="test", backend="vault", path="secret/test")


# ---------------------------------------------------------------------------
# GovernanceCredentials – aregister_backend
# ---------------------------------------------------------------------------


def test_aregister_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json={"status": "ok"})

    client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    gc = GovernanceCredentials(client)

    import asyncio

    asyncio.run(gc.aregister_backend(name="vault-prod", backend="vault", path="secret/myapp"))

    assert captured["path"] == "/governance/credentials/backends"
    assert captured["method"] == "POST"
    assert captured["json"]["name"] == "vault-prod"


# ---------------------------------------------------------------------------
# GovernanceCredentials – unregister_backend
# ---------------------------------------------------------------------------


def test_unregister_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "deleted"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.unregister_backend("vault-prod")

    assert captured["path"] == "/governance/credentials/backends/vault-prod"
    assert captured["method"] == "DELETE"


def test_unregister_backend_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "not found"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.unregister_backend("nonexistent")


# ---------------------------------------------------------------------------
# GovernanceCredentials – aunregister_backend
# ---------------------------------------------------------------------------


def test_aunregister_backend_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "deleted"})

    client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    gc = GovernanceCredentials(client)

    import asyncio

    asyncio.run(gc.aunregister_backend("vault-prod"))

    assert captured["path"] == "/governance/credentials/backends/vault-prod"
    assert captured["method"] == "DELETE"


# ---------------------------------------------------------------------------
# GovernanceCredentials – check_backend_health
# ---------------------------------------------------------------------------


def test_check_backend_health_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"healthy": True})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.check_backend_health("vault-prod")

    assert captured["path"] == "/governance/credentials/backends/vault-prod/health"
    assert captured["method"] == "GET"


def test_check_backend_health_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "internal error"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.check_backend_health("bad-backend")


# ---------------------------------------------------------------------------
# GovernanceCredentials – acheck_backend_health
# ---------------------------------------------------------------------------


def test_acheck_backend_health_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"healthy": True})

    client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    gc = GovernanceCredentials(client)

    import asyncio

    asyncio.run(gc.acheck_backend_health("vault-prod"))

    assert captured["path"] == "/governance/credentials/backends/vault-prod/health"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# GovernanceCredentials – health_check
# ---------------------------------------------------------------------------


def test_health_check_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "ok"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    gc.health_check()

    assert captured["path"] == "/governance/credentials/health"
    assert captured["method"] == "GET"


def test_health_check_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"detail": "unavailable"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.health_check()


# ---------------------------------------------------------------------------
# GovernanceCredentials – ahealth_check
# ---------------------------------------------------------------------------


def test_ahealth_check_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "ok"})

    client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    gc = GovernanceCredentials(client)

    import asyncio

    asyncio.run(gc.ahealth_check())

    assert captured["path"] == "/governance/credentials/health"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# GovernanceCredentials – get_credential
# ---------------------------------------------------------------------------


def test_get_credential_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_credential_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    result = gc.get_credential("vault:/secret/myapp/api-key")

    assert captured["path"] == "/governance/credentials/get/vault:/secret/myapp/api-key"
    assert captured["method"] == "GET"
    assert isinstance(result, Credential)
    assert result.name == "api-key"


def test_get_credential_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "credential not found"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    gc = GovernanceCredentials(client)

    with pytest.raises(httpx.HTTPStatusError):
        gc.get_credential("vault:/secret/nonexistent")


# ---------------------------------------------------------------------------
# GovernanceCredentials – aget_credential
# ---------------------------------------------------------------------------


def test_aget_credential_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_credential_payload())

    client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    gc = GovernanceCredentials(client)

    import asyncio

    result = asyncio.run(gc.aget_credential("vault:/secret/myapp/api-key"))

    assert captured["path"] == "/governance/credentials/get/vault:/secret/myapp/api-key"
    assert captured["method"] == "GET"
    assert isinstance(result, Credential)
    assert result.name == "api-key"
