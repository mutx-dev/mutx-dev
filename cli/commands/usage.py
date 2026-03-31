import click
from typing import Any

from cli.config import CLIConfig, get_client


@click.group(name="usage")
def usage_group():
    """View usage statistics"""
    pass


def _require_auth() -> tuple[CLIConfig, Any]:
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        raise SystemExit(1)
    return config, get_client(config)


@usage_group.command(name="summary")
@click.option(
    "--period",
    "-p",
    default="monthly",
    type=click.Choice(["daily", "weekly", "monthly", "yearly"]),
    help="Time period",
)
def usage_summary(period: str):
    """Get overall usage summary"""
    config, client = _require_auth()
    response = client.get("/v1/usage/summary", params={"period": period})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    data = response.json()
    click.echo(f"Period:  {data.get('period', period)}")
    click.echo(f"Requests:   {data.get('requests', 0):,}")
    click.echo(f"Tokens:     {data.get('tokens', 0):,}")
    click.echo(f"Cost:       {data.get('cost', 0):.4f} {data.get('currency', 'USD')}")
    click.echo(f"Agents:     {data.get('active_agents', 0)}")


@usage_group.command(name="by-agent")
@click.option("--limit", "-l", default=50, help="Number of records to fetch")
@click.option(
    "--period",
    "-p",
    default="monthly",
    type=click.Choice(["daily", "weekly", "monthly", "yearly"]),
    help="Time period",
)
def usage_by_agent(limit: int, period: str):
    """Get usage breakdown by agent"""
    config, client = _require_auth()
    response = client.get("/v1/usage/by-agent", params={"limit": limit, "period": period})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    data = response.json()
    if not data:
        click.echo("No usage data found.")
        return

    header = f"{'AGENT ID':<40} {'REQUESTS':<12} {'TOKENS':<12} {'COST':<12}"
    click.echo(header)
    click.echo("-" * len(header))

    for row in data:
        click.echo(
            f"{row.get('agent_id', 'n/a')[:38]:<40} "
            f"{row.get('requests', 0):<12,} "
            f"{row.get('tokens', 0):<12,} "
            f"{row.get('cost', 0):.4f}"
        )


@usage_group.command(name="by-day")
@click.option(
    "--period",
    "-p",
    default="monthly",
    type=click.Choice(["daily", "weekly", "monthly", "yearly"]),
    help="Time period",
)
def usage_by_day(period: str):
    """Get usage breakdown by day"""
    config, client = _require_auth()
    response = client.get("/v1/usage/by-day", params={"period": period})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    data = response.json()
    if not data:
        click.echo("No usage data found.")
        return

    header = f"{'DATE':<14} {'REQUESTS':<12} {'TOKENS':<12} {'COST':<12}"
    click.echo(header)
    click.echo("-" * len(header))

    for row in data:
        click.echo(
            f"{row.get('date', 'n/a'):<14} "
            f"{row.get('requests', 0):<12,} "
            f"{row.get('tokens', 0):<12,} "
            f"{row.get('cost', 0):.4f}"
        )


@usage_group.command(name="current")
def usage_current():
    """Get current billing period usage"""
    config, client = _require_auth()
    response = client.get("/v1/usage/current")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    data = response.json()
    click.echo(f"Period:    {data.get('period_label', 'n/a')}")
    click.echo(f"Start:     {data.get('period_start', 'n/a')}")
    click.echo(f"End:       {data.get('period_end', 'n/a')}")
    click.echo(f"Requests:  {data.get('requests', 0):,}")
    click.echo(f"Tokens:    {data.get('tokens', 0):,}")
    click.echo(f"Cost:      {data.get('cost', 0):.4f} {data.get('currency', 'USD')}")
    if data.get("budget_limit"):
        pct = data.get("cost", 0) / data["budget_limit"] * 100
        click.echo(
            f"Budget:    {data['budget_limit']} {data.get('currency', 'USD')} ({pct:.1f}% used)"
        )
