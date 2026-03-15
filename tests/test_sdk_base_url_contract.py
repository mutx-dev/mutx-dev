from __future__ import annotations

import asyncio
import sys
import warnings
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx import MutxAsyncClient, MutxClient
from mutx._url import normalize_api_base_url
from mutx.agent_runtime import MutxAgentClient, MutxAgentSyncClient


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("https://app.mutx.dev/v1", "https://app.mutx.dev"),
        ("https://app.mutx.dev/api", "https://app.mutx.dev"),
        ("https://app.mutx.dev/api/v1", "https://app.mutx.dev"),
        ("https://gateway.test/control/api/v1", "https://gateway.test/control"),
        ("http://localhost:8000/v1/", "http://localhost:8000"),
        ("localhost:8000/api/v1", "localhost:8000"),
    ],
)
def test_normalize_api_base_url_strips_legacy_suffixes(raw: str, expected: str) -> None:
    assert normalize_api_base_url(raw) == expected


def test_mutx_client_normalizes_legacy_base_url() -> None:
    client = MutxClient(api_key="test-key", base_url="https://app.mutx.dev/api/v1")
    try:
        assert client.base_url == "https://app.mutx.dev"
        assert str(client._client.base_url).rstrip("/") == "https://app.mutx.dev"
    finally:
        client.close()


def test_mutx_async_client_normalizes_legacy_base_url() -> None:
    with warnings.catch_warnings(record=True):
        warnings.simplefilter("always")
        client = MutxAsyncClient(api_key="test-key", base_url="https://app.mutx.dev/v1")

    try:
        assert client.base_url == "https://app.mutx.dev"
        assert str(client._client.base_url).rstrip("/") == "https://app.mutx.dev"
    finally:
        asyncio.run(client.aclose())


def test_mutx_agent_clients_normalize_legacy_base_url() -> None:
    async_client = MutxAgentClient(mutx_url="https://app.mutx.dev/api/v1")
    sync_client = MutxAgentSyncClient(mutx_url="https://app.mutx.dev/v1")

    assert async_client.mutx_url == "https://app.mutx.dev"
    assert sync_client.mutx_url == "https://app.mutx.dev"
