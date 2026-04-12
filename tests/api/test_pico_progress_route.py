import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_pico_progress_default(client: AsyncClient):
    response = await client.get("/v1/pico/progress")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == 1
    assert data["selectedTrack"] is None
    assert data["lessonWorkspaces"] == {}
    assert data["platform"] == {
        "activeSurface": None,
        "lastOpenedLessonSlug": None,
        "railCollapsed": False,
        "helpLaneOpen": False,
        "updatedAt": None,
    }
    assert data["autopilot"]["costThresholdPercent"] == 75


@pytest.mark.asyncio
async def test_pico_progress_roundtrip(client: AsyncClient):
    response = await client.post(
        "/v1/pico/progress",
        json={
            "selectedTrack": "controlled-agent",
            "completedLessons": ["install-hermes-locally", "run-your-first-agent"],
            "milestoneEvents": ["first_tutorial_started", "first_tutorial_completed"],
            "lessonWorkspaces": {
                "install-hermes-locally": {
                    "activeStepIndex": 1,
                    "completedStepIndexes": [0, 0, 2],
                    "notes": "Checkpoint",
                    "evidence": "https://example.test/proof",
                }
            },
            "platform": {
                "activeSurface": "academy",
                "lastOpenedLessonSlug": "install-hermes-locally",
                "railCollapsed": True,
                "helpLaneOpen": False,
            },
            "autopilot": {
                "costThresholdPercent": 82,
                "approvalGateEnabled": True,
                "approvalRequestIds": ["apr_123"],
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["selectedTrack"] == "controlled-agent"
    assert data["autopilot"]["costThresholdPercent"] == 82
    assert data["autopilot"]["approvalGateEnabled"] is True
    assert data["lessonWorkspaces"] == {
        "install-hermes-locally": {
            "activeStepIndex": 1,
            "completedStepIndexes": [0, 2],
            "notes": "Checkpoint",
            "evidence": "https://example.test/proof",
            "updatedAt": None,
        }
    }
    assert data["platform"] == {
        "activeSurface": "academy",
        "lastOpenedLessonSlug": "install-hermes-locally",
        "railCollapsed": True,
        "helpLaneOpen": False,
        "updatedAt": None,
    }

    get_response = await client.get("/v1/pico/progress")
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert get_data["completedLessons"] == ["install-hermes-locally", "run-your-first-agent"]
    assert get_data["autopilot"]["approvalRequestIds"] == ["apr_123"]
    assert get_data["lessonWorkspaces"]["install-hermes-locally"]["completedStepIndexes"] == [0, 2]
