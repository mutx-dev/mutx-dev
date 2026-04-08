"""
MUTX Telemetry Backend Service.

Provides API-level configuration and health checking for OpenTelemetry backends
(Grafana/Jaeger) integration. This module allows dynamic configuration of OTLP
endpoints and protocol selection.

Note: SDK-level telemetry is initialized separately in sdk/mutx/telemetry.py.
"""

from __future__ import annotations

import httpx
from typing import Literal

# Global OTLP configuration state
_otlp_endpoint: str | None = None
_otlp_protocol: Literal["grpc", "http"] = "grpc"
_configured: bool = False


def configure_telemetry_backend(
    otlp_endpoint: str, protocol: Literal["grpc", "http"] = "grpc"
) -> None:
    """Configure the OTLP endpoint for MUTX telemetry export.

    Args:
        otlp_endpoint: The OTLP collector endpoint URL (e.g., 'http://jaeger:4317').
        protocol: The OTLP protocol to use - 'grpc' (default) or 'http'.

    Raises:
        ValueError: If the protocol is not 'grpc' or 'http'.
    """
    global _otlp_endpoint, _otlp_protocol, _configured

    if protocol not in ("grpc", "http"):
        raise ValueError(f"Invalid protocol: {protocol}. Must be 'grpc' or 'http'.")

    _otlp_endpoint = otlp_endpoint
    _otlp_protocol = protocol
    _configured = True


def get_telemetry_health() -> dict[str, bool]:
    """Check health of the configured telemetry backend.

    Pings the OTLP endpoint to verify connectivity. Returns a dictionary
    indicating whether the telemetry backend is reachable and configured.

    Returns:
        Dictionary with:
            - configured: Whether an OTLP endpoint has been configured.
            - endpoint_reachable: Whether the endpoint responds to health check.
            - using_grpc: Whether using gRPC protocol (vs HTTP).
            - endpoint: The configured endpoint URL (or None).
    """
    global _otlp_endpoint, _otlp_protocol, _configured

    health_status = {
        "configured": _configured,
        "endpoint_reachable": False,
        "using_grpc": _otlp_protocol == "grpc",
        "endpoint": _otlp_endpoint,
    }

    if not _configured or _otlp_endpoint is None:
        return health_status

    # Determine health check URL based on protocol
    # For gRPC, we check if the endpoint is reachable via HTTP(s) health endpoint
    check_url = _otlp_endpoint.rstrip("/")
    if _otlp_protocol == "grpc":
        # gRPC health checks typically use HTTP on a different port
        # Try the same host with HTTP protocol health endpoint
        if ":4317" in check_url:
            check_url = check_url.replace(":4317", ":4318")
        elif check_url.endswith(":4317"):
            check_url = check_url[:-5] + ":4318"

    # Add /health suffix for standard OTEL collector health endpoint
    health_url = f"{check_url}/health"

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(health_url)
            health_status["endpoint_reachable"] = response.status_code < 500
    except (httpx.RequestError, httpx.TimeoutException):
        # If health endpoint not available, try a simple connectivity check
        # by attempting to connect to the base endpoint
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(check_url)
                health_status["endpoint_reachable"] = response.status_code < 500
        except (httpx.RequestError, httpx.TimeoutException):
            health_status["endpoint_reachable"] = False

    return health_status


def is_telemetry_configured() -> bool:
    """Check if telemetry backend has been configured.

    Returns:
        True if configure_telemetry_backend() has been called.
    """
    return _configured


def get_current_config() -> dict[str, str | None]:
    """Get the current telemetry configuration.

    Returns:
        Dictionary with endpoint and protocol settings.
    """
    return {
        "endpoint": _otlp_endpoint,
        "protocol": _otlp_protocol,
    }
