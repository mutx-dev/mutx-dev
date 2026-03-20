import json

import click
import httpx

from cli.config import current_config
from cli.services import AssistantService, AuthService, CLIServiceError


@click.command(name="doctor")
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def doctor_command(output: str):
    config = current_config()
    auth = AuthService(config=config)
    assistant_service = AssistantService(config=config)

    payload: dict[str, object] = {
        "api_url": config.api_url,
        "api_url_source": config.api_url_source,
        "config_path": str(config.config_path),
        "authenticated": auth.status().authenticated,
        "api_health": "unreachable",
        "user": None,
        "assistant": None,
    }

    try:
        response = httpx.get(f"{config.api_url}/health", timeout=2.0)
        payload["api_health"] = response.json().get("status", "unknown") if response.status_code == 200 else "error"
    except httpx.HTTPError:
        payload["api_health"] = "unreachable"

    try:
        if auth.status().authenticated:
            user = auth.whoami()
            payload["user"] = {"email": user.email, "name": user.name, "plan": user.plan}
            overview = assistant_service.overview()
            if overview is not None:
                payload["assistant"] = {
                    "name": overview.name,
                    "status": overview.status,
                    "onboarding_status": overview.onboarding_status,
                    "session_count": overview.session_count,
                    "gateway_status": overview.gateway.status,
                }
    except CLIServiceError:
        pass

    if output == "json":
        click.echo(json.dumps(payload, indent=2))
        return

    click.echo(f"API URL: {payload['api_url']} ({payload['api_url_source']})")
    click.echo(f"Config Path: {payload['config_path']}")
    click.echo(f"Authenticated: {'yes' if payload['authenticated'] else 'no'}")
    click.echo(f"API Health: {payload['api_health']}")
    if payload["user"]:
        click.echo(
            f"User: {payload['user']['email']} | {payload['user']['name']} | {payload['user']['plan']}"
        )
    if payload["assistant"]:
        click.echo(
            "Assistant: "
            f"{payload['assistant']['name']} | {payload['assistant']['status']} | "
            f"{payload['assistant']['onboarding_status']} | sessions={payload['assistant']['session_count']} | "
            f"gateway={payload['assistant']['gateway_status']}"
        )
