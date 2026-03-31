import click
from typing import Any

from cli.config import CLIConfig, get_client


@click.group(name="scheduler")
def scheduler_group():
    """Manage scheduled tasks"""
    pass


def _require_auth() -> tuple[CLIConfig, Any]:
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        raise SystemExit(1)
    return config, get_client(config)


@scheduler_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of schedules to fetch")
@click.option("--skip", "-s", default=0, help="Number of schedules to skip")
def list_schedules(limit: int, skip: int):
    """List all scheduled tasks"""
    config, client = _require_auth()
    response = client.get("/v1/scheduler/schedules", params={"limit": limit, "skip": skip})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    schedules = response.json()
    if not schedules:
        click.echo("No schedules found.")
        return

    for schedule in schedules:
        active = "active" if schedule.get("is_active", False) else "paused"
        cron = schedule.get("cron_expression", "n/a")
        click.echo(
            f"{schedule['id']} | {schedule.get('name', 'unnamed')} | {active} | cron: {cron}"
        )


@scheduler_group.command(name="get")
@click.argument("schedule_id")
def get_schedule(schedule_id: str):
    """Get a scheduled task by ID"""
    config, client = _require_auth()
    response = client.get(f"/v1/scheduler/schedules/{schedule_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Schedule not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    schedule = response.json()
    click.echo(f"ID:       {schedule['id']}")
    click.echo(f"Name:     {schedule.get('name', 'n/a')}")
    click.echo(f"Agent:    {schedule.get('agent_id', 'n/a')}")
    click.echo(f"Cron:     {schedule.get('cron_expression', 'n/a')}")
    click.echo(f"Status:   {'active' if schedule.get('is_active') else 'paused'}")
    click.echo(f"Next run: {schedule.get('next_scheduled_at', 'n/a')}")
    click.echo(f"Created:  {schedule.get('created_at', 'n/a')}")


@scheduler_group.command(name="create")
@click.option("--name", "-n", required=True, help="Schedule name")
@click.option("--agent-id", required=True, help="Agent ID to trigger")
@click.option("--cron", "-c", required=True, help="Cron expression (e.g. '0 * * * *')")
@click.option("--input", "input_json", default="{}", help="JSON input payload for the run")
def create_schedule(name: str, agent_id: str, cron: str, input_json: str):
    """Create a new scheduled task"""
    config, client = _require_auth()
    import json

    try:
        parsed_input = json.loads(input_json)
    except json.JSONDecodeError:
        click.echo("Error: Invalid JSON in --input", err=True)
        return

    response = client.post(
        "/v1/scheduler/schedules",
        json={
            "name": name,
            "agent_id": agent_id,
            "cron_expression": cron,
            "input": parsed_input,
        },
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code not in (200, 201):
        click.echo(f"Error: {response.text}", err=True)
        return

    schedule = response.json()
    click.echo(f"Created schedule: {schedule['id']}")
    click.echo(f"Name: {schedule.get('name')}")
    click.echo(f"Next run: {schedule.get('next_scheduled_at', 'n/a')}")


@scheduler_group.command(name="pause")
@click.argument("schedule_id")
def pause_schedule(schedule_id: str):
    """Pause a scheduled task"""
    config, client = _require_auth()
    response = client.post(f"/v1/scheduler/schedules/{schedule_id}/pause")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Schedule not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Paused schedule: {schedule_id}")


@scheduler_group.command(name="resume")
@click.argument("schedule_id")
def resume_schedule(schedule_id: str):
    """Resume a paused scheduled task"""
    config, client = _require_auth()
    response = client.post(f"/v1/scheduler/schedules/{schedule_id}/resume")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Schedule not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Resumed schedule: {schedule_id}")


@scheduler_group.command(name="delete")
@click.argument("schedule_id")
@click.option("--force", "-f", is_flag=True, help="Delete without confirmation")
def delete_schedule(schedule_id: str, force: bool):
    """Delete a scheduled task"""
    config, client = _require_auth()

    if not force and not click.confirm(f"Are you sure you want to delete schedule {schedule_id}?"):
        return

    response = client.delete(f"/v1/scheduler/schedules/{schedule_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Schedule not found", err=True)
        return

    if response.status_code != 204:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Deleted schedule: {schedule_id}")
