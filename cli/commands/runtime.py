from __future__ import annotations

import json
import subprocess

import click

from cli.openclaw_runtime import collect_openclaw_runtime_snapshot, open_openclaw_surface
from cli.runtime_registry import list_registered_providers, load_manifest
from cli.services import CLIServiceError, RuntimeStateService
from cli.config import current_config, get_client
from cli.setup_wizard import prepare_runtime_state_sync


@click.group(name="runtime")
def runtime_group():
    """Inspect and sync local provider runtimes tracked by MUTX."""
    pass


def _service() -> RuntimeStateService:
    return RuntimeStateService(config=current_config(), client_factory=get_client)


@runtime_group.command(name="list")
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def runtime_list_command(output: str) -> None:
    providers = list_registered_providers()
    if output == "json":
        click.echo(json.dumps(providers, indent=2))
        return

    if not providers:
        click.echo("No tracked providers found under ~/.mutx/providers.")
        return

    for provider in providers:
        click.echo(
            f"{provider.get('provider')} | {provider.get('status')} | "
            f"bindings={provider.get('binding_count', 0)} | "
            f"last_seen={provider.get('last_seen_at') or 'n/a'}"
        )


@runtime_group.command(name="inspect")
@click.argument("provider")
@click.option("--output", type=click.Choice(["table", "json"]), default="json")
def runtime_inspect_command(provider: str, output: str) -> None:
    if provider != "openclaw":
        raise click.ClickException(f"Unsupported provider '{provider}'.")

    local_manifest = load_manifest(provider) or collect_openclaw_runtime_snapshot().to_payload()
    remote_payload = None
    try:
        remote_payload = _service().get_provider(provider).payload
    except CLIServiceError:
        remote_payload = None

    payload = {
        "local": local_manifest,
        "remote": remote_payload,
    }

    if output == "json":
        click.echo(json.dumps(payload, indent=2))
        return

    click.echo(f"Provider: {local_manifest.get('label') or provider}")
    click.echo(f"Status: {local_manifest.get('status')}")
    click.echo(f"Gateway: {local_manifest.get('gateway_url') or 'n/a'}")
    click.echo(f"Bindings: {local_manifest.get('binding_count', 0)}")
    click.echo(f"Binary: {local_manifest.get('binary_path') or 'n/a'}")
    click.echo(f"Config: {local_manifest.get('config_path') or 'n/a'}")
    click.echo(f"Home: {local_manifest.get('home_path') or 'n/a'}")
    click.echo(f"Tracking: {local_manifest.get('tracking_mode') or 'track_external_runtime'}")
    click.echo(
        "Adopted runtime: " + ("yes" if local_manifest.get("adopted_existing_runtime") else "no")
    )
    click.echo(
        "Keys stay local: " + ("yes" if local_manifest.get("keys_remain_local", True) else "no")
    )
    click.echo(
        f"Privacy: {local_manifest.get('privacy_summary') or 'Local-only runtime tracking.'}"
    )
    if remote_payload:
        click.echo(f"Remote last_seen: {remote_payload.get('last_seen_at') or 'n/a'}")


@runtime_group.command(name="resync")
@click.argument("provider")
def runtime_resync_command(provider: str) -> None:
    if provider != "openclaw":
        raise click.ClickException(f"Unsupported provider '{provider}'.")

    try:
        payload = prepare_runtime_state_sync(
            _service(),
            install_method=str(load_manifest(provider).get("install_method") or "npm"),
        )
    except CLIServiceError as exc:
        raise click.ClickException(str(exc)) from exc

    click.echo(
        f"Synced {provider}: {payload.get('status')} | "
        f"last_seen={payload.get('last_seen_at') or 'n/a'} | "
        f"remote_synced={payload.get('last_synced_at') or 'n/a'}"
    )


@runtime_group.command(name="open")
@click.argument("provider")
@click.option(
    "--surface",
    type=click.Choice(["tui", "configure"]),
    default="tui",
    show_default=True,
    help="Open an upstream OpenClaw terminal surface in the current shell",
)
def runtime_open_command(provider: str, surface: str) -> None:
    if provider != "openclaw":
        raise click.ClickException(f"Unsupported provider '{provider}'.")

    manifest = load_manifest(provider) or collect_openclaw_runtime_snapshot().to_payload()
    gateway_url = str(manifest.get("gateway_url") or "") or None
    label = "OpenClaw TUI" if surface == "tui" else "OpenClaw configure"
    try:
        open_openclaw_surface(
            surface=surface,
            gateway_url=gateway_url,
            command_runner=lambda command: _run_surface_command(command, label=label),
        )
    except CLIServiceError as exc:
        raise click.ClickException(str(exc)) from exc

    try:
        payload = prepare_runtime_state_sync(
            _service(),
            install_method=str(manifest.get("install_method") or "npm"),
            action_type=surface,
        )
    except CLIServiceError as exc:
        raise click.ClickException(str(exc)) from exc

    click.echo(
        f"Returned from {label}: {payload.get('status')} | "
        f"last_seen={payload.get('last_seen_at') or 'n/a'}"
    )


def _run_surface_command(command: list[str], *, label: str) -> None:
    click.echo(f"Opening {label} in this shell…")
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        raise CLIServiceError(f"{label} failed with exit code {result.returncode}.")
