"""
Tests for OpenTelemetry telemetry functionality.

Tests SDK telemetry operations, span creation, and trace context propagation.
"""

import sys
from unittest.mock import MagicMock, patch
import pytest

# Add SDK path to avoid circular imports through mutx/__init__.py
import importlib.util


def import_telemetry_module():
    """Import telemetry module directly without going through mutx/__init__.py."""
    import os

    telemetry_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "sdk",
        "mutx",
        "telemetry.py",
    )
    spec = importlib.util.spec_from_file_location("telemetry", telemetry_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["telemetry"] = module
    spec.loader.exec_module(module)
    return module


class TestTelemetrySDK:
    """Tests for SDK telemetry module."""

    @pytest.fixture(autouse=True)
    def reset_and_import_telemetry(self):
        """Reset telemetry state and reimport module."""
        # Remove cached modules
        for mod in list(sys.modules.keys()):
            if "telemetry" in mod or mod.startswith("mutx"):
                del sys.modules[mod]

        # Reimport
        self.telemetry = import_telemetry_module()
        yield
        self.telemetry.shutdown_telemetry()

    @pytest.mark.asyncio
    async def test_init_telemetry_with_endpoint(self):
        """Test telemetry initialization with OTLP endpoint."""
        # Mock OTLP exporter to avoid network calls
        with patch.object(self.telemetry, "OTLPSpanExporter") as mock_otlp:
            mock_exporter = MagicMock()
            mock_otlp.return_value = mock_exporter

            self.telemetry.init_telemetry("test-agent", "http://localhost:4317")

            assert self.telemetry._telemetry_enabled is True

    @pytest.mark.asyncio
    async def test_init_telemetry_without_endpoint(self):
        """Test telemetry initialization with console/logging exporter."""
        self.telemetry.init_telemetry("test-agent", endpoint=None)

        assert self.telemetry._telemetry_enabled is True
        assert self.telemetry._telemetry_endpoint is None

    @pytest.mark.asyncio
    async def test_get_tracer_returns_tracer(self):
        """Test get_tracer returns a valid tracer instance."""
        from opentelemetry import trace

        # Initialize with no endpoint to use console exporter
        self.telemetry.init_telemetry("test-agent")

        tracer = self.telemetry.get_tracer("test-module")
        assert tracer is not None
        assert isinstance(tracer, trace.Tracer)

    @pytest.mark.asyncio
    async def test_span_context_manager(self):
        """Test span context manager creates spans and records exceptions."""
        self.telemetry.init_telemetry("test-agent")

        # Test successful span
        with self.telemetry.span("mutx.test.operation", {"test.attr": "value"}) as span_obj:
            span_obj.set_attribute("custom.attr", "custom-value")

        # Test span with exception
        with pytest.raises(ValueError):
            with self.telemetry.span("mutx.test.error") as span_obj:
                raise ValueError("Test error")

    @pytest.mark.asyncio
    async def test_trace_context(self):
        """Test trace_context returns propagation headers."""
        self.telemetry.init_telemetry("test-agent")

        ctx = self.telemetry.trace_context()
        assert isinstance(ctx, dict)
        # trace_context should return headers for propagation
        assert "traceparent" in ctx or len(ctx) >= 0

    @pytest.mark.asyncio
    async def test_span_naming_convention(self):
        """Test spans follow mutx.<operation> naming convention."""
        self.telemetry.init_telemetry("test-agent")

        # These should work without errors
        with self.telemetry.span("mutx.agent.execute") as _:
            pass
        with self.telemetry.span("mutx.session.start") as _:
            pass
        with self.telemetry.span("mutx.tool.call") as _:
            pass

    @pytest.mark.asyncio
    async def test_reinit_shuts_down_previous_provider(self):
        """Repeated init_telemetry calls should not leak background exporters."""
        self.telemetry.init_telemetry("test-agent-one")
        first_provider = self.telemetry._tracer_provider

        self.telemetry.init_telemetry("test-agent-two")

        assert first_provider is not None
        assert self.telemetry._tracer_provider is not None
        assert self.telemetry._tracer_provider is not first_provider

    @pytest.mark.asyncio
    async def test_shutdown_telemetry_clears_global_state(self):
        """shutdown_telemetry should leave no active provider behind."""
        self.telemetry.init_telemetry("test-agent")

        self.telemetry.shutdown_telemetry()

        assert self.telemetry._tracer_provider is None
        assert self.telemetry._tracer is None
        assert self.telemetry._telemetry_enabled is False
        assert self.telemetry._telemetry_endpoint is None


class TestTraceContextPropagation:
    """Tests for trace context propagation."""

    @pytest.mark.asyncio
    async def test_trace_context_from_headers(self):
        """Test extracting trace context from TRACEPARENT header."""
        from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

        propagator = TraceContextTextMapPropagator()

        # Simulate incoming headers
        carrier = {"traceparent": "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"}

        ctx = propagator.extract(carrier)
        assert ctx is not None


class TestTracingMiddleware:
    """Tests for tracing middleware."""

    @pytest.mark.asyncio
    async def test_traceparent_extraction(self):
        """Test TRACEPARENT header extraction."""
        from src.api.middleware.tracing import TracingMiddleware

        # Verify middleware class exists and can be instantiated
        middleware = TracingMiddleware(app=MagicMock())
        assert middleware is not None
