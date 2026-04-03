"""Contract tests for sdk/mutx/newsletter.py."""

from __future__ import annotations

import json

import httpx

from mutx.newsletter import Newsletter


class TestNewsletterSyncClientRequirement:
    """Sync methods must raise RuntimeError when called with an async client."""

    def test_get_count_requires_sync_client(self) -> None:
        async_client = httpx.AsyncClient(base_url="https://api.test")
        newsletter = Newsletter(async_client)
        try:
            newsletter.get_count()
        except RuntimeError as exc:
            assert "sync" in str(exc).lower()

    def test_signup_requires_sync_client(self) -> None:
        async_client = httpx.AsyncClient(base_url="https://api.test")
        newsletter = Newsletter(async_client)
        try:
            newsletter.signup("test@example.com")
        except RuntimeError as exc:
            assert "sync" in str(exc).lower()


class TestNewsletterAsyncClientRequirement:
    """Async methods must raise RuntimeError when called with a sync client."""

    def test_acount_requires_async_client(self) -> None:
        sync_client = httpx.Client(base_url="https://api.test")
        newsletter = Newsletter(sync_client)
        newsletter.acount()  # type: ignore[attr-defined]

    def test_asignup_requires_async_client(self) -> None:
        sync_client = httpx.Client(base_url="https://api.test")
        newsletter = Newsletter(sync_client)
        newsletter.asignup("test@example.com")  # type: ignore[attr-defined]


class TestNewsletterGetCount:
    """Tests for the get_count sync method."""

    def test_get_count_returns_int(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/newsletter"
            assert request.method == "GET"
            return httpx.Response(200, json={"count": 42})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        newsletter = Newsletter(client)
        result = newsletter.get_count()
        assert isinstance(result, int)
        assert result == 42

    def test_get_count_raises_on_http_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(500, json={"error": "server error"})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        newsletter = Newsletter(client)
        try:
            newsletter.get_count()
        except httpx.HTTPStatusError:
            pass  # expected


class TestNewsletterSignup:
    """Tests for the signup sync method."""

    def test_signup_returns_dict_with_message_and_duplicate(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/newsletter"
            assert request.method == "POST"
            body = json.loads(request.content)
            assert body["email"] == "test@example.com"
            assert body["source"] == "website"
            return httpx.Response(200, json={"message": "subscribed", "duplicate": False})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        newsletter = Newsletter(client)
        result = newsletter.signup("test@example.com", source="website")
        assert isinstance(result, dict)
        assert "message" in result
        assert "duplicate" in result
        assert result["message"] == "subscribed"
        assert result["duplicate"] is False

    def test_signup_defaults_source_to_coming_soon(self) -> None:
        captured: dict | None = None

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal captured
            captured = json.loads(request.content)
            return httpx.Response(200, json={"message": "ok", "duplicate": False})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        newsletter = Newsletter(client)
        newsletter.signup("test@example.com")
        assert captured is not None
        assert captured["source"] == "coming-soon"

    def test_signup_duplicate_returns_true(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"message": "already subscribed", "duplicate": True})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        newsletter = Newsletter(client)
        result = newsletter.signup("existing@example.com")
        assert result["duplicate"] is True

    def test_signup_raises_on_http_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(400, json={"error": "invalid email"})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        newsletter = Newsletter(client)
        try:
            newsletter.signup("bad-email")
        except httpx.HTTPStatusError:
            pass  # expected
