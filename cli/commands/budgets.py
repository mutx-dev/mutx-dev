import click
from typing import Any, Optional

from cli.config import CLIConfig, get_client


@click.group(name="budgets")
def budgets_group():
    """Manage budgets"""
    pass


def _require_auth() -> tuple[CLIConfig, Any]:
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        raise SystemExit(1)
    return config, get_client(config)


@budgets_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of budgets to fetch")
@click.option("--skip", "-s", default=0, help="Number of budgets to skip")
def list_budgets(limit: int, skip: int):
    """List all budgets"""
    config, client = _require_auth()
    response = client.get("/v1/budgets", params={"limit": limit, "skip": skip})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    budgets = response.json()
    if not budgets:
        click.echo("No budgets found.")
        return

    for budget in budgets:
        spent = budget.get("spent", 0)
        limit_ = budget.get("limit", 0)
        pct = f"{spent / limit_ * 100:.1f}%" if limit_ else "n/a"
        click.echo(
            f"{budget['id']} | {budget.get('name', 'unnamed')} | {spent}/{limit_} {budget.get('currency', 'USD')} ({pct})"
        )


@budgets_group.command(name="get")
@click.argument("budget_id")
def get_budget(budget_id: str):
    """Get a budget by ID"""
    config, client = _require_auth()
    response = client.get(f"/v1/budgets/{budget_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Budget not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    budget = response.json()
    click.echo(f"ID:       {budget['id']}")
    click.echo(f"Name:     {budget.get('name', 'n/a')}")
    click.echo(f"Limit:    {budget.get('limit', 0)} {budget.get('currency', 'USD')}")
    click.echo(f"Spent:    {budget.get('spent', 0)}")
    click.echo(f"Reset:    {budget.get('reset_at', 'n/a')}")
    click.echo(f"Status:   {budget.get('status', 'n/a')}")


@budgets_group.command(name="create")
@click.option("--name", "-n", required=True, help="Budget name")
@click.option("--limit", "-l", required=True, type=float, help="Spending limit")
@click.option("--currency", "-c", default="USD", help="Currency code (default: USD)")
@click.option(
    "--period",
    "-p",
    default="monthly",
    type=click.Choice(["daily", "weekly", "monthly", "yearly"]),
    help="Budget period",
)
def create_budget(name: str, limit: float, currency: str, period: str):
    """Create a new budget"""
    config, client = _require_auth()
    response = client.post(
        "/v1/budgets",
        json={"name": name, "limit": limit, "currency": currency, "period": period},
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code not in (200, 201):
        click.echo(f"Error: {response.text}", err=True)
        return

    budget = response.json()
    click.echo(f"Created budget: {budget['id']}")
    click.echo(f"Name: {budget.get('name')}")
    click.echo(f"Limit: {budget.get('limit')} {budget.get('currency', 'USD')}")


@budgets_group.command(name="update")
@click.argument("budget_id")
@click.option("--name", "-n", default=None, help="New budget name")
@click.option("--limit", "-l", type=float, default=None, help="New spending limit")
def update_budget(budget_id: str, name: Optional[str], limit: Optional[float]):
    """Update a budget"""
    config, client = _require_auth()
    payload: dict[str, Any] = {}
    if name is not None:
        payload["name"] = name
    if limit is not None:
        payload["limit"] = limit

    if not payload:
        click.echo("Error: Provide at least --name or --limit to update.", err=True)
        return

    response = client.patch(f"/v1/budgets/{budget_id}", json=payload)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Budget not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    budget = response.json()
    click.echo(f"Updated budget: {budget['id']}")
    click.echo(f"Name: {budget.get('name')}")
    click.echo(f"Limit: {budget.get('limit')} {budget.get('currency', 'USD')}")


@budgets_group.command(name="delete")
@click.argument("budget_id")
@click.option("--force", "-f", is_flag=True, help="Delete without confirmation")
def delete_budget(budget_id: str, force: bool):
    """Delete a budget"""
    config, client = _require_auth()

    if not force and not click.confirm(f"Are you sure you want to delete budget {budget_id}?"):
        return

    response = client.delete(f"/v1/budgets/{budget_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Budget not found", err=True)
        return

    if response.status_code != 204:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Deleted budget: {budget_id}")
