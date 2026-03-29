import pytest


class _MockSupervisor:
    async def start_agent(self, agent_id, command, env, faramesh_policy):
        return True

    def get_agent_status(self, agent_id):
        return {"agent_id": agent_id, "state": "running"}


@pytest.mark.asyncio
async def test_start_supervised_agent_forbidden_for_non_internal_user(
    other_user_client,
    monkeypatch,
):
    from src.api.routes import governance_supervision

    monkeypatch.setattr(governance_supervision, "get_faramesh_supervisor", lambda: _MockSupervisor())

    response = await other_user_client.post(
        "/v1/runtime/governance/supervised/start",
        json={"agent_id": "agent-1", "command": ["python", "-V"]},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_start_supervised_agent_allowed_for_internal_user(client, monkeypatch):
    from src.api.routes import governance_supervision

    monkeypatch.setattr(governance_supervision, "get_faramesh_supervisor", lambda: _MockSupervisor())

    response = await client.post(
        "/v1/runtime/governance/supervised/start",
        json={"agent_id": "agent-1", "command": ["python", "-V"]},
    )

    assert response.status_code == 200
    assert response.json()["agent_id"] == "agent-1"
