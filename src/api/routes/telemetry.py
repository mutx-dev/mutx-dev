"""
Telemetry configuration routes.

Provides endpoints for OpenTelemetry configuration status and backend setup.
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from src.api.middleware.auth import get_current_internal_user
from src.api.services.telemetry_backend import (
    configure_telemetry_backend,
    get_telemetry_health,
    get_current_config,
)

router = APIRouter(
    prefix="/telemetry",
    tags=["telemetry"],
    dependencies=[Depends(get_current_internal_user)],
)


class TelemetryConfigRequest(BaseModel):
    """Request model for telemetry configuration."""

    otlp_endpoint: str
    protocol: Literal["grpc", "http"] = "grpc"


@router.get("/config")
async def get_telemetry_config(request: Request):
    """Get current telemetry configuration.

    Returns the OTEL status including whether it's enabled,
    the exporter type, and endpoint if configured.
    """
    from src.api.telemetry.telemetry import get_exporter_from_env

    exporter = get_exporter_from_env()
    exporter_type = "console"
    if hasattr(exporter, "__class__"):
        exporter_name = exporter.__class__.__name__
        if "OTLP" in exporter_name:
            exporter_type = "otlp"
        elif "Zipkin" in exporter_name:
            exporter_type = "zipkin"
        elif "Jaeger" in exporter_name:
            exporter_type = "jaeger"

    config = get_current_config()
    if config.get("endpoint") and exporter_type == "console":
        exporter_type = "otlp"

    return {
        "otel_enabled": True,
        "exporter_type": config.get("exporter_type", exporter_type),
        "endpoint": config.get("endpoint"),
    }


@router.post("/config")
async def configure_telemetry(request: TelemetryConfigRequest):
    """Configure the telemetry backend OTLP endpoint.

    Allows dynamic configuration of the OTLP endpoint and protocol
    for exporting traces and metrics to Grafana/Jaeger/Tempo.

    Args:
        request: Contains otlp_endpoint (URL) and protocol (grpc or http).

    Returns:
        The updated telemetry configuration.
    """
    try:
        configure_telemetry_backend(
            otlp_endpoint=request.otlp_endpoint,
            protocol=request.protocol,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    config = get_current_config()
    health = get_telemetry_health()

    return {
        "status": "configured",
        "config": config,
        "health": health,
    }


@router.get("/health")
async def get_telemetry_backend_health():
    """Get health status of the configured telemetry backend.

    Returns:
        Health status including whether the backend is configured
        and reachable.
    """
    return get_telemetry_health()
