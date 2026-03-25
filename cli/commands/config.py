import click

from cli.config import current_config


@click.group(name="config")
def config_group():
    """Manage local CLI settings"""
    pass


@config_group.command(name="show")
def show_config():
    """Show current local configuration"""
    config = current_config()
    click.echo(f"API URL:        {config.api_url}")
    click.echo(f"API URL Source: {config.api_url_source}")
    click.echo(f"Access Token:   {'(set)' if config.access_token else '(not set)'}")
    click.echo(f"Refresh Token:  {'(set)' if config.refresh_token else '(not set)'}")
    click.echo(f"Config Path:    {config.config_path}")


@config_group.command(name="get")
@click.argument("key")
def get_config(key: str):
    """Get a specific config value"""
    config = current_config()
    if key == "api_key":
        key = "access_token"

    valid_keys = ["api_url", "access_token", "refresh_token", "config_path"]
    if key not in valid_keys:
        click.echo(f"Error: Invalid key '{key}'. Valid keys: {', '.join(valid_keys)}", err=True)
        return

    if key == "config_path":
        click.echo(str(config.config_path))
    elif key == "access_token":
        click.echo("***" if config.access_token else "(not set)")
    elif key == "refresh_token":
        click.echo("***" if config.refresh_token else "(not set)")
    else:
        value = getattr(config, key, None)
        click.echo(value if value else "(not set)")


@config_group.command(name="set")
@click.argument("key")
@click.argument("value", required=False)
@click.option("--unset", is_flag=True, help="Unset a config value")
def set_config(key: str, value: str, unset: bool):
    """Set a config value"""
    config = current_config()

    valid_keys = ["api_url"]
    if key not in valid_keys:
        click.echo(f"Error: Invalid key '{key}'. Editable keys: {', '.join(valid_keys)}", err=True)
        return

    if unset:
        click.echo(f"Error: Cannot unset '{key}' via this command.", err=True)
        return

    if key == "api_url":
        config.api_url = value
        click.echo(f"API URL set to: {value}")

    config.save()


@config_group.command(name="unset")
@click.argument("key")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation prompt")
def unset_config(key: str, force: bool):
    """Unset a config value"""
    config = current_config()
    if key == "api_key":
        key = "access_token"

    valid_keys = ["access_token", "refresh_token"]
    if key not in valid_keys:
        click.echo(f"Error: Invalid key '{key}'. Can only unset: {', '.join(valid_keys)}", err=True)
        return

    if not force:
        if not click.confirm(f"Are you sure you want to unset {key}?"):
            return

    if key == "access_token":
        config.access_token = None
    elif key == "refresh_token":
        config.refresh_token = None

    config.save()
    click.echo(f"Unset {key}")


@config_group.command(name="reset")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation prompt")
def reset_config(force: bool):
    """Reset all local configuration to defaults"""
    if not force:
        if not click.confirm("This will clear all local settings. Continue?"):
            return

    config = current_config()
    config.api_url = "http://localhost:8000"
    config.access_token = None
    config.refresh_token = None
    config.save()

    click.echo("Configuration reset to defaults.")
    click.echo("API URL: http://localhost:8000")
