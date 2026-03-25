from __future__ import annotations

import json
import signal
import sys
import time
from pathlib import Path

import click

from cli.faramesh_runtime import (
    FAREMESH_SOCKET_PATH,
    collect_faramesh_snapshot,
    ensure_faramesh_installed,
    find_faramesh_bin,
    get_faramesh_health,
    get_pending_defers,
    get_recent_decisions,
    is_faramesh_available,
    start_faramesh_daemon,
)


def _ensure_faramesh() -> bool:
    """Ensure Faramesh is installed and the daemon is running."""
    if is_faramesh_available():
        return True

    installed, bin_path = ensure_faramesh_installed(install_if_missing=True, non_interactive=True)
    if not installed:
        click.echo("Failed to install Faramesh.", err=True)
        return False

    policy_path = _get_default_policy_path()
    proc = start_faramesh_daemon(policy_path=policy_path, socket_path=FAREMESH_SOCKET_PATH)
    if proc is None:
        click.echo("Failed to start Faramesh daemon.", err=True)
        return False

    for _ in range(10):
        time.sleep(0.5)
        if is_faramesh_available():
            return True

    click.echo("Faramesh daemon started but is not responding.", err=True)
    return False


def _get_default_policy_path() -> str | None:
    """Look for bundled starter policy in standard locations."""
    bundled = Path(__file__).parent.parent / "policies" / "starter.fpl"
    if bundled.exists():
        return str(bundled)

    user_policy_1 = Path.home() / ".mutx" / "policies" / "starter.fpl"
    if user_policy_1.exists():
        return str(user_policy_1)

    user_policy_2 = Path.home() / ".faramesh" / "policy.fpl"
    if user_policy_2.exists():
        return str(user_policy_2)

    return None


@click.group(name="governance")
def governance_group():
    """Inspect Faramesh governance engine state (read-only)."""
    pass


@governance_group.command(name="status")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def status_command(output_json: bool) -> None:
    """Show Faramesh daemon health and policy status."""
    health = get_faramesh_health()
    snapshot = collect_faramesh_snapshot()

    if output_json:
        click.echo(json.dumps(snapshot.to_payload(), indent=2))
        return

    if health.doctor_summary:
        for line in health.doctor_summary.split("\n"):
            click.echo(f"  {line}")
    else:
        click.echo(f"  Status:       {snapshot.status}")
        click.echo(f"  Socket:       {'reachable' if health.socket_reachable else 'not found'}")
        click.echo(f"  Daemon:       {'running' if health.daemon_reachable else 'not reachable'}")
        click.echo(f"  Version:      {health.version or 'unknown'}")
        click.echo(f"  Policy:       {health.policy_name or 'none loaded'}")
        click.echo(f"  Decisions:    {health.decisions_total} total")
        click.echo(f"  Denied:       {health.denied_today} today")
        click.echo(f"  Deferred:     {health.deferred_today} today")
        click.echo(f"  Pending:      {health.pending_approvals} awaiting approval")


@governance_group.command(name="decisions")
@click.option("--limit", "-n", default=20, help="Number of recent decisions to show")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def decisions_command(limit: int, output_json: bool) -> None:
    """Show recent governance decisions (PERMIT/DENY/DEFER)."""
    if not is_faramesh_available():
        click.echo("Faramesh daemon is not running.", err=True)
        click.echo("Start it with: faramesh serve --policy policy.yaml", err=True)
        sys.exit(1)

    try:
        decisions = get_recent_decisions(limit=limit)
    except Exception as exc:
        click.echo(f"Error fetching decisions: {exc}", err=True)
        sys.exit(1)

    if output_json:
        click.echo(json.dumps([d.__dict__ for d in decisions], indent=2, default=str))
        return

    if not decisions:
        click.echo("No recent decisions found.")
        return

    click.echo(f"{'EFFECT':<8} {'TOOL_ID':<25} {'AGENT':<20} {'RULE':<15} {'LATENCY'}")
    click.echo("-" * 85)
    for d in decisions:
        if not d.effect:
            continue
        rule = d.rule_id or "-"
        agent = d.agent_id or "-"
        if len(agent) > 18:
            agent = agent[:15] + "..."
        latency = f"{d.latency_ms}ms" if d.latency_ms else "-"
        effect_color = ""
        if d.effect == "PERMIT":
            effect_color = "\033[92m"
        elif d.effect == "DENY":
            effect_color = "\033[91m"
        elif d.effect == "DEFER":
            effect_color = "\033[93m"
        reset = "\033[0m"
        click.echo(
            f"{effect_color}{d.effect:<8}{reset} {d.tool_id or '-':<25} {agent:<20} {rule:<15} {latency}"
        )


