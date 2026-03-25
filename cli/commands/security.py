"""
MUTX Security CLI Commands.

CLI commands for MUTX Security Layer - AARM-compliant runtime security.

Commands:
- mutx security evaluate <tool> <args>   - Dry-run policy evaluation
- mutx security approve <token>          - Approve deferred action
- mutx security deny <token>             - Deny deferred action
- mutx security audit                   - Run AARM compliance check
- mutx security receipts                 - View recent receipts
- mutx security metrics                 - View governance metrics

Based on the AARM (Autonomous Action Runtime Management) specification.
https://github.com/aarm-dev/docs

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs/blob/main/LICENSE.txt
"""

import json

import click

from cli.config import CLIConfig, get_client


def _get_config() -> CLIConfig:
    ctx = click.get_current_context()
    return ctx.obj["config"]


def _get_client_instance():
    config = _get_config()
    return get_client(config)


@click.group(name="security")
def security_group():
    """MUTX Security - AARM-compliant runtime security for AI agents."""
    pass


@security_group.command(name="evaluate")
@click.argument("tool_name")
@click.option("--agent-id", required=True, help="Agent ID")
@click.option("--session-id", required=True, help="Session ID")
@click.option("--args", "-a", default="{}", help="Tool arguments as JSON")
@click.option("--trigger", default="manual", help="What triggered this (manual, cron, etc.)")
@click.option("--runtime", default="mutx", help="Runtime identifier")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def evaluate_action(
    tool_name: str,
    agent_id: str,
    session_id: str,
    args: str,
    trigger: str,
    runtime: str,
    output_json: bool,
):
    """
    Evaluate an action against policy (dry-run).

    Check what the policy decision would be for a given action
    without actually executing it.
    """
    client = _get_client_instance()

    try:
        tool_args = json.loads(args) if args != "{}" else {}
    except json.JSONDecodeError as e:
        click.echo(f"Error parsing --args: {e}", err=True)
        return

    payload = {
        "tool_name": tool_name,
        "tool_args": tool_args,
        "agent_id": agent_id,
        "session_id": session_id,
        "trigger": trigger,
        "runtime": runtime,
    }

    try:
        response = client._client.post("/v1/security/actions/evaluate", json=payload)
        response.raise_for_status()
        result = response.json()
    except Exception as exc:
        click.echo(f"Error evaluating action: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(result, indent=2))
        return

    decision = result.get("decision", "UNKNOWN")
    reason = result.get("reason", "")

    color = ""
    reset = ""
    if decision == "allow":
        color = "\033[92m"
    elif decision == "deny":
        color = "\033[91m"
    elif decision == "defer":
        color = "\033[93m"

    click.echo(f"Decision: {color}{decision}{reset}")
    click.echo(f"Reason:   {reason}")
    if result.get("rule_name"):
        click.echo(f"Rule:     {result.get('rule_name')}")
    if result.get("action_hash"):
        click.echo(f"Action:   {result.get('action_hash')[:16]}...")


@security_group.group(name="approvals")
def approvals_group():
    """Manage human approval workflows."""
    pass


@approvals_group.command(name="list")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def list_approvals(output_json: bool):
    """List pending approval requests."""
    client = _get_client_instance()

    try:
        response = client._client.get("/v1/security/approvals")
        response.raise_for_status()
        pending = response.json()
    except Exception as exc:
        click.echo(f"Error fetching approvals: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(pending, indent=2))
        return

    if not pending:
        click.echo("No pending approvals.")
        return

    click.echo(f"Pending Approvals ({len(pending)}):")
    click.echo("-" * 80)
    for req in pending:
        remaining = req.get("remaining_seconds", 0)
        minutes = remaining // 60
        seconds = remaining % 60
        click.echo(
            f"  {req.get('request_id')[:8]}... | {req.get('tool_name'):<25} | {minutes}m {seconds}s remaining"
        )
        click.echo(f"                    Reason: {req.get('reason', '-')}")


@approvals_group.command(name="approve")
@click.argument("token")
@click.option("--reviewer", "-r", required=True, help="Who is approving")
@click.option("--comment", "-c", default="", help="Optional comment")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def approve_action(token: str, reviewer: str, comment: str, output_json: bool):
    """Approve a pending request."""
    client = _get_client_instance()

    payload = {
        "reviewer": reviewer,
        "comment": comment,
    }

    try:
        response = client._client.post(
            f"/v1/security/approvals/{token}/approve",
            json=payload,
        )
        response.raise_for_status()
        result = response.json()
    except Exception as exc:
        click.echo(f"Error approving request: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(result, indent=2))
        return

    click.echo(f"Approved: {result.get('status')}")
    click.echo(f"Request ID: {result.get('request_id')}")


@approvals_group.command(name="deny")
@click.argument("token")
@click.option("--reviewer", "-r", required=True, help="Who is denying")
@click.option("--reason", "-c", default="", help="Reason for denial")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def deny_action(token: str, reviewer: str, reason: str, output_json: bool):
    """Deny a pending request."""
    client = _get_client_instance()

    payload = {
        "reviewer": reviewer,
        "comment": reason,
    }

    try:
        response = client._client.post(
            f"/v1/security/approvals/{token}/deny",
            json=payload,
        )
        response.raise_for_status()
        result = response.json()
    except Exception as exc:
        click.echo(f"Error denying request: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(result, indent=2))
        return

    click.echo(f"Denied: {result.get('status')}")
    click.echo(f"Request ID: {result.get('request_id')}")


@security_group.command(name="audit")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def run_audit(output_json: bool):
    """
    Run AARM conformance checks.

    Verifies that MUTX Security Layer satisfies all 9 AARM requirements.
    """
    client = _get_client_instance()

    try:
        response = client._client.get("/v1/security/compliance")
        response.raise_for_status()
        report = response.json()
    except Exception as exc:
        click.echo(f"Error running compliance check: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(report, indent=2))
        return

    overall = report.get("overall_satisfied", False)
    summary = report.get("summary", {})

    if overall:
        click.echo("\033[92m✓ AARM Compliance: PASSED\033[0m")
    else:
        click.echo("\033[91m✗ AARM Compliance: FAILED\033[0m")

    click.echo("")
    click.echo("Summary:")
    click.echo(
        f"  MUST requirements: {summary.get('must_satisfied', 0)}/{summary.get('must_requirements', 0)}"
    )
    click.echo(
        f"  SHOULD requirements: {summary.get('should_satisfied', 0)}/{summary.get('should_requirements', 0)}"
    )

    click.echo("")
    click.echo("Requirements:")
    for result in report.get("results", []):
        req_id = result.get("requirement_id", "")
        level = result.get("level", "")
        satisfied = result.get("satisfied", False)
        description = result.get("description", "")

        status_str = "\033[92m✓\033[0m" if satisfied else "\033[91m✗\033[0m"
        click.echo(f"  {status_str} [{level}] {req_id}: {description}")

        if not satisfied and result.get("details"):
            click.echo(f"       {result.get('details')[:100]}")


@security_group.command(name="metrics")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
@click.option("--prometheus", is_flag=True, help="Output in Prometheus format")
def show_metrics(output_json: bool, prometheus: bool):
    """Show governance metrics."""
    client = _get_client_instance()

    try:
        if prometheus:
            response = client._client.get("/v1/security/metrics/prometheus")
        else:
            response = client._client.get("/v1/security/metrics")
        response.raise_for_status()
    except Exception as exc:
        click.echo(f"Error fetching metrics: {exc}", err=True)
        return

    if prometheus:
        click.echo(response.text)
        return

    metrics = response.json()

    if output_json:
        click.echo(json.dumps(metrics, indent=2))
        return

    click.echo("Governance Metrics")
    click.echo("=" * 50)
    click.echo(f"  Total Evaluations:   {metrics.get('total_evaluations', 0)}")
    click.echo(f"  Permits:             {metrics.get('permits', 0)}")
    click.echo(f"  Denials:             {metrics.get('denials', 0)}")
    click.echo(f"  Defers:              {metrics.get('defers', 0)}")
    click.echo(f"  Pending Approvals:   {metrics.get('pending_approvals', 0)}")
    click.echo(f"  Intent Drifts:       {metrics.get('intent_drifts', 0)}")
    click.echo(f"  Active Sessions:     {metrics.get('active_sessions', 0)}")
    click.echo("")
    click.echo(f"  Avg Latency:         {metrics.get('avg_latency_ms', 0):.2f}ms")
    click.echo(f"  Decisions/min:       {metrics.get('decisions_per_minute', 0)}")
    click.echo(f"  Decisions/hour:      {metrics.get('decisions_per_hour', 0)}")


@security_group.group(name="receipts")
def receipts_group():
    """View action receipts (audit trail)."""
    pass


@receipts_group.command(name="list")
@click.argument("session_id")
@click.option("--limit", "-n", default=20, help="Number of receipts to show")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def list_receipts(session_id: str, limit: int, output_json: bool):
    """List receipts for a session."""
    client = _get_client_instance()

    try:
        response = client._client.get(
            f"/v1/security/receipts/session/{session_id}",
            params={"limit": limit},
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        click.echo(f"Error fetching receipts: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(data, indent=2))
        return

    receipts = data.get("receipts", [])

    if not receipts:
        click.echo(f"No receipts found for session {session_id}.")
        return

    click.echo(f"Receipts for session {session_id} ({len(receipts)}):")
    click.echo("-" * 100)
    click.echo(f"{'RECEIPT ID':<38} {'ACTION':<25} {'DECISION':<10} {'TIMESTAMP'}")
    click.echo("-" * 100)

    for receipt in receipts:
        receipt_id = receipt.get("receipt_id", "")[:36]
        tool_name = receipt.get("tool_name", "")[:23]
        decision = receipt.get("policy_decision", "")[:10]
        timestamp = receipt.get("timestamp", "")[:19]

        color = ""
        reset = ""
        if decision == "allow":
            color = "\033[92m"
        elif decision == "deny":
            color = "\033[91m"
        elif decision == "defer":
            color = "\033[93m"

        click.echo(f"{receipt_id:<38} {tool_name:<25} {color}{decision:<10}{reset} {timestamp}")


@receipts_group.command(name="show")
@click.argument("receipt_id")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def show_receipt(receipt_id: str, output_json: bool):
    """Show detailed receipt."""
    client = _get_client_instance()

    try:
        response = client._client.get(f"/v1/security/receipts/{receipt_id}")
        if response.status_code == 404:
            click.echo(f"Receipt not found: {receipt_id}")
            return
        response.raise_for_status()
        receipt = response.json()
    except Exception as exc:
        click.echo(f"Error fetching receipt: {exc}", err=True)
        return

    if output_json:
        click.echo(json.dumps(receipt, indent=2))
        return

    click.echo(f"Receipt: {receipt_id}")
    click.echo("=" * 80)
    click.echo(f"  Tool:          {receipt.get('tool_name')}")
    click.echo(f"  Decision:      {receipt.get('policy_decision')}")
    click.echo(f"  Reason:       {receipt.get('decision_reason')}")
    click.echo(f"  Outcome:      {receipt.get('outcome')}")
    click.echo(f"  Agent ID:     {receipt.get('agent_id')}")
    click.echo(f"  Session ID:   {receipt.get('session_id')}")
    click.echo(f"  Timestamp:    {receipt.get('timestamp')}")

    if receipt.get("rule_name"):
        click.echo(f"  Rule:         {receipt.get('rule_name')}")

    if receipt.get("signed_by"):
        click.echo(f"  Signed by:    {receipt.get('signed_by')}")

    if receipt.get("session_snapshot"):
        snap = receipt.get("session_snapshot")
        click.echo("")
        click.echo("  Session Snapshot:")
        click.echo(f"    Tool calls:    {snap.get('tool_call_count', 0)}")
        click.echo(f"    Denials:       {snap.get('denied_count', 0)}")


@security_group.group(name="sessions")
def sessions_group():
    """Manage session contexts."""
    pass


@sessions_group.command(name="create")
@click.option("--session-id", required=True, help="Session ID")
@click.option("--agent-id", required=True, help="Agent ID")
@click.option("--user-id", help="User ID")
@click.option("--intent", default="", help="Stated user intent")
@click.option("--request", default="", help="Original user request")
def create_session(
    session_id: str,
    agent_id: str,
    user_id: str,
    intent: str,
    request: str,
):
    """Create a new session context."""
    client = _get_client_instance()

    params = {
        "session_id": session_id,
        "agent_id": agent_id,
        "stated_intent": intent,
        "original_request": request,
    }
    if user_id:
        params["user_id"] = user_id

    try:
        response = client._client.post("/v1/security/sessions", params=params)
        response.raise_for_status()
        result = response.json()
    except Exception as exc:
        click.echo(f"Error creating session: {exc}", err=True)
        return

    click.echo(f"Session created: {result.get('session_id')}")


@sessions_group.command(name="show")
@click.argument("session_id")
def show_session(session_id: str):
    """Show session summary."""
    client = _get_client_instance()

    try:
        response = client._client.get(f"/v1/security/sessions/{session_id}")
        if response.status_code == 404:
            click.echo(f"Session not found: {session_id}")
            return
        response.raise_for_status()
        session = response.json()
    except Exception as exc:
        click.echo(f"Error fetching session: {exc}", err=True)
        return

    click.echo(f"Session: {session_id}")
    click.echo("=" * 50)
    click.echo(f"  Agent ID:      {session.get('agent_id')}")
    click.echo(f"  Duration:      {session.get('duration_seconds', 0):.0f}s")
    click.echo(f"  Total Actions: {session.get('total_actions', 0)}")
    click.echo(f"  Permits:       {session.get('permits', 0)}")
    click.echo(f"  Denials:       {session.get('denials', 0)}")
    click.echo(f"  Defers:        {session.get('defers', 0)}")
    click.echo(f"  Errors:        {session.get('errors', 0)}")
    click.echo(f"  Intent:        {session.get('intent_alignment', 'unknown')}")


@sessions_group.command(name="close")
@click.argument("session_id")
def close_session(session_id: str):
    """Close a session."""
    client = _get_client_instance()

    try:
        response = client._client.delete(f"/v1/security/sessions/{session_id}")
        if response.status_code == 404:
            click.echo(f"Session not found: {session_id}")
            return
        response.raise_for_status()
    except Exception as exc:
        click.echo(f"Error closing session: {exc}", err=True)
        return

    click.echo(f"Session closed: {session_id}")
