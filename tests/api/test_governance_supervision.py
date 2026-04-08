import pytest


class _MockPreparedLaunch:
    def __init__(self, agent_id):
        self.agent_id = agent_id


class _MockSupervisor:
    async def start_agent(self, agent_id, command, env, faramesh_policy):
        return True

    def get_agent_status(self, agent_id):
        return {"agent_id": agent_id, "state": "running"}

    def prepare_launch_request(
        self, agent_id, command=None, env=None, faramesh_policy=None, profile_name=None
    ):
        return _MockPreparedLaunch(agent_id)

    async def start_prepared_agent(self, prepared):
        return True

    async def stop_agent(self, agent_id, timeout=None):
        return True

    async def restart_agent(self, agent_id):
        return True

    def list_agents(self):
        return []

    def list_profiles(self):
        return []


@pytest.mark.asyncio
async def test_start_supervised_agent_forbidden_for_non_internal_user(
    other_user_client,
    monkeypatch,
):
    from src.api.routes import governance_supervision

    monkeypatch.setattr(
        governance_supervision, "get_faramesh_supervisor", lambda: _MockSupervisor()
    )

    response = await other_user_client.post(
        "/v1/runtime/governance/supervised/start",
        json={"agent_id": "agent-1", "command": ["python", "-V"]},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_start_supervised_agent_allowed_for_internal_user(client, monkeypatch):
    from src.api.routes import governance_supervision

    monkeypatch.setattr(
        governance_supervision, "get_faramesh_supervisor", lambda: _MockSupervisor()
    )

    response = await client.post(
        "/v1/runtime/governance/supervised/start",
        json={"agent_id": "agent-1", "command": ["python", "-V"]},
    )

    assert response.status_code == 200
    assert response.json()["agent_id"] == "agent-1"


@pytest.mark.asyncio
async def test_list_supervised_launch_profiles_forbidden_for_non_internal_user(
    other_user_client,
    monkeypatch,
):
    from src.api.routes import governance_supervision

    monkeypatch.setattr(
        governance_supervision, "get_faramesh_supervisor", lambda: _MockSupervisor()
    )

    response = await other_user_client.get("/v1/runtime/governance/supervised/profiles")

    assert response.status_code == 403
