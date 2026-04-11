import pytest
from httpx import ASGITransport, AsyncClient
from datetime import datetime, timezone

from src.api import main as main_module
from src.api.main import create_app


def _mounted_route_prefixes(app) -> set[str]:
    prefixes: set[str] = set()

    for route in app.routes:
        path = getattr(route, "path", None)
        if not path:
            continue

        if path == "/metrics":
            prefixes.add(path)
            continue

        if not path.startswith("/v1/"):
            continue

        parts = path.split("/")
        if len(parts) > 3 and parts[2] == "leads" and parts[3] == "contacts":
            prefixes.add("/v1/leads/contacts")
            continue

        prefixes.add(f"/v1/{parts[2]}")

    return prefixes


def test_app_factory_mounts_expected_public_routes():
    app = create_app(
        enable_lifespan=False,
        background_monitor_enabled=False,
        database_required_on_startup=False,
    )

    mounted_prefixes = _mounted_route_prefixes(app)

    assert mounted_prefixes == {
        "/metrics",
        "/v1/agents",
        "/v1/assistant",
        "/v1/api-keys",
        "/v1/auth",
        "/v1/budgets",
        "/v1/clawhub",
        "/v1/deployments",
        "/v1/governance",
        "/v1/ingest",
        "/v1/leads",
        "/v1/leads/contacts",
        "/v1/monitoring",
        "/v1/observability",
        "/v1/rag",
        "/v1/runtime",
        "/v1/runs",
        "/v1/security",
        "/v1/sessions",
        "/v1/swarms",
        "/v1/templates",
        "/v1/telemetry",
        "/v1/usage",
        "/v1/webhooks",
        "/v1/analytics",
        "/v1/onboarding",
        "/v1/pico",
        "/v1/approvals",
        "/v1/policies",
        "/v1/audit",
        "/v1/scheduler",
    }
    assert "/v1/newsletter" not in mounted_prefixes


def test_app_factory_disables_docs_in_production_by_default(monkeypatch):
    monkeypatch.setattr(main_module.settings, "environment", "production")
    monkeypatch.setattr(main_module.settings, "expose_api_docs_in_production", False)

    app = create_app(
        enable_lifespan=False,
        background_monitor_enabled=False,
        database_required_on_startup=False,
    )

    assert app.docs_url is None
    assert app.redoc_url is None
    assert app.openapi_url is None


def test_app_factory_can_opt_in_docs_in_production(monkeypatch):
    monkeypatch.setattr(main_module.settings, "environment", "production")
    monkeypatch.setattr(main_module.settings, "expose_api_docs_in_production", True)

    app = create_app(
        enable_lifespan=False,
        background_monitor_enabled=False,
        database_required_on_startup=False,
    )

    assert app.docs_url == "/docs"
    assert app.redoc_url == "/redoc"
    assert app.openapi_url == "/openapi.json"


@pytest.mark.asyncio
async def test_app_factory_rejects_untrusted_host_headers(monkeypatch):
    monkeypatch.setattr(main_module.settings, "allowed_hosts", ["testserver", "localhost"])

    app = create_app(
        enable_lifespan=False,
        background_monitor_enabled=False,
        database_required_on_startup=False,
    )
    app.state.start_time = datetime.now(timezone.utc).timestamp()
    app.state.database_ready = True
    app.state.database_error = None
    app.state.database_error_detail = None
    app.state.schema_repairs_applied = []

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as trusted_client:
        trusted_response = await trusted_client.get("/health")
        assert trusted_response.status_code == 200

        rejected_response = await trusted_client.get(
            "/health",
            headers={"host": "evil.example"},
        )

    assert rejected_response.status_code == 400


@pytest.mark.asyncio
async def test_app_factory_allows_railway_private_domain_when_present(monkeypatch):
    monkeypatch.setattr(main_module.settings, "allowed_hosts", ["localhost"])
    monkeypatch.setenv("RAILWAY_PRIVATE_DOMAIN", "zooming-youth.railway.internal")

    app = create_app(
        enable_lifespan=False,
        background_monitor_enabled=False,
        database_required_on_startup=False,
    )
    app.state.start_time = datetime.now(timezone.utc).timestamp()
    app.state.database_ready = True
    app.state.database_error = None
    app.state.database_error_detail = None
    app.state.schema_repairs_applied = []

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://zooming-youth.railway.internal",
    ) as railway_client:
        response = await railway_client.get("/health")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_includes_component_status(client: AsyncClient):
    response = await client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["database"] == "ready"
    assert payload["schema_repairs_applied"] == []
    assert payload["components"]["database"]["status"] == "healthy"
    assert payload["components"]["background_monitor"]["status"] == "disabled"
    assert "error" not in payload["components"]["background_monitor"]
    assert "last_error_at" not in payload["components"]["background_monitor"]
    assert "started_at" not in payload["components"]["background_monitor"]


@pytest.mark.asyncio
async def test_health_degrades_for_background_monitor_failures_while_ready_stays_db_based(
    client: AsyncClient,
):
    client.app.state.background_monitor_enabled = True
    client.app.state.background_monitor_state.started_at = datetime.now(timezone.utc)
    client.app.state.background_monitor_state.last_error = "monitor failed"
    client.app.state.background_monitor_state.last_error_at = datetime.now(timezone.utc)
    client.app.state.background_monitor_state.consecutive_failures = 2

    health_response = await client.get("/health")
    ready_response = await client.get("/ready")

    assert health_response.status_code == 200
    assert health_response.json()["status"] == "degraded"
    assert health_response.json()["components"]["background_monitor"]["status"] == "degraded"
    assert "error" not in health_response.json()["components"]["background_monitor"]
    assert "last_error_at" not in health_response.json()["components"]["background_monitor"]

    assert ready_response.status_code == 200
    assert ready_response.json()["status"] == "ready"
