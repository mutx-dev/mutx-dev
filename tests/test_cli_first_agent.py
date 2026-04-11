from __future__ import annotations

from pathlib import Path

from click.testing import CliRunner

from cli.config import CLIConfig
from cli.main import cli


class DummyProcessResult:
    def __init__(self, *, returncode: int = 0, stdout: str = "", stderr: str = "") -> None:
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def test_first_agent_runs_hermes_and_saves_proof(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    captured: dict[str, object] = {}
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.first_agent.shutil.which", lambda _: "/usr/local/bin/hermes")
    monkeypatch.setattr("cli.commands.first_agent.Path.home", lambda: tmp_path)

    def fake_run(command: list[str]):
        captured["command"] = command
        return DummyProcessResult(
            stdout=(
                "╭─ ⚕ Hermes ───────────────────────────╮\n"
                "1. Tighten the scope.\n\n"
                "2. Publish the landing page.\n\n"
                "3. Post the launch note.\n\n"
                "1. Tighten the scope.\n\n"
                "2. Publish the landing page.\n\n"
                "3. Post the launch note.\n\n"
                "Do first: publish the landing page.\n"
                "session_id: sess-123\n"
            )
        )

    monkeypatch.setattr("cli.commands.first_agent._run_hermes_command", fake_run)

    runner = CliRunner()
    result = runner.invoke(cli, ["first-agent", "Turn rough launch notes into next steps"])

    assert result.exit_code == 0
    command = captured["command"]
    assert isinstance(command, list)
    assert command[:3] == ["/usr/local/bin/hermes", "chat", "-q"]
    assert "--max-turns" in command
    assert "Useful output" in result.output
    assert result.output.count("1. Tighten the scope.") == 1
    assert "Do first: publish the landing page." in result.output
    assert "You just ran your first real agent." in result.output

    proof_dir = tmp_path / ".mutx" / "first-agent"
    proof_files = list(proof_dir.glob("first-agent-*.md"))
    assert len(proof_files) == 1
    proof_text = proof_files[0].read_text(encoding="utf-8")
    assert "Turn rough launch notes into next steps" in proof_text
    assert "sess-123" in proof_text


def test_first_agent_requires_hermes(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.first_agent.shutil.which", lambda _: None)

    runner = CliRunner()
    result = runner.invoke(cli, ["first-agent", "Turn notes into next steps"])

    assert result.exit_code != 0
    assert "Hermes is not installed" in result.output


def test_first_agent_surfaces_runtime_failure(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.first_agent.shutil.which", lambda _: "/usr/local/bin/hermes")
    monkeypatch.setattr(
        "cli.commands.first_agent._run_hermes_command",
        lambda _command: DummyProcessResult(returncode=1, stderr="provider auth missing"),
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["first-agent", "Turn notes into next steps"])

    assert result.exit_code != 0
    assert "Hermes failed before the payoff." in result.output
    assert "provider auth missing" in result.output
