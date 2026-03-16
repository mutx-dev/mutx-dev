"""Tests for OpenTelemetry telemetry module."""

import pytest
from unittest.mock import patch, MagicMock

from mutx.telemetry import (
    MutxTelemetry,
    TelemetryConfig,
    get_telemetry,
    AgentSpanAttributes,
    create_agent_span,
)


class TestTelemetryConfig:
    def test_default_values(self):
        config = TelemetryConfig()
        assert config.service_name == "mutx-agent"
        assert config.otlp_endpoint is None
        assert config.prometheus_enabled is True
        assert config.console_export_enabled is False
    
    def test_custom_values(self):
        config = TelemetryConfig(
            service_name="test-agent",
            otlp_endpoint="http://localhost:4317",
            prometheus_enabled=False,
        )
        assert config.service_name == "test-agent"
        assert config.otlp_endpoint == "http://localhost:4317"
        assert config.prometheus_enabled is False


class TestMutxTelemetry:
    def setup_method(self):
        # Reset singleton before each test
        MutxTelemetry.reset_instance()
    
    def test_singleton_pattern(self):
        telemetry1 = MutxTelemetry.get_instance()
        telemetry2 = MutxTelemetry.get_instance()
        assert telemetry1 is telemetry2
    
    def test_config_persistence(self):
        config = TelemetryConfig(service_name="my-agent")
        telemetry = MutxTelemetry(config)
        assert telemetry.config.service_name == "my-agent"
    
    @patch('mutx.telemetry.trace')
    @patch('mutx.telemetry.PrometheusMetricReader')
    @patch('mutx.telemetry.MeterProvider')
    @patch('mutx.telemetry.TracerProvider')
    def test_initialize(self, mock_tracer_provider, mock_meter_provider, mock_reader, mock_trace):
        config = TelemetryConfig(prometheus_enabled=False)
        telemetry = MutxTelemetry(config)
        
        mock_tracer_instance = MagicMock()
        mock_tracer_provider.return_value = mock_tracer_instance
        mock_trace.get_tracer.return_value = MagicMock()
        
        telemetry.initialize()
        
        assert telemetry._initialized is True
        mock_tracer_provider.assert_called_once()
    
    @patch('mutx.telemetry.trace')
    def test_start_span(self, mock_trace):
        config = TelemetryConfig(prometheus_enabled=False)
        telemetry = MutxTelemetry(config)
        
        mock_span = MagicMock()
        mock_tracer = MagicMock()
        mock_tracer.start_as_current_span.return_value.__enter__ = MagicMock(return_value=mock_span)
        mock_tracer.start_as_current_span.return_value.__exit__ = MagicMock(return_value=False)
        mock_trace.get_tracer.return_value = mock_tracer
        
        with telemetry.start_span("test-span", attributes={"key": "value"}) as span:
            assert span == mock_span


class TestAgentSpanAttributes:
    def test_attributes(self):
        assert AgentSpanAttributes.AGENT_ID == "agent.id"
        assert AgentSpanAttributes.AGENT_NAME == "agent.name"
        assert AgentSpanAttributes.AGENT_TYPE == "agent.type"
        assert AgentSpanAttributes.AGENT_VERSION == "agent.version"
        assert AgentSpanAttributes.OPERATION_TYPE == "operation.type"
        assert AgentSpanAttributes.COMMAND_ID == "command.id"
        assert AgentSpanAttributes.COMMAND_ACTION == "command.action"
        assert AgentSpanAttributes.COMMAND_STATUS == "command.status"
        assert AgentSpanAttributes.RESULT_STATUS == "result.status"
        assert AgentSpanAttributes.RESULT_ERROR == "result.error"


class TestCreateAgentSpan:
    @patch('mutx.telemetry.trace')
    def test_create_span(self, mock_trace):
        config = TelemetryConfig()
        telemetry = MutxTelemetry(config)
        
        mock_span = MagicMock()
        mock_tracer = MagicMock()
        mock_tracer.start_span.return_value = mock_span
        mock_trace.get_tracer.return_value = mock_tracer
        
        span = create_agent_span(telemetry, "heartbeat", "agent-123", "test-agent")
        
        assert span == mock_span
        mock_tracer.start_span.assert_called_once()
        call_kwargs = mock_tracer.start_span.call_args.kwargs
        assert call_kwargs["name"] == "agent.heartbeat"
        assert call_kwargs["kind"] == trace.SpanKind.CLIENT
