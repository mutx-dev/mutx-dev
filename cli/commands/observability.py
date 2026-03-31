import click
from typing import Any, Optional

from cli.config import CLIConfig, get_client


@click.group(name="runs")
def runs_group():
    """Manage observability runs"""
    pass


def _require_auth() -> tuple[CLIConfig, Any]:
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        raise SystemExit(1)
    return config, get_client(config)


@runs_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of runs to fetch")
@click.option("--skip", "-s", default=0, help="Number of runs to skip")
@click.option("--agent-id", help="Filter by agent ID")
@click.option(
    "--status",
    type=click.Choice(["pending", "running", "success", "failed"]),
    help="Filter by status",
)
def list_runs(limit: int, skip: int, agent_id: Optional[str], status: Optional[str]):
    """List all observability runs"""
    config, client = _require_auth()
    params: dict[str, Any] = {"limit": limit, "skip": skip}
    if agent_id:
        params["agent_id"] = agent_id
    if status:
        params["status"] = status

    response = client.get("/v1/observability/runs", params=params)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    runs = response.json()
    if not runs:
        click.echo("No runs found.")
        return

    for run in runs:
        click.echo(
            f"{run['id']} | agent={run.get('agent_id', 'n/a')} | status={run.get('status', 'n/a')} | {run.get('created_at', '')}"
        )


@runs_group.command(name="get")
@click.argument("run_id")
def get_run(run_id: str):
    """Get a run by ID"""
    config, client = _require_auth()
    response = client.get(f"/v1/observability/runs/{run_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Run not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    run = response.json()
    click.echo(f"ID:       {run['id']}")
    click.echo(f"Agent:    {run.get('agent_id', 'n/a')}")
    click.echo(f"Status:   {run.get('status', 'n/a')}")
    click.echo(f"Duration: {run.get('duration_ms', 'n/a')}ms")
    click.echo(f"Created:  {run.get('created_at', 'n/a')}")
    click.echo(f"Finished: {run.get('finished_at', 'n/a')}")
    if run.get("error"):
        click.echo(f"Error:    {run['error']}")


@runs_group.command(name="logs")
@click.argument("run_id")
@click.option("--limit", "-l", default=100, help="Number of log entries to fetch")
def get_run_logs(run_id: str, limit: int):
    """Get logs for an observability run"""
    config, client = _require_auth()
    response = client.get(f"/v1/observability/runs/{run_id}/logs", params={"limit": limit})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    logs = response.json()
    if not logs:
        click.echo("No logs found for this run.")
        return

    for log in logs:
        level = log.get("level", "INFO")
        click.echo(f"{log.get('timestamp', '')} | {level} | {log.get('message', '')}")


@runs_group.command(name="trigger")
@click.option("--agent-id", "-a", required=True, help="Agent ID to run")
@click.option("--input", "input_json", default="{}", help="JSON input payload")
@click.option("--name", "-n", default=None, help="Optional run name")
def trigger_run(agent_id: str, input_json: str, name: Optional[str]):
    """Trigger a new observability run"""
    config, client = _require_auth()
    import json

    try:
        parsed_input = json.loads(input_json)
    except json.JSONDecodeError:
        click.echo("Error: Invalid JSON in --input", err=True)
        return

    payload: dict[str, Any] = {"agent_id": agent_id, "input": parsed_input}
    if name:
        payload["name"] = name

    response = client.post("/v1/observability/runs", json=payload)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code not in (200, 201):
        click.echo(f"Error: {response.text}", err=True)
        return

    run = response.json()
    click.echo(f"Triggered run: {run['id']}")
    click.echo(f"Status: {run.get('status')}")


@runs_group.command(name="cancel")
@click.argument("run_id")
def cancel_run(run_id: str):
    """Cancel a running observability run"""
    config, client = _require_auth()
    response = client.post(f"/v1/observability/runs/{run_id}/cancel")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Run not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Cancelled run: {run_id}")


@runs_group.command(name="delete")
@click.argument("run_id")
@click.option("--force", "-f", is_flag=True, help="Delete without confirmation")
def delete_run(run_id: str, force: bool):
    """Delete an observability run"""
    config, client = _require_auth()

    if not force and not click.confirm(f"Are you sure you want to delete run {run_id}?"):
        return

    response = client.delete(f"/v1/observability/runs/{run_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Run not found", err=True)
        return

    if response.status_code != 204:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Deleted run: {run_id}")
