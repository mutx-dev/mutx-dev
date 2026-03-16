"""
OpenTelemetry instrumentation for MUTX agents.
"""

import logging
import os
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Generator, Optional

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.trace import Status, StatusCode, Tracer
from opentelemetry.context import Context
from opentelemetry.trace.propagation import TextMapPropagator

logger = logging.getLogger(__name__)

DEFAULT_SERVICE_NAME = "mutx-agent"


@dataclass
class TelemetryConfig:
    """Configuration for OpenTelemetry."""
    service_name: str = DEFAULT_SERVICE_NAME
    otlp_endpoint: Optional[str] = None
    otlp_headers: Optional[dict] = None
    prometheus_enabled: bool = True
    console_export_enabled: bool = False


class MutxTelemetry:
    """OpenTelemetry wrapper for MUTX agents."""
    
    _instance: Optional["MutxTelemetry"] = None
    
    def __init__(self, config: Optional[TelemetryConfig] = None):
        self.config = config or TelemetryConfig()
        self._tracer: Optional[Tracer] = None
        self._meter_provider: Optional[MeterProvider] = None
        self._initialized = False
    
    @classmethod
    def get_instance(cls, config: Optional[TelemetryConfig] = None) -> "MutxTelemetry":
        if cls._instance is None:
            cls._instance = cls(config)
            cls._instance.initialize()
        return cls._instance
    
    @classmethod
    def reset_instance(cls) -> None:
        cls._instance = None
    
    def initialize(self) -> None:
        if self._initialized:
            return
        
        resource = Resource.create({
            SERVICE_NAME: self.config.service_name,
            "service.version": os.getenv("AGENT_VERSION", "unknown"),
            "deployment.environment": os.getenv("ENVIRONMENT", "development"),
        })
        
        tracer_provider = TracerProvider(resource=resource)
        
        if self.config.otlp_endpoint:
            try:
                from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
                otlp_exporter = OTLPSpanExporter(
                    endpoint=self.config.otlp_endpoint,
                    headers=self.config.otlp_headers or {},
                )
                tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
                logger.info(f"OTLP tracing enabled: {self.config.otlp_endpoint}")
            except Exception as e:
                logger.warning(f"Failed to setup OTLP exporter: {e}")
        
        if self.config.console_export_enabled:
            tracer_provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
        
        trace.set_tracer_provider(tracer_provider)
        self._tracer = trace.get_tracer(__name__)
        
        if self.config.prometheus_enabled:
            try:
                prometheus_reader = PrometheusMetricReader()
                self._meter_provider = MeterProvider(
                    resource=resource,
                    metric_readers=[prometheus_reader],
                )
            except Exception as e:
                logger.warning(f"Failed to setup Prometheus reader: {e}")
        
        self._initialized = True
        logger.info(f"Telemetry initialized for service: {self.config.service_name}")
    
    @property
    def tracer(self) -> Tracer:
        if not self._initialized:
            self.initialize()
        return self._tracer or trace.get_tracer(__name__)
    
    @contextmanager
    def start_span(
        self,
        name: str,
        kind: trace.SpanKind = trace.SpanKind.INTERNAL,
        attributes: Optional[dict] = None,
        context: Optional[Context] = None,
    ) -> Generator[trace.Span, None, None]:
        with self.tracer.start_as_current_span(
            name=name, kind=kind, context=context,
        ) as span:
            if attributes:
                for key, value in attributes.items():
                    span.set_attribute(key, str(value))
            yield span
    
    def create_span(
        self, name: str,
        kind: trace.SpanKind = trace.SpanKind.INTERNAL,
        attributes: Optional[dict] = None,
    ) -> trace.Span:
        return self.tracer.start_span(name, kind=kind)
    
    def set_span_status(self, span: trace.Span, status: StatusCode, message: str = "") -> None:
        span.set_status(Status(status, message))
    
    def record_exception(self, span: trace.Span, exception: Exception) -> None:
        span.record_exception(exception)
        span.set_status(Status(StatusCode.ERROR, str(exception)))
    
    def extract_context(self, carrier: dict, propagator: Optional[TextMapPropagator] = None) -> Context:
        if propagator is None:
            from opentelemetry.trace.propagation import TraceContextTextMapPropagator
            propagator = TraceContextTextMapPropagator()
        return propagator.extract(carrier)
    
    def inject_context(self, carrier: dict) -> None:
        from opentelemetry.trace.propagation import TraceContextTextMapPropagator
        propagator = TraceContextTextMapPropagator()
        propagator.inject(carrier)
    
    def shutdown(self) -> None:
        if self._meter_provider:
            self._meter_provider.shutdown()
        trace.get_tracer_provider().shutdown()
        logger.info("Telemetry shutdown complete")


def get_telemetry(config: Optional[TelemetryConfig] = None) -> MutxTelemetry:
    return MutxTelemetry.get_instance(config)


class AgentSpanAttributes:
    AGENT_ID = "agent.id"
    AGENT_NAME = "agent.name"
    AGENT_TYPE = "agent.type"
    AGENT_VERSION = "agent.version"
    OPERATION_TYPE = "operation.type"
    COMMAND_ID = "command.id"
    COMMAND_ACTION = "command.action"
    COMMAND_STATUS = "command.status"
    RESULT_STATUS = "result.status"
    RESULT_ERROR = "result.error"


def create_agent_span(
    telemetry: MutxTelemetry,
    operation: str,
    agent_id: str,
    agent_name: str,
    attributes: Optional[dict] = None,
) -> trace.Span:
    span_attributes = {
        AgentSpanAttributes.AGENT_ID: agent_id,
        AgentSpanAttributes.AGENT_NAME: agent_name,
        AgentSpanAttributes.OPERATION_TYPE: operation,
    }
    if attributes:
        span_attributes.update(attributes)
    return telemetry.create_span(
        name=f"agent.{operation}",
        kind=trace.SpanKind.CLIENT,
        attributes=span_attributes,
    )
