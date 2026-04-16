# OpenTelemetry Configuration Guide

This guide covers OpenTelemetry integration for distributed tracing in MUTX.

## Overview

MUTX supports OpenTelemetry for distributed tracing, enabling you to track requests across services. The system exports traces to configurable backends like Jaeger, Grafana Tempo, or any OTLP-compatible collector.

## Quick Start

### 1. Install Dependencies

Ensure you have the required packages:

```bash
pip install opentelemetry-api   opentelemetry-sdk   opentelemetry-exporter-otlp   opentelemetry-instrumentation-flask   opentelemetry-instrumentation-requests
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Enable OpenTelemetry
OTEL_ENABLED=true
OTEL_SERVICE_NAME=mutx-api

# Choose your exporter (otlp, jaeger, zipkin)
OTEL_EXPORTER=otlp

# For OTLP (HTTP)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# For Jaeger
OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces

# For Zipkin
OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://localhost:9411/api/v2/spans
```

### 3. Initialize in Your Application

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME

# Configure resource
resource = Resource(attributes={
    SERVICE_NAME: os.getenv("OTEL_SERVICE_NAME", "mutx-api"),
    "deployment.environment": os.getenv("ENVIRONMENT", "development")
})

# Setup provider
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Auto-instrument requests
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()
```

## Environment Variable Configuration

### General Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_ENABLED` | Enable/disable tracing | `false` |
| `OTEL_SERVICE_NAME` | Service name for traces | `mutx-api` |
| `OTEL_SERVICE_NAMESPACE` | Service namespace | - |
| `OTEL_ENVIRONMENT` | Deployment environment | `development` |
| `OTEL_DEBUG` | Enable debug logging | `false` |

### Exporter Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_EXPORTER` | Exporter type: `otlp`, `jaeger`, `zipkin` | `otlp` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP HTTP endpoint | `http://localhost:4318` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP protocol | `http/protobuf` |
| `OTEL_EXPORTER_OTLP_CERT` | TLS certificate path | - |
| `OTEL_EXPORTER_JAEGER_ENDPOINT` | Jaeger HTTP thrift endpoint | `http://localhost:14268` |
| `OTEL_EXPORTER_JAEGER_AGENT_HOST` | Jaeger agent host | `localhost` |
| `OTEL_EXPORTER_JAEGER_AGENT_PORT` | Jaeger agent port | `6831` |
| `OTEL_EXPORTER_ZIPKIN_ENDPOINT` | Zipkin API endpoint | `http://localhost:9411` |

### Sampling Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_TRACES_SAMPLER` | Sampler type: `always_on`, `always_off`, `parentbased_always_on`, `parentbased_always_off`, `traceidratio` | `always_on` |
| `OTEL_TRACES_SAMPLER_ARG` | Sampler argument (e.g., `0.1` for 10%) | - |

### Resource Attributes

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_RESOURCE_ATTRIBUTES` | Comma-separated k=v pairs | - |

### Propagators

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_PROPAGATORS` | Comma-separated: `tracecontext`, `baggage`, `b3`, `jaeger` | `tracecontext` |

## Docker Compose Examples

### Option 1: Grafana Tempo + Grafana + Prometheus

This stack provides full observability with Tempo for traces, Prometheus for metrics, and Grafana for visualization.

```bash
cd infrastructure/docker
docker-compose -f otel-compose.yml up -d tempo
```

Or use the Makefile:

```bash
make up-otel-tempo
```

Set secure Grafana credentials before starting:

```bash
export GRAFANA_ADMIN_USER=mutx_admin
export GRAFANA_ADMIN_PASSWORD='<strong-password>'
```

Access:
- Grafana: http://localhost:3001 (traces via Tempo)
- Tempo: http://localhost:3200

### Option 2: Jaeger (All-in-One)

Quick setup for development:

```bash
docker-compose -f otel-compose.yml up -d jaeger
```

Access:
- Jaeger UI: http://localhost:16686

### Option 3: OpenTelemetry Collector + Prometheus + Grafana

Full stack with collector:

```bash
docker-compose -f otel-compose.yml up -d otel-collector
```

Set secure Grafana credentials before starting:

```bash
export GRAFANA_ADMIN_USER=mutx_admin
export GRAFANA_ADMIN_PASSWORD='<strong-password>'
```

