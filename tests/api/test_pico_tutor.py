import pytest
from httpx import AsyncClient

from src.api.services.pico_tutor import OfficialEvidence


@pytest.mark.asyncio
async def test_pico_tutor_returns_structured_install_guidance(client: AsyncClient):
    response = await client.post(
        "/v1/pico/tutor",
        json={
            "question": "Hermes is not on my path after install. What should I do first?",
            "lessonSlug": "install-hermes-locally",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "install"
    assert data["structured"]["steps"]
    assert data["recommendedLessonIds"][0] == "install-hermes-locally"
    assert data["structured"]["sources"][0]["kind"] in {"lesson", "knowledge_pack"}


@pytest.mark.asyncio
async def test_pico_tutor_prefers_private_tailscale_guidance(client_no_auth: AsyncClient):
    response = await client_no_auth.post(
        "/v1/pico/tutor",
        json={
            "question": "How do I reach my Hermes gateway over Tailscale without exposing it to the public internet?",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "tailscale"
    assert "private tailnet" in data["structured"]["diagnosis"].lower()
    assert any(
        "tailscale" in step.lower() or "tailnet" in step.lower()
        for step in data["structured"]["steps"]
    )


@pytest.mark.asyncio
async def test_pico_tutor_escalates_risky_requests(client: AsyncClient):
    response = await client.post(
        "/v1/pico/tutor",
        json={
            "question": "I may have leaked a production token. Should I disable protections and expose the admin port while I debug?",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["escalate"] is True
    assert "High-risk topic" in data["escalationReason"]
    assert data["confidence"] == "low"


@pytest.mark.asyncio
async def test_pico_tutor_uses_official_fallback_for_version_sensitive_questions(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    async def fake_fetch_official_evidence(url: str) -> OfficialEvidence:
        return OfficialEvidence(
            title="Hermes Releases",
            href=url,
            excerpt="Latest official release notes confirm the current install path and flags.",
        )

    monkeypatch.setattr(
        "src.api.services.pico_tutor.fetch_official_evidence",
        fake_fetch_official_evidence,
    )

    response = await client.post(
        "/v1/pico/tutor",
        json={
            "question": "What is the latest Hermes install command and current release path?",
            "lessonSlug": "install-hermes-locally",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["usedOfficialFallback"] is True
    assert any(source["kind"] == "official" for source in data["structured"]["sources"])
    assert any(link["href"].startswith("https://") for link in data["structured"]["officialLinks"])
