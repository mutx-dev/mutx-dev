## Summary

Add OpenTelemetry support to MUTX so users can use their own observability backend (Jaeger, Zipkin, Datadog, Grafana Tempo, etc.) instead of being locked into the LGTM stack.

## Motivation

LiteLLM has demonstrated excellent OpenTelemetry integration. We should bring similar flexibility to MUTX.

Reference: https://docs.litellm.ai/docs/proxy/configs

## Goals

1. Standardized Tracing - Use OpenTelemetry (OTEL) as the standard
2. Backend Agnostic - Support any OTEL-compatible backend
3. Agent Workflow Mapping - Map agent workflows to trace spans
4. Metrics Export - Export Prometheus-compatible metrics
5. Log Correlation - Link logs to traces via trace_id

## Architecture

### Core Components

#### 1. OTEL SDK Integration

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def setup_telemetry(service_name: str = "mutx"):
    resource = Resource(attributes={SERVICE_NAME: service_name})
    provider = TracerProvider(resource=resource)
    exporter = get_exporter_from_env()
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    return trace.get_tracer(__name__)
```

#### 2. Environment Configuration

```bash
OTEL_SERVICE_NAME=mutx
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317  # gRPC
# or for Jaeger
OTEL_EXPORTER_JAEGER_AGENT_HOST=localhost
# or for Prometheus
OTEL_EXPORTER_PROMETHEUS_PORT=9464
```

#### 3. Agent Workflow Spans

Each agent operation becomes a span:
- agent.execution
- agent.initialize
- llm.call (with token counts)
- tool.{tool_name}.execution
- agent.response

#### 4. Supported Exporters

| Exporter | Use Case |
|----------|----------|
| OTLP (gRPC/HTTP) | Generic - any OTLP backend |
| Jaeger | Grafana, Jaeger |
| Zipkin | Zipkin |
| Prometheus | Prometheus, Grafana |
| Console | Development |

## Implementation Plan

### Phase 1: Core Infrastructure
1. Add opentelemetry dependencies
2. Create src/api/telemetry.py with base setup
3. Add environment variable configuration

### Phase 2: Agent Instrumentation
1. Add spans to agent initialization
2. Add spans to LLM calls (with token counts)
3. Add spans to tool executions

### Phase 3: HTTP/gRPC Instrumentation
1. Add FastAPI middleware for automatic request tracing
2. Add response time metrics
3. Add error tracking

### Phase 4: Metrics Export
1. Add Prometheus metrics endpoint
2. Export custom metrics (agents running, tokens used, etc.)

### Phase 5: Documentation
1. Update docs with OTEL configuration
2. Add examples for Grafana, Jaeger, Datadog
3. Add docker-compose examples

## Environment Variables

```bash
OTEL_SERVICE_NAME=mutx
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

## Example: Grafana Tempo Integration

```yaml
# docker-compose.yml
services:
  tempo:
    image: grafana/tempo:latest
    ports:
      - "4317:4317"  # OTLP gRPC
      - "4318:4318"  # OTLP HTTP
```

## LiteLLM Pattern (to copy)

LiteLLM uses a simple callback pattern:

```python
# Just add this line to enable OTEL
litellm.callbacks = ["otel"]

# Or via environment
OTEL_EXPORTER="otlp_http"
OTEL_ENDPOINT="https://api.traceloop.com"
OTEL_HEADERS="Authorization=Bearer <api-key>"
```

### Key Features from LiteLLM:

1. **Simple 1-line enable**: `litellm.callbacks = ["otel"]`
2. **Multiple backends**: OTLP HTTP, OTLP gRPC, Traceloop, Laminar
3. **Redaction**: `mask_input=True`, `mask_output=True` to redact PII
4. **Debug mode**: `OTEL_DEBUG=True` to see logging issues
5. **Parent span attributes**: Request/response set on parent span by default

### Environment Variables (LiteLLM style):

```bash
# Choose exporter: otlp_http, otlp_grpc, traceloop, laminar
OTEL_EXPORTER=otlp_http

# For OTLP HTTP
OTEL_ENDPOINT=https://your-otel-collector:4318

# For Traceloop
OTEL_ENDPOINT=https://api.traceloop.com
OTEL_HEADERS=Authorization=Bearer%20<your-api-key>

# Debug
OTEL_DEBUG=True

# Redaction
MUTX_OTEL_MASK_INPUT=True
MUTX_OTEL_MASK_OUTPUT=True
```

## Acceptance Criteria

- [ ] OTEL SDK initialized on startup
- [ ] All agent operations have trace spans
- [ ] Works with Grafana Tempo (via OTLP)
- [ ] Works with Jaeger
- [ ] Works with Prometheus metrics
- [ ] Environment variable configuration works
- [ ] Documentation for common backends
