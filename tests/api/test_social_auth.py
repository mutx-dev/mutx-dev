import httpx
import pytest

from src.api.services import social_auth


class FakeAppleJwksClient:
    def __init__(self, keys: list[dict[str, str]]):
        self.keys = keys
        self.requested_urls: list[str] = []

    async def get(self, url: str) -> httpx.Response:
        self.requested_urls.append(url)
        return httpx.Response(200, json={"keys": self.keys}, request=httpx.Request("GET", url))


@pytest.mark.asyncio
async def test_decode_apple_id_token_verifies_against_matching_jwks_key(monkeypatch):
    client = FakeAppleJwksClient(keys=[{"kid": "apple-key", "kty": "RSA"}])
    captured: dict[str, object] = {}

    monkeypatch.setattr(
        social_auth.jwt,
        "get_unverified_header",
        lambda _token: {"kid": "apple-key", "alg": "RS256"},
    )

    def fake_decode(token, key, *, algorithms, audience, issuer):
        captured.update(
            {
                "token": token,
                "key": key,
                "algorithms": algorithms,
                "audience": audience,
                "issuer": issuer,
            }
        )
        return {
            "sub": "apple-user-id",
            "email": "apple@example.com",
            "email_verified": "true",
        }

    monkeypatch.setattr(social_auth.jwt, "decode", fake_decode)

    claims = await social_auth._decode_apple_id_token(
        client,
        "raw-id-token",
        "mutx-apple-client-id",
    )

    assert client.requested_urls == [social_auth.APPLE_JWKS_URL]
    assert claims["sub"] == "apple-user-id"
    assert captured == {
        "token": "raw-id-token",
        "key": {"kid": "apple-key", "kty": "RSA"},
        "algorithms": social_auth.APPLE_ID_TOKEN_ALGORITHMS,
        "audience": "mutx-apple-client-id",
        "issuer": social_auth.APPLE_ID_TOKEN_ISSUER,
    }


@pytest.mark.asyncio
async def test_decode_apple_id_token_rejects_unknown_signing_key(monkeypatch):
    client = FakeAppleJwksClient(keys=[{"kid": "other-key", "kty": "RSA"}])

    monkeypatch.setattr(
        social_auth.jwt,
        "get_unverified_header",
        lambda _token: {"kid": "apple-key", "alg": "RS256"},
    )

    with pytest.raises(social_auth.SocialAuthError) as exc_info:
        await social_auth._decode_apple_id_token(client, "raw-id-token", "mutx-apple-client-id")

    assert exc_info.value.status_code == 401
    assert "signing key was not found" in exc_info.value.message
