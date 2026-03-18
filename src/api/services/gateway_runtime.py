"""Gateway runtime configuration and credential detection."""
import json
import os
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class GatewayConfig:
    """OpenClaw gateway configuration."""
    auth_mode: str = "token"  # "token" or "password"
    auth_token: Optional[str] = None
    auth_password: Optional[str] = None
    port: int = 18789
    control_ui_allowed_origins: list[str] = None

    def __post_init__(self):
        if self.control_ui_allowed_origins is None:
            self.control_ui_allowed_origins = []


def _read_openclaw_config(config_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Read OpenClaw config from file."""
    if config_path is None:
        # Try default paths
        config_path = os.environ.get("OPENCLAW_CONFIG_PATH")
        if not config_path:
            # Common default locations
            for path in ["/etc/openclaw/openclaw.json", "./openclaw.json", "/app/openclaw.json"]:
                if os.path.exists(path):
                    config_path = path
                    break
    
    if not config_path or not os.path.exists(config_path):
        return None
    
    try:
        with open(config_path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.warning(f"Failed to read OpenClaw config: {e}")
        return None


def _parse_gateway_config(parsed: Optional[Dict[str, Any]]) -> GatewayConfig:
    """Parse gateway config from loaded config."""
    if not parsed:
        return GatewayConfig()
    
    gateway = parsed.get("gateway", {})
    auth = gateway.get("auth", {})
    
    return GatewayConfig(
        auth_mode=auth.get("mode", "token"),
        auth_token=auth.get("token"),
        auth_password=auth.get("password"),
        port=gateway.get("port", 18789),
        control_ui_allowed_origins=gateway.get("controlUi", {}).get("allowedOrigins", []),
    )


def register_mc_as_dashboard(mc_url: str, config_path: Optional[str] = None) -> dict:
    """
    Register MC origin in gateway config's allowedOrigins.
    
    Returns:
        dict with 'registered' and 'already_set' booleans
    """
    if config_path is None:
        config_path = os.environ.get("OPENCLAW_CONFIG_PATH")
        if not config_path:
            for path in ["/etc/openclaw/openclaw.json", "./openclaw.json", "/app/openclaw.json"]:
                if os.path.exists(path):
                    config_path = path
                    break
    
    if not config_path or not os.path.exists(config_path):
        return {"registered": False, "already_set": False}

    try:
        with open(config_path, "r") as f:
            parsed = json.load(f)
        
        # Ensure nested structure
        if "gateway" not in parsed:
            parsed["gateway"] = {}
        if "controlUi" not in parsed["gateway"]:
            parsed["gateway"]["controlUi"] = {}
        
        # Get origin from MC URL
        from urllib.parse import urlparse
        origin = urlparse(mc_url).netloc or urlparse(mc_url).geturl()
        if "://" in mc_url:
            parsed_url = urlparse(mc_url)
            origin = parsed_url.netloc or f"{parsed_url.hostname}:{parsed_url.port}" if parsed_url.port else parsed_url.hostname
        else:
            # Just use as-is if no scheme
            origin = mc_url.split(":")[0]  # host portion
        
        # Extract origin properly
        if "://" in mc_url:
            from urllib.parse import urlparse
            p = urlparse(mc_url)
            origin = f"{p.hostname}:{p.port}" if p.port else p.hostname
        else:
            # Handle host:port format
            parts = mc_url.split(":")
            origin = parts[0] if len(parts) == 1 else f"{parts[0]}:{parts[1]}"
        
        origins = parsed["gateway"]["controlUi"].get("allowedOrigins", [])
        already_in_origins = origin in origins
        
        if already_in_origins:
            return {"registered": False, "already_set": True}
        
        # Add MC origin to allowedOrigins only
        origins.append(origin)
        parsed["gateway"]["controlUi"]["allowedOrigins"] = origins
        
        with open(config_path, "w") as f:
            json.dump(parsed, f, indent=2)
            f.write("\n")
        
        logger.info(f"Registered MC origin in gateway config: {origin}")
        return {"registered": True, "already_set": False}
        
    except (IOError, json.JSONDecodeError) as e:
        # Read-only filesystem - treat as non-fatal skip
        if e.errno in (30, 1):  # EROFS, EPERM
            logger.warning(
                f"Gateway config is read-only — skipping MC origin registration. "
                f"To enable auto-registration, mount openclaw.json with write access or "
                f"add the MC origin to gateway.controlUi.allowedOrigins manually."
            )
            return {"registered": False, "already_set": False}
        logger.error(f"Failed to register MC in gateway config: {e}")
        return {"registered": False, "already_set": False}


def get_detected_gateway_token() -> str:
    """
    Returns the gateway auth credential (token or password) for Bearer/WS auth.
    
    Env overrides: OPENCLAW_GATEWAY_TOKEN, GATEWAY_TOKEN, OPENCLAW_GATEWAY_PASSWORD, GATEWAY_PASSWORD.
    From config: uses gateway.auth.token when mode is "token", gateway.auth.password when mode is "password".
    """
    # Check env vars first
    env_token = os.environ.get("OPENCLAW_GATEWAY_TOKEN") or os.environ.get("GATEWAY_TOKEN") or ""
    if env_token:
        return env_token.strip()
    
    env_password = os.environ.get("OPENCLAW_GATEWAY_PASSWORD") or os.environ.get("GATEWAY_PASSWORD") or ""
    if env_password:
        return env_password.strip()
    
    # Check config file
    parsed = _read_openclaw_config()
    auth = parsed.get("gateway", {}).get("auth", {}) if parsed else {}
    mode = auth.get("mode", "token")
    
    if mode == "password":
        credential = auth.get("password", "").strip()
    else:
        credential = auth.get("token", "").strip()
    
    return credential


def get_detected_gateway_port() -> Optional[int]:
    """
    Returns the detected gateway port from env or config.
    """
    # Check env vars
    env_port = os.environ.get("OPENCLAW_GATEWAY_PORT") or os.environ.get("GATEWAY_PORT")
    if env_port:
        try:
            port = int(env_port)
            if port > 0:
                return port
        except ValueError:
            pass
    
    # Check config file
    parsed = _read_openclaw_config()
    if parsed:
        cfg_port = parsed.get("gateway", {}).get("port", 0)
        try:
            port = int(cfg_port)
            if port > 0:
                return port
        except (ValueError, TypeError):
            pass
    
    return None


__all__ = [
    "GatewayConfig",
    "register_mc_as_dashboard",
    "get_detected_gateway_token",
    "get_detected_gateway_port",
]
