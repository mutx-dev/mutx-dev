"""Tests for runtime module."""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from mutx.runtime import GovernanceStatus, Runtime, RuntimeProviderSnapshot


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

PROVIDER_NAME = "test-provider"
BASE_URL = "https://api.test"


def _provider_snapshot_data(**overrides: Any) -> dict[str, Any]:
    data = {
        "provider": PROVIDER_NAME,
        "credentials": {"api_key": "sk-test-123"},
        "config": {"region": "us-east-1"},
        "status": "active",
        "updated_at": "2026-04-03T04:00:00Z",
    }
    data.update(overrides)
    return data


def _governance_status_data(**overrides: Any) -> dict[str, Any]:
    data = {
        "daemon_reachable": True,
        "socket_reachable": True,
        "policy_loaded": True,
        "version": "1.2.0",
        "policy_name": "default",
        "decisions_total": 42,
        "permits_today": 30,
        "denies_today": 5,
        "defers_today": 7,
        "pending_approvals": 2,
        "status": "running",
        "error": None,
    }
    data.update(overrides)
    return data


def _make_sync_runtime(handler):
    client = httpx.Client(base_url=BASE_URL, transport=httpx.MockTransport(handler))
    return Runtime(client), client


async def _make_async_runtime(handler):
    client = httpx.AsyncClient(
        base_url=BASE_URL, transport=httpx.MockTransport(handler)
    )
    return Runtime(client), client


# ---------------------------------------------------------------------------
# RuntimeProviderSnapshot
# ---------------------------------------------------------------------------

class TestRuntimeProviderSnapshot:
    def test_init_full_data(self):
        data = _provider_snapshot_data()
        snap = RuntimeProviderSnapshot(data)
        assert snap.provider == PROVIDER_NAME
        assert snap.credentials == {"api_key": "sk-test-123"}
        assert snap.config == {"region": "us-east-1"}
        assert snap.status == "active"
        assert snap.updated_at == "2026-04-03T04:00:00Z"
        assert snap._data == data

    def test_init_optional_fields_missing(self):
        data = {"provider": PROVIDER_NAME}
        snap = RuntimeProviderSnapshot(data)
        assert snap.provider == PROVIDER_NAME
        assert snap.credentials is None
        assert snap.config == {}
        assert snap.status == "unknown"
        assert snap.updated_at is None

    def test_init_status_defaults_to_unknown(self):
        data = {"provider": PROVIDER_NAME, "credentials": None}
        snap = RuntimeProviderSnapshot(data)
        assert snap.status == "unknown"

    def test_repr(self):
        snap = RuntimeProviderSnapshot({"provider": PROVIDER_NAME})
        assert repr(snap) == f"RuntimeProviderSnapshot(provider={PROVIDER_NAME})"


# ---------------------------------------------------------------------------
# GovernanceStatus
# ---------------------------------------------------------------------------

class TestGovernanceStatus:
    def test_init_full_data(self):
        data = _governance_status_data()
        status = GovernanceStatus(data)
        assert status.daemon_reachable is True
        assert status.socket_reachable is True
        assert status.policy_loaded is True
        assert status.version == "1.2.0"
        assert status.policy_name == "default"
        assert status.decisions_total == 42
        assert status.permits_today == 30
        assert status.denies_today == 5
        assert status.defers_today == 7
        assert status.pending_approvals == 2
        assert status.status == "running"
        assert status.error is None
        assert status._data == data

    def test_init_defaults(self):
        data: dict[str, Any] = {}
        status = GovernanceStatus(data)
        assert status.daemon_reachable is False
        assert status.socket_reachable is False
        assert status.policy_loaded is False
        assert status.version is None
        assert status.policy_name is None
        assert status.decisions_total == 0
        assert status.permits_today == 0
        assert status.denies_today == 0
        assert status.defers_today == 0
        assert status.pending_approvals == 0
        assert status.status == "unknown"
        assert status.error is None

    def test_init_with_error(self):
        data = _governance_status_data(error="connection refused")
        status = GovernanceStatus(data)
        assert status.error == "connection refused"


# ---------------------------------------------------------------------------
# Runtime – sync client path
# ---------------------------------------------------------------------------

