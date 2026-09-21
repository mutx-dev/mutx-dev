import pytest


@pytest.mark.parametrize(
    "kind,module_fragment",
    [
        ("zipkin", "zipkin.json"),
        ("otlp", "otlp.proto.grpc"),
        ("console", "sdk.trace.export"),
    ],
)
def test_supported_exporters_load_installed_implementations(monkeypatch, kind, module_fragment):
    from src.api.telemetry.telemetry import get_exporter_from_env

    monkeypatch.setenv("OTEL_TRACES_EXPORTER", kind)
    exporter = get_exporter_from_env()
    assert module_fragment in type(exporter).__module__
    exporter.shutdown()
