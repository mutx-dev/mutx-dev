from __future__ import annotations

import re
import shlex
import shutil
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import click

INSTALL_HINT = (
    "Hermes is not installed. Run `curl -fsSL https://hermes.nousresearch.com/install.sh | bash`, "
    "then rerun `mutx first-agent`."
)
DEFAULT_PROMPT_TEMPLATE = """You're the first real agent run inside MUTX.
Take the task below and produce immediate value.
- Keep it under 160 words.
- Give exactly 3 numbered next actions.
- End with one line that starts with `Do first:`.
- No heading, no intro, no repetition.
- If the task is vague, make the smallest reasonable assumptions and move.

TASK:
{task}
"""
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")
BOX_CHARS = set("─╭╮╰╯│ ")


@dataclass
class FirstAgentExecution:
    task: str
    prompt: str
    response: str
    session_id: str | None
    command: list[str]


def _strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text)


def _collapse_repeated_paragraph_blocks(text: str) -> str:
    paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
    if len(paragraphs) < 2:
        return text.strip()

    changed = True
    while changed:
        changed = False
        for start in range(len(paragraphs)):
            max_block = (len(paragraphs) - start) // 2
            for block_size in range(1, max_block + 1):
                first = paragraphs[start : start + block_size]
                second = paragraphs[start + block_size : start + (block_size * 2)]
                if first == second:
                    paragraphs = (
                        paragraphs[: start + block_size] + paragraphs[start + (block_size * 2) :]
                    )
                    changed = True
                    break
            if changed:
                break

    return "\n\n".join(paragraphs).strip()


def _extract_response(stdout: str) -> tuple[str, str | None]:
    session_id = None
    cleaned_lines: list[str] = []

    for raw_line in _strip_ansi(stdout).splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue

        if stripped.startswith("session_id:"):
            session_id = stripped.partition(":")[2].strip() or None
            continue

        if stripped.startswith("╭") or stripped.startswith("╰"):
            continue

        if all(char in BOX_CHARS for char in stripped):
            continue

        cleaned_lines.append(line)

    response = _collapse_repeated_paragraph_blocks("\n".join(cleaned_lines).strip())
    return response, session_id


def _run_hermes_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, check=False)


def run_first_agent(
    *,
    task: str,
    prompt_template: str = DEFAULT_PROMPT_TEMPLATE,
    model: str | None = None,
    provider: str | None = None,
    max_turns: int = 2,
) -> FirstAgentExecution:
    hermes_bin = shutil.which("hermes")
    if not hermes_bin:
        raise click.ClickException(INSTALL_HINT)

    prompt = prompt_template.format(task=task)
    command = [hermes_bin, "chat", "-q", prompt, "-Q", "--max-turns", str(max_turns)]
    if provider:
        command.extend(["--provider", provider])
    if model:
        command.extend(["--model", model])

    result = _run_hermes_command(command)
    if result.returncode != 0:
        detail = (
            result.stderr or result.stdout or "Hermes failed before returning output."
        ).strip()
        raise click.ClickException(f"Hermes failed before the payoff.\n{detail}")

    response, session_id = _extract_response(result.stdout or "")
    if not response:
        detail = (result.stderr or result.stdout or "Hermes returned no visible output.").strip()
        raise click.ClickException(f"Hermes returned no visible output.\n{detail}")

    return FirstAgentExecution(
        task=task,
        prompt=prompt,
        response=response,
        session_id=session_id,
        command=command,
    )


def _default_save_path() -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return Path.home() / ".mutx" / "first-agent" / f"first-agent-{timestamp}.md"


def save_execution_proof(
    execution: FirstAgentExecution,
    *,
    save_path: Path | None = None,
) -> Path:
    proof_path = save_path or _default_save_path()
    proof_path.parent.mkdir(parents=True, exist_ok=True)
    command_text = shlex.join(execution.command)
    content = (
        "MUTX first agent\n"
        f"Created: {datetime.now(timezone.utc).isoformat()}\n\n"
        "Task\n"
        f"{execution.task}\n\n"
        "Prompt sent to Hermes\n"
        f"{execution.prompt}\n\n"
        "Useful output\n"
        f"{execution.response}\n\n"
        f'Hermes session: {execution.session_id or "n/a"}\n'
        f"Command: {command_text}\n"
    )
    proof_path.write_text(content, encoding="utf-8")
    return proof_path


@click.command(name="first-agent")
@click.argument("task", nargs=-1)
@click.option("--model", default=None, help="Optional Hermes model override.")
@click.option("--provider", default=None, help="Optional Hermes provider override.")
@click.option("--max-turns", type=click.IntRange(1, 10), default=2, show_default=True)
@click.option(
    "--save-path",
    type=click.Path(path_type=Path, dir_okay=False, writable=True, resolve_path=False),
    default=None,
    help="Optional path for the proof file. Defaults to ~/.mutx/first-agent/.",
)
@click.option("--save/--no-save", default=True, show_default=True, help="Save the run as proof.")
def first_agent_command(
    task: tuple[str, ...],
    model: str | None,
    provider: str | None,
    max_turns: int,
    save_path: Path | None,
    save: bool,
) -> None:
    raw_task = " ".join(task).strip()
    if not raw_task:
        raise click.ClickException(
            "Pass a real task after `mutx first-agent`, for example: "
            '`mutx first-agent "Turn these launch notes into three next steps"`.'
        )

    execution = run_first_agent(
        task=raw_task,
        model=model,
        provider=provider,
        max_turns=max_turns,
    )
    proof_path = save_execution_proof(execution, save_path=save_path) if save else None

    click.echo("")
    click.echo("First real agent")
    click.echo("----------------")
    click.echo(f"Task: {raw_task}")
    click.echo("")
    click.echo("Useful output")
    click.echo("-------------")
    click.echo(execution.response)
    click.echo("-------------")
    if proof_path is not None:
        click.echo(f"Saved proof: {proof_path}")
    if execution.session_id:
        click.echo(f"Hermes session: {execution.session_id}")
    click.echo("You just ran your first real agent.")
