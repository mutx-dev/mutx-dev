"""Gateway URL building utilities for WebSocket connections."""
import os
from typing import Optional
from urllib.parse import urlparse, urlunparse, parse_qs


def _is_local_host(host: str) -> bool:
    """Check if host is localhost."""
    normalized = host.lower()
    return (
        normalized == "localhost"
        or normalized == "127.0.0.1"
        or normalized == "::1"
        or normalized.endswith(".local")
    )


def _normalize_protocol(protocol: str) -> str:
    """Normalize protocol to ws: or wss:."""
    if protocol == "https:" or protocol == "wss:":
        return "wss:"
    return "ws:"


def _normalize_gateway_path(pathname: str) -> str:
    """Normalize gateway path, collapsing session routes to root."""
    path = str(pathname or "/").strip() or "/"
    if path == "/sessions" or path == "/sessions/" or path.startswith("/sessions/"):
        return "/"
    return path if path == "/" else path.rstrip("/")


def _format_websocket_url(url: str) -> str:
    """Format WebSocket URL properly."""
    return url.rstrip("/").replace("/?", "?")


def build_gateway_websocket_url(
    host: str,
    port: int,
    browser_protocol: Optional[str] = None,
) -> str:
    """
    Build a WebSocket URL for the gateway.

    Args:
        host: Gateway host
        port: Gateway port
        browser_protocol: Protocol from browser (http: or https:)

    Returns:
        WebSocket URL string (ws:// or wss://)
    """
    raw_host = str(host or "").strip()
    port = int(port) if port else 0
    browser_protocol = browser_protocol if browser_protocol in ("https:", "http:") else "http:"

    if not raw_host:
        # Default host is localhost — always use plain ws:// since local gateway has no TLS.
        return f"ws://127.0.0.1:{port or 18789}"

    # Check if already has protocol prefix
    prefixed = None
    if raw_host.startswith(("ws://", "wss://", "http://", "https://")):
        prefixed = raw_host

    if prefixed:
        try:
            parsed = urlparse(prefixed)
            # Local hosts always use plain ws:// — no TLS on local gateway.
            new_protocol = "ws:" if _is_local_host(parsed.hostname) else _normalize_protocol(parsed.scheme)
            
            # Keep explicit proxy paths (e.g. /gw), but collapse known dashboard/session routes to root.
            new_path = _normalize_gateway_path(parsed.path)
            
            # Preserve token from query
            query_dict = parse_qs(parsed.query)
            token = query_dict.get("token", [None])[0]
            
            # Build new query
            new_query = f"token={token}" if token else ""
            
            # Reconstruct URL
            netloc = f"{parsed.hostname}:{parsed.port}" if parsed.port else parsed.hostname
            new_url = urlunparse((new_protocol, netloc, new_path, "", new_query, ""))
            return _format_websocket_url(new_url)
        except Exception:
            return prefixed

    # Local gateway hosts always use plain ws:// — they don't speak TLS,
    # and browsers allow ws://localhost from HTTPS pages (mixed-content exception).
    ws_protocol = "ws" if _is_local_host(raw_host) else ("wss" if browser_protocol == "https:" else "ws")
    
    # Omit default port for wss non-local hosts
    should_omit_port = ws_protocol == "wss" and not _is_local_host(raw_host) and port == 18789

    if should_omit_port:
        return f"{ws_protocol}://{raw_host}"
    return f"{ws_protocol}://{raw_host}:{port or 18789}"


__all__ = ["build_gateway_websocket_url"]
