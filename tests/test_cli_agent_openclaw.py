from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

from click.testing import CliRunner

from cli.main import cli


def runtime_binding_payload() -> tuple[SimpleNamespace, SimpleNamespace]:
    binding = SimpleNamespace(
        agent_id="personal-assistant",
        workspace="/tmp/openclaw/workspace-personal-assistant",
        runtime_metadata=lambda: {
            "managed_by_mutx": True,
            "install_method": "npm",
            "gateway_port": 18789,
            "agent_dir": "/tmp/openclaw/agents/personal-assistant/agent",
            "provisioned_at": "2026-03-21T10:00:00+00:00",
        },
    )
    health = SimpleNamespace(status="healthy", gateway_url="http://127.0.0.1:18789")
    return binding, health


def test_agent_create_personal_assistant_binds_openclaw_runtime(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class DummyAgentsService:
        def create_agent(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(id="agent-pa-01", name=kwargs["name"], type=kwargs["agent_type"])

    monkeypatch.setattr(
        "cli.commands.agent.prepare_personal_assistant_runtime",
        lambda **kwargs: runtime_binding_payload(),
    )
    monkeypatch.setattr("cli.personal_assistant.detect_gateway_port", lambda: 18789)
    monkeypatch.setattr("cli.commands.agent._service", lambda: DummyAgentsService())

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "agent",
            "create",
            "--name",
            "Personal Assistant",
            "--template",
            "personal_assistant",
        ],
    )

    assert result.exit_code == 0
    assert captured["name"] == "Personal Assistant"
    assert captured["description"] == ""
    assert captured["agent_type"] == "openclaw"
    config = captured["config"]
    assert isinstance(config, dict)
    assert config["assistant_id"] == "personal-assistant"
    assert config["workspace"] == "/tmp/openclaw/workspace-personal-assistant"
    assert config["template"] == "personal_assistant"
    assert config["runtime"] == "personal_assistant"
    assert config["model"] == "openai/gpt-5"
    assert config["gateway"]["port"] == 18789
    assert config["metadata"]["starter"] is True
    assert config["metadata"]["starter_template"] == "personal_assistant"
    assert config["metadata"]["runtime"] == {
        "managed_by_mutx": True,
        "install_method": "npm",
        "gateway_port": 18789,
        "agent_dir": "/tmp/openclaw/agents/personal-assistant/agent",
        "provisioned_at": "2026-03-21T10:00:00+00:00",
        "gateway_status": "healthy",
        "gateway_url": "http://127.0.0.1:18789",
    }
    assert "webchat" in config["channels"]
    assert "telegram" in config["channels"]
    assert "Created agent: agent-pa-01 | Personal Assistant | openclaw" in result.output


def test_agent_deploy_ensures_openclaw_binding_before_deploy(monkeypatch) -> None:
    calls: list[tuple[str, object]] = []
    agent = SimpleNamespace(id="agent-pa-01", name="Personal Assistant", type="openclaw", config={})

    class DummyAgentsService:
        def get_agent(self, agent_id: str):
            calls.append(("get_agent", agent_id))
            return agent

        def ensure_openclaw_binding(self, current_agent, **kwargs):
            calls.append(("ensure_openclaw_binding", current_agent.id, kwargs))
            return current_agent

        def deploy_agent(self, agent_id: str):
            calls.append(("deploy_agent", agent_id))
            return SimpleNamespace(deployment_id="dep-pa-01", status="pending")

    monkeypatch.setattr("cli.commands.agent._service", lambda: DummyAgentsService())

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "agent",
            "deploy",
            "agent-pa-01",
            "--install-openclaw",
            "--openclaw-install-method",
            "git",
        ],
    )

    assert result.exit_code == 0
    assert calls[0] == ("get_agent", "agent-pa-01")
    assert calls[1][0] == "ensure_openclaw_binding"
    assert calls[1][1] == "agent-pa-01"
    assert calls[1][2]["install_if_missing"] is True
    assert calls[1][2]["install_method"] == "git"
    assert calls[1][2]["no_input"] is False
    assert callable(calls[1][2]["prompt_install"])
    assert calls[2] == ("deploy_agent", "agent-pa-01")
    assert "Deployment ID: dep-pa-01 | status: pending | agent: Personal Assistant" in result.output