class TestRuntimeSyncClient:
    def test_get_provider_state_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = _make_sync_runtime(handler)
        try:
            snap = runtime.get_provider_state(PROVIDER_NAME)
            assert captured["path"] == f"/runtime/providers/{PROVIDER_NAME}"
            assert snap.provider == PROVIDER_NAME
            assert snap.status == "active"
        finally:
            client.close()

    def test_get_provider_state_raises_on_http_error(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"error": "not found"})

        runtime, client = _make_sync_runtime(handler)
        try:
            with pytest.raises(httpx.HTTPStatusError):
                runtime.get_provider_state(PROVIDER_NAME)
        finally:
            client.close()

    def test_upsert_provider_state_full_payload(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = _make_sync_runtime(handler)
        try:
            credentials = {"api_key": "sk-new"}
            config = {"region": "eu-west-1"}
            snap = runtime.upsert_provider_state(
                PROVIDER_NAME, credentials=credentials, config=config
            )
            assert captured["path"] == f"/runtime/providers/{PROVIDER_NAME}"
            assert captured["json"]["provider"] == PROVIDER_NAME
            assert captured["json"]["credentials"] == credentials
            assert captured["json"]["config"] == config
            assert snap.provider == PROVIDER_NAME
        finally:
            client.close()

    def test_upsert_provider_state_minimal(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json=_provider_snapshot_data(provider=PROVIDER_NAME))

        runtime, client = _make_sync_runtime(handler)
        try:
            snap = runtime.upsert_provider_state(PROVIDER_NAME)
            assert captured["json"] == {"provider": PROVIDER_NAME}
            assert snap.provider == PROVIDER_NAME
        finally:
            client.close()

    def test_upsert_provider_state_only_credentials(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = _make_sync_runtime(handler)
        try:
            runtime.upsert_provider_state(PROVIDER_NAME, credentials={"api_key": "x"})
            assert captured["json"]["credentials"] == {"api_key": "x"}
            assert "config" not in captured["json"]
        finally:
            client.close()

    def test_upsert_provider_state_only_config(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = _make_sync_runtime(handler)
        try:
            runtime.upsert_provider_state(PROVIDER_NAME, config={"timeout": 30})
            assert captured["json"]["config"] == {"timeout": 30}
            assert "credentials" not in captured["json"]
        finally:
            client.close()

    def test_get_governance_metrics_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, text="decisions_total 42\npermits_today 30\n")

        runtime, client = _make_sync_runtime(handler)
        try:
            metrics = runtime.get_governance_metrics()
            assert captured["path"] == "/runtime/governance/metrics"
            assert "decisions_total 42" in metrics
        finally:
            client.close()

    def test_get_governance_status_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=_governance_status_data())

        runtime, client = _make_sync_runtime(handler)
        try:
            status = runtime.get_governance_status()
            assert captured["path"] == "/runtime/governance/status"
            assert status.version == "1.2.0"
            assert status.decisions_total == 42
            assert status.daemon_reachable is True
        finally:
            client.close()

    def test_get_governance_status_raises_on_http_error(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"error": "service unavailable"})

        runtime, client = _make_sync_runtime(handler)
        try:
            with pytest.raises(httpx.HTTPStatusError):
                runtime.get_governance_status()
        finally:
            client.close()

    @pytest.mark.asyncio
    async def test_sync_method_rejects_async_client(self):
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_provider_snapshot_data())

        async with httpx.AsyncClient(
            base_url=BASE_URL, transport=httpx.MockTransport(handler)
        ) as client:
            runtime = Runtime(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                runtime.get_provider_state(PROVIDER_NAME)


# ---------------------------------------------------------------------------
# Runtime – async client path
# ---------------------------------------------------------------------------

class TestRuntimeAsyncClient:
    @pytest.mark.asyncio
    async def test_aget_provider_state_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = await _make_async_runtime(handler)
        try:
            snap = await runtime.aget_provider_state(PROVIDER_NAME)
            assert captured["path"] == f"/runtime/providers/{PROVIDER_NAME}"
            assert snap.provider == PROVIDER_NAME
        finally:
            await client.aclose()

    @pytest.mark.asyncio
    async def test_aupsert_provider_state_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = await _make_async_runtime(handler)
        try:
            snap = await runtime.aupsert_provider_state(
                PROVIDER_NAME,
                credentials={"api_key": "sk-async"},
                config={"region": "ap-south-1"},
            )
            assert captured["path"] == f"/runtime/providers/{PROVIDER_NAME}"
            assert captured["json"]["credentials"] == {"api_key": "sk-async"}
            assert captured["json"]["config"] == {"region": "ap-south-1"}
            assert snap.provider == PROVIDER_NAME
        finally:
            await client.aclose()

    @pytest.mark.asyncio
    async def test_aupsert_provider_state_minimal(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json=_provider_snapshot_data())

        runtime, client = await _make_async_runtime(handler)
        try:
            await runtime.aupsert_provider_state(PROVIDER_NAME)
            assert captured["json"] == {"provider": PROVIDER_NAME}
        finally:
            await client.aclose()

    @pytest.mark.asyncio
    async def test_aget_governance_metrics_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, text="decisions_total 99\n")

        runtime, client = await _make_async_runtime(handler)
        try:
            metrics = await runtime.aget_governance_metrics()
            assert captured["path"] == "/runtime/governance/metrics"
            assert "decisions_total 99" in metrics
        finally:
            await client.aclose()

    @pytest.mark.asyncio
    async def test_aget_governance_status_success(self):
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=_governance_status_data(version="2.0.0"))

        runtime, client = await _make_async_runtime(handler)
        try:
            status = await runtime.aget_governance_status()
            assert captured["path"] == "/runtime/governance/status"
            assert status.version == "2.0.0"
            assert status.permits_today == 30
        finally:
            await client.aclose()

    @pytest.mark.asyncio
    async def test_async_method_rejects_sync_client(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_provider_snapshot_data())

        # Deliberately pass a sync client to Runtime then call an async method.
        runtime, client = _make_sync_runtime(handler)
        try:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await runtime.aget_provider_state(PROVIDER_NAME)
        finally:
            client.close()