@governance_group.command(name="pending")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def pending_command(output_json: bool) -> None:
    """Show pending approval requests (DEFER queue)."""
    if not is_faramesh_available():
        click.echo("Faramesh daemon is not running.", err=True)
        click.echo("Start it with: faramesh serve --policy policy.yaml", err=True)
        sys.exit(1)

    try:
        defers = get_pending_defers()
    except Exception as exc:
        click.echo(f"Error fetching pending: {exc}", err=True)
        sys.exit(1)

    if output_json:
        click.echo(json.dumps([d.__dict__ for d in defers], indent=2, default=str))
        return

    if not defers:
        click.echo("No pending approvals.")
        return

    click.echo(f"{'TOKEN':<12} {'AGENT':<20} {'TOOL':<20} {'STATUS'}")
    click.echo("-" * 70)
    for d in defers:
        agent = d.agent_id or "-"
        if len(agent) > 18:
            agent = agent[:15] + "..."
        status_color = "\033[93m"
        reset = "\033[0m"
        click.echo(
            f"{d.defer_token[:12]:<12} {agent:<20} {d.tool_id:<20} {status_color}{d.status}{reset}"
        )

    click.echo(f"\n{len(defers)} pending approval(s).")
    click.echo("To approve/deny, use: faramesh agent approve|deny <token>")


@governance_group.command(name="metrics")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def metrics_command(output_json: bool) -> None:
    """Show governance metrics and statistics."""
    if not is_faramesh_available():
        click.echo("Faramesh daemon is not running.", err=True)
        click.echo("Start it with: faramesh serve --policy policy.yaml", err=True)
        sys.exit(1)

    try:
        decisions = get_recent_decisions(limit=200)
        defers = get_pending_defers()
    except Exception as exc:
        click.echo(f"Error fetching metrics: {exc}", err=True)
        sys.exit(1)

    total = len(decisions)
    permits = sum(1 for d in decisions if d.effect == "PERMIT")
    denies = sum(1 for d in decisions if d.effect == "DENY")
    defer_count = sum(1 for d in decisions if d.effect == "DEFER")
    avg_latency = 0
    if decisions:
        latencies = [d.latency_ms for d in decisions if d.latency_ms]
        if latencies:
            avg_latency = sum(latencies) // len(latencies)

    if output_json:
        click.echo(
            json.dumps(
                {
                    "decisions_total": total,
                    "permits": permits,
                    "denies": denies,
                    "deferred": defer_count,
                    "pending_approvals": len(defers),
                    "avg_latency_ms": avg_latency,
                },
                indent=2,
            )
        )
        return

    permit_pct = (permits / total * 100) if total > 0 else 0
    deny_pct = (denies / total * 100) if total > 0 else 0
    defer_pct = (defer_count / total * 100) if total > 0 else 0

    click.echo("Governance Metrics")
    click.echo("=" * 40)
    click.echo(f"  Total Decisions:   {total}")
    click.echo(f"  Permits:            {permits} ({permit_pct:.1f}%)")
    click.echo(f"  Denies:             {denies} ({deny_pct:.1f}%)")
    click.echo(f"  Defers:             {defer_count} ({defer_pct:.1f}%)")
    click.echo(f"  Pending Approvals:  {len(defers)}")
    click.echo(f"  Avg Latency:        {avg_latency}ms")


