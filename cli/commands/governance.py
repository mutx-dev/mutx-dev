from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import click

from cli.faramesh_runtime import (
    FAREMESH_SOCKET_PATH,
    approve_defer,
    collect_faramesh_snapshot,
    deny_defer,
    ensure_faramesh_installed,
    find_faramesh_bin,
    generate_prometheus_metrics,
    get_faramesh_health,
    get_pending_defers,
    get_recent_decisions,
    is_faramesh_available,
    kill_agent,
    list_policy_packs,
    reload_policy,
    start_faramesh_daemon,
    validate_policy,
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


@governance_group.command(name="approve")
@click.argument("token")
def approve_command(token: str) -> None:
    """Approve a deferred governance decision."""
    if not _ensure_faramesh():
        sys.exit(1)

    click.echo(f"Approving deferred action: {token}")
    success = approve_defer(FAREMESH_SOCKET_PATH, token)
    if success:
        click.echo("Approved.")
    else:
        click.echo("Approval failed.", err=True)
        sys.exit(1)


@governance_group.command(name="deny")
@click.argument("token")
def deny_command(token: str) -> None:
    """Deny a deferred governance decision."""
    if not _ensure_faramesh():
        sys.exit(1)

    click.echo(f"Denying deferred action: {token}")
    success = deny_defer(FAREMESH_SOCKET_PATH, token)
    if success:
        click.echo("Denied.")
    else:
        click.echo("Denial failed.", err=True)
        sys.exit(1)


@governance_group.command(name="kill")
@click.argument("agent_id")
def kill_command(agent_id: str) -> None:
    """Emergency kill an agent (stops all pending actions)."""
    if not _ensure_faramesh():
        sys.exit(1)

    click.echo(f"Emergency kill for agent: {agent_id}")
    success = kill_agent(FAREMESH_SOCKET_PATH, agent_id)
    if success:
        click.echo("Agent killed.")
    else:
        click.echo("Kill failed.", err=True)
        sys.exit(1)


@governance_group.group(name="policy")
def policy_group():
    """Policy management commands."""
    pass


@policy_group.command(name="validate")
@click.argument("policy_path", type=click.Path(exists=True))
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def policy_validate_command(policy_path: str, output_json: bool) -> None:
    """Validate an FPL policy file."""
    result = validate_policy(FAREMESH_SOCKET_PATH, policy_path)

    if output_json:
        click.echo(json.dumps(result, indent=2))
        return

    if result.get("valid"):
        click.echo(f"Policy is valid: {policy_path}")
        if result.get("output"):
            click.echo(result["output"])
    else:
        click.echo(f"Policy is invalid: {policy_path}", err=True)
        click.echo(f"Error: {result.get('error', 'unknown')}", err=True)
        sys.exit(1)


@policy_group.command(name="reload")
@click.option("--policy", "-p", type=click.Path(exists=True), default=None, help="New policy file")
def policy_reload_command(policy: str | None) -> None:
    """Hot-reload the running policy (no daemon restart required)."""
    if not _ensure_faramesh():
        sys.exit(1)

    click.echo("Reloading policy...")
    success = reload_policy(FAREMESH_SOCKET_PATH, policy)
    if success:
        click.echo("Policy reloaded.")
    else:
        click.echo("Reload failed.", err=True)
        sys.exit(1)


@policy_group.command(name="list")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def policy_list_command(output_json: bool) -> None:
    """List all bundled policy packs."""
    packs = list_policy_packs()

    if output_json:
        click.echo(json.dumps(packs, indent=2))
        return

    if not packs:
        click.echo("No policy packs found.")
        return

    click.echo("Bundled Policy Packs")
    click.echo("=" * 50)
    for pack in packs:
        click.echo(f"  {pack['name']:<20} {pack['description']}")
        click.echo(f"    {pack['path']}")
        click.echo()


@policy_group.command(name="edit")
@click.option("--policy", "-p", type=click.Path(), default=None, help="Policy file to edit")
def policy_edit_command(policy: str | None) -> None:
    """Edit a policy file in $EDITOR."""
    policy_path = policy or _get_default_policy_path()

    if not policy_path:
        click.echo("No policy file found. Use --policy to specify one.", err=True)
        sys.exit(1)

    editor = os.environ.get("EDITOR", "vi")
    try:
        subprocess.call([editor, policy_path])
    except Exception as exc:
        click.echo(f"Failed to open editor: {exc}", err=True)
        sys.exit(1)


@governance_group.group(name="credential")
def credential_group():
    """Credential broker management (requires Faramesh credential broker addon)."""
    pass


@credential_group.command(name="list")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def credential_list_command(output_json: bool) -> None:
    """List registered credential backends."""
    if not _ensure_faramesh():
        sys.exit(1)

    if output_json:
        click.echo(json.dumps({"credentials": []}, indent=2))
        return

    click.echo("Credential Broker Configuration")
    click.echo("=" * 50)
    click.echo("  No credentials registered.")
    click.echo()
    click.echo("Supported backends: vault, awssecrets, gcpsm, azurekv, onepassword, infisical")
    click.echo("Register with: mutx governance credential register <backend> <name> [options]")


@credential_group.command(name="register")
@click.argument(
    "backend",
    type=click.Choice(["vault", "awssecrets", "gcpsm", "azurekv", "onepassword", "infisical"]),
)
@click.argument("name")
@click.option("--path", "-p", help="Secret path/backend URL")
@click.option("--ttl", "-t", default="15m", help="Credential TTL (e.g., 15m, 1h)")
def credential_register_command(backend: str, name: str, path: str | None, ttl: str) -> None:
    """Register a credential backend for credential brokering."""
    click.echo(f"Registering {backend} credential backend: {name}")
    click.echo("Credential broker configuration requires Faramesh credential broker addon.")
    click.echo("See https://faramesh.dev/docs/credential-broker for setup instructions.")


@governance_group.command(name="export-metrics")
@click.option("--format", "-f", type=click.Choice(["prometheus", "json"]), default="prometheus")
def export_metrics_command(format: str) -> None:
    """Export governance metrics in Prometheus or JSON format."""
    if not _ensure_faramesh():
        sys.exit(1)

    try:
        snapshot = collect_faramesh_snapshot()
    except Exception as exc:
        click.echo(f"Error fetching metrics: {exc}", err=True)
        sys.exit(1)

    if format == "prometheus":
        click.echo(generate_prometheus_metrics(snapshot))
    else:
        click.echo(json.dumps(snapshot.to_payload(), indent=2))