Access:
- Grafana: http://localhost:3002
- Prometheus: http://localhost:9091
- OTLP Receiver: http://localhost:4318

See `infrastructure/docker/otel-compose.yml` for complete configuration.

## Troubleshooting

### Enable Debug Logging

Set `OTEL_DEBUG=true` to enable verbose logging:

```bash
OTEL_DEBUG=true OTEL_ENABLED=true docker-compose up
```

Or add to your `.env`:

```bash
OTEL_DEBUG=true
```

Debug mode outputs:
- Span creation and completion
- Exporter connection attempts
- Sampling decisions
- Propagator details

### Common Issues

#### No traces appearing

1. **Check OTEL_ENABLED is set**
   ```bash
   echo $OTEL_ENABLED  # Should be "true"
   ```

2. **Verify network connectivity**
   ```bash
   curl http://localhost:4318/v1/traces
   ```

3. **Check collector/receiver logs**
   ```bash
   docker logs mutx-otel-collector
   docker logs mutx-tempo
   ```

4. **Verify exporter endpoint**
   ```bash
   # For OTLP
   echo $OTEL_EXPORTER_OTLP_ENDPOINT

   # For Jaeger
   curl -s http://localhost:14268/api/traces/status
   ```

#### High memory usage

Reduce sampling rate:

```bash
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

#### Export timeouts

Increase timeout:

```bash
OTEL_EXPORTER_OTLP_TIMEOUT=30000
```

### Verification Commands

```bash
# Check if spans are being exported
curl -X POST http://localhost:4318/v1/traces   -H "Content-Type: application/json"   -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test"}}]}}]}'
```

### Checking Service Status

```python
from opentelemetry import trace

# Get tracer provider status
provider = trace.get_tracer_provider()
print(f"Tracer provider: {provider}")
```

## Redaction Configuration

By default, certain sensitive attributes are redacted from traces.

### Default Redacted Attributes

The following attributes are NOT exported to tracing backends:

- `http.request.body` - Request body content
- `http.response.body` - Response body content
- `token` - Authentication tokens
- `password` - Password fields
- `api_key` - API keys
- `authorization` - Authorization headers
- `x-api-key` - API key headers

### Custom Redaction

To customize redaction, set environment variables:

```bash
# Add custom sensitive keys
OTEL_REDACTED_ATTRIBUTES=secret,private_token,credit_card

# Disable all redaction (not recommended for production)
OTEL_REDACTION_ENABLED=false
```

### Implementing Custom Redaction

```python
from opentelemetry.sdk.trace import SpanProcessor

class RedactingSpanProcessor(SpanProcessor):
    SENSITIVE_ATTRIBUTES = {
        'password', 'token', 'api_key', 'authorization',
        'secret', 'private_token', 'credit_card'
    }

    def on_end(self, span):
        for key in list(span.attributes.keys()):
            if key.lower() in self.SENSITIVE_ATTRIBUTES:
                span.attributes[key] = '[REDACTED]'

# Add to your tracer provider
provider.add_span_processor(RedactingSpanProcessor())
```

### Redacting Specific Spans

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("sensitive-operation") as span:
    span.set_attribute("password", "[REDACTED]")
    span.set_attribute("api_key", "[REDACTED]")
```

## Integration Examples

### Flask Application

```python
from flask import Flask
from opentelemetry.instrumentation.flask import FlaskInstrumentor

app = Flask(__name__)

# Initialize after creating app
FlaskInstrumentor().instrument_app(app)
```

### FastAPI Application

```python
from fastapi import FastAPI
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI()

FastAPIInstrumentor.instrument_app(app)
```

### Custom Span Creation

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def process_data(data):
    with tracer.start_as_current_span("process_data") as span:
        span.set_attribute("data.type", type(data).__name__)
        span.set_attribute("data.size", len(data))

        # Nested span
        with tracer.start_as_current_span("transform") as transform_span:
            result = transform(data)
            transform_span.set_attribute("result.size", len(result))

        return result
```

## Related Files

- `infrastructure/docker/otel-compose.yml` - Docker Compose stacks
- `.env.example` - Environment variable template
- `src/api/metrics.py` - Prometheus metrics (complementary to traces)