@governance_group.command(name="tail")
@click.option("--limit", "-n", default=0, help="Stop after N decisions (0=unlimited)")
def tail_command(limit: int) -> None:
    """Stream live governance decisions (Ctrl+C to stop)."""
    if not is_faramesh_available():
        click.echo("Faramesh daemon is not running.", err=True)
        click.echo("Start it with: faramesh serve --policy policy.yaml", err=True)
        sys.exit(1)

    from cli.faramesh_runtime import _send_socket_request

    interrupted = False

    def handler(signum, frame):
        nonlocal interrupted
        interrupted = True
        click.echo("\nStopped.")

    signal.signal(signal.SIGINT, handler)

    click.echo("Streaming decisions... (Ctrl+C to stop)")
    click.echo(f"{'TIME':<10} {'EFFECT':<8} {'TOOL_ID':<25} {'AGENT':<15}")
    click.echo("-" * 65)

    count = 0
    try:
        while not interrupted:
            if limit > 0 and count >= limit:
                break

            request = {"type": "audit_subscribe"}
            responses = _send_socket_request(FAREMESH_SOCKET_PATH, request, timeout=1.0)

            for resp in responses:
                if not isinstance(resp, dict):
                    continue
                effect = resp.get("effect", "")
                if not effect:
                    continue

                ts = time.strftime("%H:%M:%S")
                tool_id = str(resp.get("tool_id") or "-")
                agent = str(resp.get("agent_id") or "-")
                if len(tool_id) > 23:
                    tool_id = tool_id[:20] + "..."
                if len(agent) > 13:
                    agent = agent[:10] + "..."

                effect_color = ""
                if effect == "PERMIT":
                    effect_color = "\033[92m"
                elif effect == "DENY":
                    effect_color = "\033[91m"
                elif effect == "DEFER":
                    effect_color = "\033[93m"
                reset = "\033[0m"

                click.echo(f"{ts:<10} {effect_color}{effect:<8}{reset} {tool_id:<25} {agent:<15}")
                count += 1
                if limit > 0 and count >= limit:
                    break

            if not responses:
                time.sleep(0.5)

    except Exception as exc:
        click.echo(f"\nError: {exc}", err=True)
        sys.exit(1)


@governance_group.command(name="start")
@click.option(
    "--policy", "-p", type=click.Path(exists=False), default=None, help="Policy file path"
)
@click.option(
    "--install/--no-install", "auto_install", default=True, help="Install Faramesh if missing"
)
def start_command(policy: str | None, auto_install: bool) -> None:
    """Install Faramesh if needed and start the governance daemon."""
    if is_faramesh_available():
        click.echo("Faramesh daemon is already running.")
        return

    if auto_install:
        installed, bin_path = ensure_faramesh_installed(
            install_if_missing=True, non_interactive=True
        )
        if not installed:
            click.echo("Failed to install Faramesh.", err=True)
            sys.exit(1)
        click.echo(f"Faramesh installed: {bin_path}")

    if not find_faramesh_bin():
        click.echo(
            "Faramesh is not installed. Use --install or run with --no-install to skip.", err=True
        )
        sys.exit(1)

    policy_path = policy or _get_default_policy_path()

    if policy_path:
        click.echo(f"Starting daemon with policy: {policy_path}")
    else:
        click.echo("Starting daemon without a policy file.")

    proc = start_faramesh_daemon(policy_path=policy_path, socket_path=FAREMESH_SOCKET_PATH)
    if proc is None:
        click.echo("Failed to start Faramesh daemon.", err=True)
        sys.exit(1)

    for i in range(10):
        time.sleep(0.5)
        if is_faramesh_available():
            click.echo("Faramesh daemon is now running.")
            return

    click.echo("Faramesh daemon started but is not responding.", err=True)
    sys.exit(1)
