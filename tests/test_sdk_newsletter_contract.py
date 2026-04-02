"""Contract tests for the Newsletter SDK resource."""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from mutx.newsletter import Newsletter


def _count_response(count: int = 0, **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {"count": count}
    payload.update(overrides)
    return payload


def _signup_response(message: str = "subscribed", duplicate: bool = False, **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {"message": message, "duplicate": duplicate}
    payload.update(overrides)
    return payload


# --- sync tests ---


def test_get_count_returns_integer_from_response() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_count_response(count=42))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    newsletter = Newsletter(client)

    count = newsletter.get_count()

    assert captured["path"] == "/newsletter"
    assert count == 42


@pytest.mark.asyncio
async def test_get_count_rejects_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_count_response(count=0))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            newsletter.get_count()


def test_signup_posts_email_and_source() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response(message="thanks!", duplicate=False))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    newsletter = Newsletter(client)

    result = newsletter.signup(email="alice@example.com", source="website")

    assert captured["path"] == "/newsletter"
    assert captured["json"] == {"email": "alice@example.com", "source": "website"}
    assert result["message"] == "thanks!"
    assert result["duplicate"] is False


def test_signup_defaults_source_to_coming_soon() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    newsletter = Newsletter(client)

    newsletter.signup(email="bob@example.com")

    assert captured["json"] == {"email": "bob@example.com", "source": "coming-soon"}


def test_signup_returns_duplicate_flag() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_signup_response(message="already subscribed", duplicate=True))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    newsletter = Newsletter(client)

    result = newsletter.signup(email="dup@example.com")

    assert result["duplicate"] is True


@pytest.mark.asyncio
async def test_signup_rejects_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_signup_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            newsletter.signup(email="test@example.com")


# --- async tests ---


@pytest.mark.asyncio
async def test_acount_returns_integer_with_async_client() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_count_response(count=99))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        count = await newsletter.acount()

    assert captured["path"] == "/newsletter"
    assert count == 99


@pytest.mark.asyncio
async def test_acount_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    newsletter = Newsletter(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await newsletter.acount()


@pytest.mark.asyncio
async def test_asignup_posts_email_and_source_async() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response(message="async subscribed", duplicate=False))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        result = await newsletter.asignup(email="carol@example.com", source="campaign")

    assert captured["path"] == "/newsletter"
    assert captured["json"] == {"email": "carol@example.com", "source": "campaign"}
    assert result["message"] == "async subscribed"
    assert result["duplicate"] is False


@pytest.mark.asyncio
async def test_asignup_defaults_source_to_coming_soon_async() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_signup_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        newsletter = Newsletter(client)
        await newsletter.asignup(email="dave@example.com")

    assert captured["json"] == {"email": "dave@example.com", "source": "coming-soon"}


@pytest.mark.asyncio
async def test_asignup_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    newsletter = Newsletter(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await newsletter.asignup(email="test@example.com")
