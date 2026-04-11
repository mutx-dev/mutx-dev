import pytest
from httpx import AsyncClient

import src.api.routes.telemetry as telemetry_route
import src.api.telemetry.telemetry as telemetry_sdk


class FakeOTLPExporter:
    pass


@pytest.mark.asyncio
async def test_get_telemetry_config_requires_authentication(
    client_no_auth: AsyncClient, monkeypatch
):
    monkeypatch.setattr(telemetry_sdk, "get_exporter_from_env", lambda: FakeOTLPExporter())
    monkeypatch.setattr(
        telemetry_route,
        "get_current_config",
        lambda: {"endpoint": "http://tempo:4317"},
    )

    response = await client_no_auth.get("/v1/telemetry/config")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_telemetry_config_infers_exporter_type_from_sdk(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(telemetry_sdk, "get_exporter_from_env", lambda: FakeOTLPExporter())
    monkeypatch.setattr(
        telemetry_route,
        "get_current_config",
        lambda: {"endpoint": "http://tempo:4317"},
    )

    response = await client.get("/v1/telemetry/config")

    assert response.status_code == 200
    assert response.json() == {
        "otel_enabled": True,
        "exporter_type": "console",
        "endpoint": "http://tempo:4317",
    }


@pytest.mark.asyncio
async def test_configure_telemetry_requires_authentication(client_no_auth: AsyncClient):
    response = await client_no_auth.post(
        "/v1/telemetry/config",
        json={"otlp_endpoint": "http://tempo:4317", "protocol": "http"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_configure_telemetry_returns_config_and_health(client: AsyncClient, monkeypatch):
    captured: dict[str, str] = {}

    def fake_configure_telemetry_backend(*, otlp_endpoint: str, protocol: str) -> None:
        captured["otlp_endpoint"] = otlp_endpoint
        captured["protocol"] = protocol

    monkeypatch.setattr(
        telemetry_route,
        "configure_telemetry_backend",
        fake_configure_telemetry_backend,
    )
    monkeypatch.setattr(
        telemetry_route,
        "get_current_config",
        lambda: {"endpoint": "http://tempo:4317", "protocol": "http"},
    )
    monkeypatch.setattr(
        telemetry_route,
        "get_telemetry_health",
        lambda: {
            "configured": True,
            "endpoint_reachable": True,
            "using_grpc": False,
            "endpoint": "http://tempo:4317",
        },
    )

    response = await client.post(
        "/v1/telemetry/config",
        json={"otlp_endpoint": "http://tempo:4317", "protocol": "http"},
    )

    assert response.status_code == 200
    assert captured == {"otlp_endpoint": "http://tempo:4317", "protocol": "http"}
    assert response.json() == {
        "status": "configured",
        "config": {"endpoint": "http://tempo:4317", "protocol": "http"},
        "health": {
            "configured": True,
            "endpoint_reachable": True,
            "using_grpc": False,
            "endpoint": "http://tempo:4317",
        },
    }


@pytest.mark.asyncio
async def test_configure_telemetry_returns_400_for_backend_validation_error(
    client: AsyncClient, monkeypatch
):
    def fake_configure_telemetry_backend(*, otlp_endpoint: str, protocol: str) -> None:
        raise ValueError("collector endpoint must start with http")

    monkeypatch.setattr(
        telemetry_route,
        "configure_telemetry_backend",
        fake_configure_telemetry_backend,
    )

    response = await client.post(
        "/v1/telemetry/config",
        json={"otlp_endpoint": "tempo:4317", "protocol": "grpc"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "collector endpoint must start with http"}


@pytest.mark.asyncio
async def test_configure_telemetry_returns_500_for_unexpected_error(
    client: AsyncClient, monkeypatch
):
    def fake_configure_telemetry_backend(*, otlp_endpoint: str, protocol: str) -> None:
        raise RuntimeError("disk full")

    monkeypatch.setattr(
        telemetry_route,
        "configure_telemetry_backend",
        fake_configure_telemetry_backend,
    )

    response = await client.post(
        "/v1/telemetry/config",
        json={"otlp_endpoint": "http://tempo:4317", "protocol": "grpc"},
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Failed to configure telemetry backend"}
