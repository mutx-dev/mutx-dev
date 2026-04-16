"""Contract tests for sdk/mutx/newsletter.py."""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import Mock

import httpx
import pytest

from mutx.newsletter import Newsletter


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _signup_response(duplicate: bool = False) -> dict[str, Any]:
    return {"message": "Subscribed successfully.", "duplicate": duplicate}


def _count_response(count: int) -> dict[str, Any]:
    return {"count": count}


# ---------------------------------------------------------------------------
# Data class parsing (raw response dicts — newsletter.py returns plain JSON)
# ---------------------------------------------------------------------------


def test_get_count_parses_required_count_field() -> None:
    """get_count() returns the integer value from response['count']."""
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_count_response(42))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        result = newsletter.get_count()

    assert captured["path"] == "/newsletter"
    assert result == 42


def test_signup_parses_message_and_duplicate_fields() -> None:
    """signup() returns a dict with 'message' and 'duplicate' fields."""
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response(duplicate=False))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        result = newsletter.signup(email="test@example.com", source="website")

    assert captured["path"] == "/newsletter"
    assert captured["json"] == {"email": "test@example.com", "source": "website"}
    assert result == {"message": "Subscribed successfully.", "duplicate": False}


def test_signup_duplicate_flag_true() -> None:
    """signup() correctly parses duplicate=True response."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_signup_response(duplicate=True))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        result = newsletter.signup(email="already@example.com")

    assert result["duplicate"] is True


def test_signup_default_source() -> None:
    """signup() defaults source to 'coming-soon'."""
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response())

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        newsletter.signup(email="test@example.com")

    assert captured["json"]["source"] == "coming-soon"


# ---------------------------------------------------------------------------
# Type guard: sync client rejects async client
# ---------------------------------------------------------------------------


def test_sync_methods_raise_when_client_is_async() -> None:
    """Sync methods raise RuntimeError when wrapped with an AsyncClient."""
    mock_client = Mock(spec=httpx.AsyncClient)
    newsletter = Newsletter(mock_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        newsletter.get_count()

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        newsletter.signup(email="test@example.com")


# ---------------------------------------------------------------------------
# Type guard: async client rejects sync client
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_async_methods_raise_when_client_is_sync() -> None:
    """Async methods raise RuntimeError when wrapped with a sync Client."""
    mock_client = Mock(spec=httpx.Client)
    newsletter = Newsletter(mock_client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await newsletter.acount()

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await newsletter.asignup(email="test@example.com")


# ---------------------------------------------------------------------------
# Async methods with mocked AsyncClient
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_acount_returns_count_async() -> None:
    """acount() returns the integer count via an async HTTP call."""
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_count_response(123))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        result = await newsletter.acount()

    assert captured["path"] == "/newsletter"
    assert result == 123


@pytest.mark.asyncio
async def test_asignup_returns_message_and_duplicate_async() -> None:
    """asignup() returns a dict with 'message' and 'duplicate' via an async HTTP call."""
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response(duplicate=False))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        result = await newsletter.asignup(email="async@example.com", source="banner")

    assert captured["path"] == "/newsletter"
    assert captured["json"] == {"email": "async@example.com", "source": "banner"}
    assert result == {"message": "Subscribed successfully.", "duplicate": False}


# ---------------------------------------------------------------------------
# raise_for_status coverage
# ---------------------------------------------------------------------------


def test_get_count_raises_for_error_status() -> None:
    """get_count() raises when the server returns an error status."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "Internal Server Error"})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        with pytest.raises(httpx.HTTPStatusError):
            newsletter.get_count()


def test_signup_raises_for_error_status() -> None:
    """signup() raises when the server returns an error status."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(422, json={"detail": "Invalid email address."})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        with pytest.raises(httpx.HTTPStatusError):
            newsletter.signup(email="bad-email")


@pytest.mark.asyncio
async def test_acount_raises_for_error_status() -> None:
    """acount() raises when the server returns an error status."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "Service Unavailable"})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        with pytest.raises(httpx.HTTPStatusError):
            await newsletter.acount()


@pytest.mark.asyncio
async def test_asignup_raises_for_error_status() -> None:
    """asignup() raises when the server returns an error status."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(409, json={"detail": "Conflict — already subscribed."})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        with pytest.raises(httpx.HTTPStatusError):
            await newsletter.asignup(email="test@example.com")
