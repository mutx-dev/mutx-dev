import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_pico_progress_requires_auth(client_no_auth: AsyncClient):
    response = await client_no_auth.get("/v1/pico/progress")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_post_pico_progress_requires_auth(client_no_auth: AsyncClient):
    response = await client_no_auth.post(
        "/v1/pico/progress", json={"selectedTrack": "controlled-agent"}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_pico_progress_normalizes_values_and_dedupes_lists(client: AsyncClient):
    response = await client.post(
        "/v1/pico/progress",
        json={
            "selectedTrack": "controlled-agent",
            "startedLessons": ["install-hermes", "install-hermes", "", 1],
            "completedLessons": ["lesson-1", "lesson-1"],
            "milestoneEvents": ["first_run", "first_run", ""],
            "sharedProjects": ["project-alpha", "project-alpha"],
            "lessonWorkspaces": {
                "install-hermes-locally": {
                    "activeStepIndex": "invalid",
                    "completedStepIndexes": [2, 2, -1, 1, True, "bad"],
                    "notes": 123,
                    "evidence": False,
                    "updatedAt": 456,
                },
                "": {
                    "activeStepIndex": 1,
                    "completedStepIndexes": [0],
                },
            },
            "platform": {
                "activeSurface": "academy",
                "lastOpenedLessonSlug": "install-hermes-locally",
                "railCollapsed": 0,
                "helpLaneOpen": "yes",
                "updatedAt": 123,
            },
            "tutorQuestions": -4,
            "supportRequests": -1,
            "helpfulResponses": -3,
            "autopilot": {
                "costThresholdPercent": 150,
                "alertChannel": "sms",
                "approvalGateEnabled": "yes",
                "approvalRequestIds": ["apr_1", "apr_1", ""],
                "lastThresholdBreachAt": 123,
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["selectedTrack"] == "controlled-agent"
    assert data["startedLessons"] == ["install-hermes"]
    assert data["completedLessons"] == ["lesson-1"]
    assert data["milestoneEvents"] == ["first_run"]
    assert data["sharedProjects"] == ["project-alpha"]
    assert data["lessonWorkspaces"] == {
        "install-hermes-locally": {
            "activeStepIndex": 0,
            "completedStepIndexes": [0, 1, 2],
            "notes": "",
            "evidence": "",
            "updatedAt": None,
        }
    }
    assert data["platform"] == {
        "activeSurface": "academy",
        "lastOpenedLessonSlug": "install-hermes-locally",
        "railCollapsed": False,
        "helpLaneOpen": True,
        "updatedAt": None,
    }
    assert data["tutorQuestions"] == 0
    assert data["supportRequests"] == 0
    assert data["helpfulResponses"] == 0
    assert data["startedAt"]
    assert data["updatedAt"]
    assert data["autopilot"] == {
        "costThresholdPercent": 100,
        "alertChannel": "in_app",
        "approvalGateEnabled": True,
        "approvalRequestIds": ["apr_1"],
        "lastThresholdBreachAt": None,
    }


@pytest.mark.asyncio
async def test_pico_progress_partial_updates_preserve_existing_nested_fields(client: AsyncClient):
    first_response = await client.post(
        "/v1/pico/progress",
        json={
            "selectedTrack": "controlled-agent",
            "lessonWorkspaces": {
                "install-hermes-locally": {
                    "activeStepIndex": 1,
                    "completedStepIndexes": [0, 2],
                    "notes": "draft",
                    "evidence": "evidence-a",
                }
            },
            "platform": {
                "activeSurface": "academy",
                "lastOpenedLessonSlug": "install-hermes-locally",
                "railCollapsed": True,
                "helpLaneOpen": False,
            },
            "autopilot": {
                "alertChannel": "email",
                "approvalGateEnabled": True,
                "approvalRequestIds": ["apr_1"],
            },
        },
    )
    assert first_response.status_code == 200

    response = await client.post(
        "/v1/pico/progress",
        json={
            "completedLessons": ["lesson-2"],
            "lessonWorkspaces": {
                "install-hermes-locally": {
                    "notes": "final notes",
                }
            },
            "autopilot": {"costThresholdPercent": 25},
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["selectedTrack"] == "controlled-agent"
    assert data["completedLessons"] == ["lesson-2"]
    assert data["lessonWorkspaces"] == {
        "install-hermes-locally": {
            "activeStepIndex": 1,
            "completedStepIndexes": [0, 2],
            "notes": "final notes",
            "evidence": "evidence-a",
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
    assert data["autopilot"] == {
        "costThresholdPercent": 25,
        "alertChannel": "email",
        "approvalGateEnabled": True,
        "approvalRequestIds": ["apr_1"],
        "lastThresholdBreachAt": None,
    }

    get_response = await client.get("/v1/pico/progress")

    assert get_response.status_code == 200
    assert get_response.json()["autopilot"]["approvalRequestIds"] == ["apr_1"]
    assert (
        get_response.json()["lessonWorkspaces"]["install-hermes-locally"]["notes"] == "final notes"
    )


@pytest.mark.asyncio
async def test_pico_progress_invalid_counter_types_are_coerced_instead_of_500(client: AsyncClient):
    response = await client.post(
        "/v1/pico/progress",
        json={
            "tutorQuestions": "oops",
            "supportRequests": {"count": 2},
            "helpfulResponses": [1],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["tutorQuestions"] == 0
    assert data["supportRequests"] == 0
    assert data["helpfulResponses"] == 0
