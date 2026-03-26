from pathlib import Path

import pytest

from src.api.services.faramesh_supervisor import (
    FarameshSupervisor,
    SupervisionConfig,
    SupervisionValidationError,
)


def test_supervisor_rejects_launch_when_command_allowlist_is_unset():
    supervisor = FarameshSupervisor(SupervisionConfig())

    with pytest.raises(
        SupervisionValidationError,
        match="GOVERNANCE_SUPERVISED_COMMAND_ALLOWLIST",
    ):
        supervisor.sanitize_launch_request("agent-1", ["python", "agent.py"])


def test_supervisor_rejects_disallowed_environment_variables():
    supervisor = FarameshSupervisor(
        SupervisionConfig(
            allowed_commands=("python",),
            allowed_env_keys=("LOG_LEVEL",),
        )
    )

    with pytest.raises(SupervisionValidationError, match="SECRET_KEY"):
        supervisor.sanitize_launch_request(
            "agent-1",
            ["python", "agent.py"],
            {"SECRET_KEY": "top-secret"},
        )


def test_supervisor_resolves_named_launch_profile_without_direct_command_access():
    supervisor = FarameshSupervisor(
        SupervisionConfig(
            profiles={
                "assistant-runner": {
                    "command": ["python", "agent.py"],
                    "env": {"LOG_LEVEL": "info", "MODE": "prod"},
                }
            },
            allowed_env_keys=("LOG_LEVEL",),
        )
    )

    prepared = supervisor.prepare_launch_request(
        "agent-1",
        profile_name="assistant-runner",
        env={"LOG_LEVEL": "debug"},
    )

    assert prepared.agent_id == "agent-1"
    assert prepared.command == ["python", "agent.py"]
    assert prepared.env == {"LOG_LEVEL": "debug", "MODE": "prod"}
    assert prepared.launch_profile == "assistant-runner"


def test_supervisor_rejects_direct_launch_when_profile_mode_is_enabled():
    supervisor = FarameshSupervisor(
        SupervisionConfig(
            allowed_commands=("python",),
            allowed_env_keys=("LOG_LEVEL",),
            allow_direct_commands=False,
        )
    )

    with pytest.raises(SupervisionValidationError, match="launch profile"):
        supervisor.prepare_launch_request(
            "agent-1",
            command=["python", "agent.py"],
        )


def test_supervisor_normalizes_allowed_policy_within_configured_directory(tmp_path: Path):
    policy_dir = tmp_path / "policies"
    policy_dir.mkdir()
    policy_file = policy_dir / "agent.fpl"
    policy_file.write_text("allow test\n")

    supervisor = FarameshSupervisor(
        SupervisionConfig(
            allowed_commands=("python",),
            allowed_env_keys=("LOG_LEVEL",),
            allowed_policy_dir=str(policy_dir),
        )
    )

    agent_id, command, env, policy = supervisor.sanitize_launch_request(
        " agent-1 ",
        ["/usr/bin/python", "agent.py"],
        {"LOG_LEVEL": "debug"},
        "agent.fpl",
    )

    assert agent_id == "agent-1"
    assert command == ["/usr/bin/python", "agent.py"]
    assert env == {"LOG_LEVEL": "debug"}
    assert policy == str(policy_file.resolve())
